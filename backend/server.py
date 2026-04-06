from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt
import pandas as pd
import io
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==========================================
# MODELS
# ==========================================

class UserRegister(BaseModel):
    nama: str
    email: EmailStr
    alamat: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    email: str
    alamat: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    nama_barang: str
    jumlah_barang: float
    harga_beli: float
    harga_jual: float
    gambar: Optional[str] = None

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama_barang: str
    jumlah_barang: float
    harga_beli: float
    harga_jual: float
    gambar: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TransactionItem(BaseModel):
    product_id: str
    nama_barang: str
    jumlah: float
    harga_jual: float
    subtotal: float

class TransactionCreate(BaseModel):
    items: List[TransactionItem]
    total: float
    jenis_pembayaran: str  # "lunas" or "hutang"
    nama_pelanggan: Optional[str] = None

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[TransactionItem]
    total: float
    jenis_pembayaran: str
    nama_pelanggan: Optional[str] = None
    tanggal: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DebtPayment(BaseModel):
    jumlah_dibayar: float
    catatan: str

class Debt(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    nama_pelanggan: str
    total_hutang: float
    dibayar: float = 0
    sisa_hutang: float
    status: str = "belum_lunas"  # "belum_lunas" or "lunas"
    cicilan: List[dict] = []
    tanggal_hutang: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Customer(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama_pelanggan: str
    nomor_telepon: Optional[str] = None
    alamat: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ==========================================
# AUTH FUNCTIONS
# ==========================================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"email": email}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ==========================================
# AUTH ENDPOINTS
# ==========================================
@api_router.post("/auth/register")
async def register(user: UserRegister):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    
    user_obj = User(
        nama=user.nama,
        email=user.email,
        alamat=user.alamat
    )
    doc = user_obj.model_dump()
    doc['password'] = hash_password(user.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    return {"message": "Registrasi berhasil"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    
    token = create_access_token({"sub": user['email']})
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "nama": user['nama'],
            "email": user['email'],
            "alamat": user['alamat']
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


# ==========================================
# PRODUCTS ENDPOINTS
# ==========================================
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    product_obj = Product(**product.model_dump())
    doc = product_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=List[Product])
async def get_products(current_user: dict = Depends(get_current_user)):
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.model_dump()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.post("/products/import")
async def import_products(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    try:
        contents = await file.read()
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Format file harus .csv atau .xlsx")
        
        required_columns = ['nama_barang', 'jumlah_barang', 'harga_beli', 'harga_jual']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"File harus memiliki kolom: {', '.join(required_columns)}")
        
        imported_count = 0
        for _, row in df.iterrows():
            product_obj = Product(
                nama_barang=str(row['nama_barang']),
                jumlah_barang=float(row['jumlah_barang']),
                harga_beli=float(row['harga_beli']),
                harga_jual=float(row['harga_jual']),
                gambar=str(row.get('gambar', '')) if pd.notna(row.get('gambar')) else None
            )
            doc = product_obj.model_dump()
            doc['created_at'] = doc['created_at'].isoformat()
            await db.products.insert_one(doc)
            imported_count += 1
        
        return {"message": f"Berhasil import {imported_count} produk"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error importing file: {str(e)}")


# ==========================================
# CUSTOMERS ENDPOINTS (DENGAN AUTO-SYNC)
# ==========================================
@api_router.get("/customers", response_model=List[Customer])
async def get_customers(current_user: dict = Depends(get_current_user)):
    # 1. Ambil daftar pelanggan yang sudah ada di tabel 'customers'
    existing_customers = await db.customers.find({}).to_list(1000)
    existing_names = [c["nama_pelanggan"].lower() for c in existing_customers if c.get("nama_pelanggan")]
    
    # 2. SINKRONISASI OTOMATIS: Cari nama dari tabel 'debts' (Hutang Lama)
    old_debts = await db.debts.find({}, {"nama_pelanggan": 1}).to_list(10000)
    
    for debt in old_debts:
        nama = debt.get("nama_pelanggan")
        # Jika ada nama pelanggan lama yang BELUM ADA di tabel customers yang baru
        if nama and isinstance(nama, str) and nama.strip():
            if nama.strip().lower() not in existing_names:
                new_cust = Customer(nama_pelanggan=nama.strip())
                doc = new_cust.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                
                # Masukkan nama tersebut ke tabel customers
                await db.customers.insert_one(doc)
                existing_names.append(nama.strip().lower()) # Tandai agar tidak di-input dua kali
            
    # 3. Tarik ulang data pelanggan yang sudah lengkap & diurutkan sesuai abjad
    final_customers = await db.customers.find({}, {"_id": 0}).sort("nama_pelanggan", 1).to_list(1000)
    
    for customer in final_customers:
        if isinstance(customer['created_at'], str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
            
    return final_customers


# ==========================================
# TRANSACTIONS ENDPOINTS
# ==========================================
@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, current_user: dict = Depends(get_current_user)):
    # Update stock
    for item in transaction.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.nama_barang} not found")
        
        new_stock = product['jumlah_barang'] - item.jumlah
        if new_stock < 0:
            raise HTTPException(status_code=400, detail=f"Stok {item.nama_barang} tidak mencukupi")
        
        await db.products.update_one(
            {"id": item.product_id},
            {"$set": {"jumlah_barang": new_stock}}
        )

    # Simpan pelanggan baru jika belum ada
    if transaction.nama_pelanggan and transaction.nama_pelanggan.strip():
        nama_p = transaction.nama_pelanggan.strip()
        existing_customer = await db.customers.find_one({
            "nama_pelanggan": {"$regex": f"^{nama_p}$", "$options": "i"}
        })
        
        if not existing_customer:
            new_customer = Customer(nama_pelanggan=nama_p)
            customer_doc = new_customer.model_dump()
            customer_doc['created_at'] = customer_doc['created_at'].isoformat()
            await db.customers.insert_one(customer_doc)

    transaction_obj = Transaction(**transaction.model_dump())
    doc = transaction_obj.model_dump()
    doc['tanggal'] = doc['tanggal'].isoformat()
    await db.transactions.insert_one(doc)
    
    # Create debt if payment type is "hutang"
    if transaction.jenis_pembayaran == "hutang":
        if not transaction.nama_pelanggan:
            raise HTTPException(status_code=400, detail="Nama pelanggan wajib diisi untuk transaksi hutang")
            
        debt_obj = Debt(
            transaction_id=transaction_obj.id,
            nama_pelanggan=transaction.nama_pelanggan.strip(),
            total_hutang=transaction.total,
            sisa_hutang=transaction.total
        )
        debt_doc = debt_obj.model_dump()
        debt_doc['tanggal_hutang'] = debt_doc['tanggal_hutang'].isoformat()
        await db.debts.insert_one(debt_doc)
    
    return transaction_obj

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).sort("tanggal", -1).to_list(1000)
    for trans in transactions:
        if isinstance(trans['tanggal'], str):
            trans['tanggal'] = datetime.fromisoformat(trans['tanggal'])
    return transactions

@api_router.get("/transactions/today")
async def get_today_transactions(current_user: dict = Depends(get_current_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    today_transactions = []
    total_lunas = 0
    total_hutang = 0
    
    for trans in transactions:
        tanggal = datetime.fromisoformat(trans['tanggal']) if isinstance(trans['tanggal'], str) else trans['tanggal']
        if today_start <= tanggal < today_end:
            today_transactions.append(trans)
            if trans['jenis_pembayaran'] == 'lunas':
                total_lunas += trans['total']
            else:
                total_hutang += trans['total']
    
    return {
        "total_transaksi": len(today_transactions),
        "total_penjualan": total_lunas + total_hutang,
        "total_lunas": total_lunas,
        "total_hutang": total_hutang,
        "transaksi": today_transactions
    }

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    transaction = await db.transactions.find_one({"id": transaction_id})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    result = await db.transactions.delete_one({"id": transaction_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete transaction")
    
    if transaction.get('jenis_pembayaran') == 'hutang':
        await db.debts.delete_one({"transaction_id": transaction_id})
    
    return {"message": "Transaction deleted successfully"}


# ==========================================
# DEBTS ENDPOINTS
# ==========================================
@api_router.get("/debts", response_model=List[Debt])
async def get_debts(current_user: dict = Depends(get_current_user)):
    debts = await db.debts.find({}, {"_id": 0}).sort("tanggal_hutang", -1).to_list(1000)
    for debt in debts:
        if isinstance(debt['tanggal_hutang'], str):
            debt['tanggal_hutang'] = datetime.fromisoformat(debt['tanggal_hutang'])
    return debts

@api_router.get("/debts/{debt_id}", response_model=Debt)
async def get_debt(debt_id: str, current_user: dict = Depends(get_current_user)):
    debt = await db.debts.find_one({"id": debt_id}, {"_id": 0})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    if isinstance(debt['tanggal_hutang'], str):
        debt['tanggal_hutang'] = datetime.fromisoformat(debt['tanggal_hutang'])
    return debt

@api_router.post("/debts/{debt_id}/pay")
async def pay_debt(debt_id: str, payment: DebtPayment, current_user: dict = Depends(get_current_user)):
    debt = await db.debts.find_one({"id": debt_id})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    new_dibayar = debt['dibayar'] + payment.jumlah_dibayar
    new_sisa = debt['total_hutang'] - new_dibayar
    
    if new_sisa < 0:
        raise HTTPException(status_code=400, detail="Jumlah pembayaran melebihi sisa hutang")
    
    cicilan_entry = {
        "tanggal": datetime.now(timezone.utc).isoformat(),
        "jumlah": payment.jumlah_dibayar,
        "catatan": payment.catatan
    }
    
    new_status = "lunas" if new_sisa == 0 else "belum_lunas"
    
    await db.debts.update_one(
        {"id": debt_id},
        {
            "$set": {
                "dibayar": new_dibayar,
                "sisa_hutang": new_sisa,
                "status": new_status
            },
            "$push": {"cicilan": cicilan_entry}
        }
    )
    
    return {"message": "Pembayaran berhasil dicatat", "sisa_hutang": new_sisa}

@api_router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: str, current_user: dict = Depends(get_current_user)):
    debt = await db.debts.find_one({"id": debt_id})
    if not debt:
        raise HTTPException(status_code=404, detail="Debt not found")
    
    result = await db.debts.delete_one({"id": debt_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Failed to delete debt")
    
    return {"message": "Debt deleted successfully"}


# ==========================================
# REPORTS ENDPOINTS
# ==========================================
@api_router.get("/reports/financial")
async def get_financial_report(period: str, start_date: str = None, end_date: str = None, current_user: dict = Depends(get_current_user)):
    from datetime import datetime, timezone, timedelta
    
    now = datetime.now(timezone.utc)
    
    if period == "daily":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=1)
    elif period == "weekly":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = start + timedelta(days=7)
    elif period == "monthly":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end = start.replace(year=now.year + 1, month=1)
        else:
            end = start.replace(month=now.month + 1)
    elif period == "yearly":
        start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end = start.replace(year=now.year + 1)
    elif period == "custom" and start_date and end_date:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
    else:
        raise HTTPException(status_code=400, detail="Invalid period or missing dates")
    
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    filtered_transactions = []
    total_revenue = 0
    total_profit = 0
    total_lunas = 0
    total_hutang = 0
    payment_summary = {"lunas": 0, "hutang": 0}
    
    for trans in transactions:
        tanggal = datetime.fromisoformat(trans['tanggal']) if isinstance(trans['tanggal'], str) else trans['tanggal']
        if start <= tanggal < end:
            filtered_transactions.append(trans)
            total_revenue += trans['total']
            
            profit = 0
            for item in trans['items']:
                product = await db.products.find_one({"id": item['product_id']})
                if product:
                    item_profit = (item['harga_jual'] - product['harga_beli']) * item['jumlah']
                    profit += item_profit
            
            total_profit += profit
            
            if trans['jenis_pembayaran'] == 'lunas':
                total_lunas += trans['total']
                payment_summary['lunas'] += 1
            else:
                total_hutang += trans['total']
                payment_summary['hutang'] += 1
    
    debts = await db.debts.find({}, {"_id": 0}).to_list(10000)
    debts_unpaid = sum(d['sisa_hutang'] for d in debts if d['status'] == 'belum_lunas')
    debts_paid = sum(d['dibayar'] for d in debts if d['status'] == 'lunas')
    
    return {
        "period": period,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "summary": {
            "total_transactions": len(filtered_transactions),
            "total_revenue": total_revenue,
            "total_profit": total_profit,
            "total_lunas": total_lunas,
            "total_hutang": total_hutang,
            "debts_unpaid": debts_unpaid,
            "debts_paid": debts_paid
        },
        "payment_summary": payment_summary,
        "transactions": filtered_transactions
    }


# ==========================================
# EXPORT ENDPOINTS
# ==========================================
@api_router.get("/export/transactions/excel")
async def export_transactions_excel(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    data = []
    for trans in transactions:
        items_str = ", ".join([f"{item['nama_barang']} ({item['jumlah']}x)" for item in trans['items']])
        data.append({
            "ID": trans['id'],
            "Tanggal": trans['tanggal'],
            "Items": items_str,
            "Total": trans['total'],
            "Jenis Pembayaran": trans['jenis_pembayaran'],
            "Nama Pelanggan": trans.get('nama_pelanggan', '-')
        })
    
    df = pd.DataFrame(data)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Transaksi')
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue()),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transaksi.xlsx"}
    )

@api_router.get("/export/transactions/pdf")
async def export_transactions_pdf(current_user: dict = Depends(get_current_user)):
    transactions = await db.transactions.find({}, {"_id": 0}).to_list(10000)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    title = Paragraph("<b>Laporan Transaksi</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 20))
    
    data = [["Tanggal", "Items", "Total", "Pembayaran", "Pelanggan"]]
    for trans in transactions[:50]:
        items_str = ", ".join([f"{item['nama_barang']}" for item in trans['items'][:2]])
        data.append([
            trans['tanggal'][:10] if isinstance(trans['tanggal'], str) else str(trans['tanggal'])[:10],
            items_str[:30],
            f"Rp {trans['total']:,.0f}",
            trans['jenis_pembayaran'],
            trans.get('nama_pelanggan', '-')[:20]
        ])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=transaksi.pdf"}
    )

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
