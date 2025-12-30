# Smart Kasir - Sistem Kasir & Inventory Modern

Aplikasi kasir dan inventory berbasis React + FastAPI + MongoDB dengan fitur lengkap untuk mengelola penjualan, stok barang, dan hutang pelanggan.

## 📋 Fitur Utama

- 🔐 Autentikasi (Login & Register dengan JWT)
- 📊 Dashboard penjualan real-time
- 📦 Manajemen produk dengan import Excel
- 💰 Transaksi penjualan (Lunas & Hutang)
- 💳 Manajemen hutang pelanggan dengan cicilan
- 📄 Export laporan (Excel & PDF)

---

## 🚀 Instalasi Lokal

### Prerequisites

Pastikan Anda sudah menginstall:

1. **Node.js** (v16 atau lebih baru)
   - Download: https://nodejs.org/
   - Cek instalasi: `node --version` dan `npm --version`

2. **Python** (v3.9 atau lebih baru)
   - Download: https://www.python.org/downloads/
   - Cek instalasi: `python --version` atau `python3 --version`

3. **MongoDB** (v5.0 atau lebih baru)
   - Download: https://www.mongodb.com/try/download/community
   - Atau gunakan MongoDB Atlas (cloud): https://www.mongodb.com/atlas

4. **Yarn** (Package manager)
   ```bash
   npm install -g yarn
   ```

---

### 📥 Step 1: Download Project

Download atau clone project ini ke komputer Anda.

```bash
# Jika menggunakan Git
git clone <repository-url>
cd smart-kasir

# Atau extract file zip jika di-download
```

---

### 🔧 Step 2: Setup Backend (FastAPI)

1. **Masuk ke folder backend:**
   ```bash
   cd backend
   ```

2. **Buat virtual environment (opsional tapi direkomendasikan):**
   
   **Windows:**
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
   
   **Mac/Linux:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup file .env:**
   
   File `.env` sudah ada di folder `backend/`. Edit jika perlu:
   
   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="kasir_inventory_db"
   CORS_ORIGINS="*"
   JWT_SECRET="kasir-secret-key-change-this-in-production"
   ```
   
   **Catatan:**
   - Jika menggunakan MongoDB Atlas (cloud), ganti `MONGO_URL` dengan connection string dari Atlas
   - Contoh: `MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/"`

---

### 🎨 Step 3: Setup Frontend (React)

1. **Buka terminal baru, masuk ke folder frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   ```
   
   Atau jika ada error, coba:
   ```bash
   npm install
   ```

3. **Setup file .env:**
   
   File `.env` sudah ada di folder `frontend/`. Edit untuk development lokal:
   
   ```env
   REACT_APP_BACKEND_URL=http://localhost:8001
   WDS_SOCKET_PORT=3000
   REACT_APP_ENABLE_VISUAL_EDITS=true
   ENABLE_HEALTH_CHECK=false
   ```

---

### 🗄️ Step 4: Jalankan MongoDB

**Opsi A: MongoDB Lokal**

1. **Windows:**
   - Buka MongoDB Compass atau
   - Jalankan dari Services atau
   - Terminal: `mongod`

2. **Mac/Linux:**
   ```bash
   # Menggunakan Homebrew
   brew services start mongodb-community
   
   # Atau manual
   mongod --dbpath /path/to/data/directory
   ```

3. **Cek MongoDB berjalan:**
   ```bash
   # Akses MongoDB shell
   mongosh
   # atau
   mongo
   ```

**Opsi B: MongoDB Atlas (Cloud)**
- Tidak perlu menjalankan service lokal
- Pastikan connection string di `backend/.env` sudah benar
- Whitelist IP address Anda di MongoDB Atlas dashboard

---

### ▶️ Step 5: Jalankan Aplikasi

**1. Jalankan Backend (Terminal 1):**

```bash
cd backend
# Aktifkan virtual environment jika belum (lihat Step 2)
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Anda akan melihat:
```
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Application startup complete.
```

**2. Jalankan Frontend (Terminal 2 - terminal baru):**

```bash
cd frontend
yarn start
```

Atau:
```bash
npm start
```

Browser akan otomatis membuka di `http://localhost:3000`

---

### ✅ Step 6: Gunakan Aplikasi

1. **Buka browser:** `http://localhost:3000`

2. **Register akun baru:**
   - Klik "Daftar sekarang"
   - Isi: Nama, Email, Alamat, Password
   - Klik "Daftar"

3. **Login:**
   - Masukkan email dan password
   - Klik "Masuk"

4. **Mulai menggunakan:**
   - Dashboard: Lihat ringkasan penjualan
   - Data Barang: Tambah produk atau import dari Excel
   - Transaksi: Buat penjualan baru
   - Hutang: Kelola pembayaran hutang pelanggan

---

## 📁 Struktur Project

```
smart-kasir/
├── backend/
│   ├── server.py          # Main FastAPI application
│   ├── requirements.txt   # Python dependencies
│   └── .env              # Backend environment variables
│
├── frontend/
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── App.css       # Global styles
│   ├── package.json      # Node dependencies
│   └── .env             # Frontend environment variables
│
└── README.md            # Documentation (file ini)
```

---

## 🔧 Troubleshooting

### Backend tidak jalan:

**Error: "No module named 'fastapi'"**
```bash
pip install -r requirements.txt
```

**Error: "Connection refused MongoDB"**
- Pastikan MongoDB sudah running
- Cek `MONGO_URL` di `backend/.env`

**Error: Port 8001 sudah digunakan**
```bash
# Ganti port di perintah uvicorn
uvicorn server:app --reload --port 8002
# Jangan lupa update REACT_APP_BACKEND_URL di frontend/.env
```

### Frontend tidak jalan:

**Error: "command not found: yarn"**
```bash
npm install -g yarn
# Atau gunakan npm
npm start
```

**Error: "Module not found"**
```bash
# Hapus node_modules dan install ulang
rm -rf node_modules
yarn install
```

**Error: "Cannot connect to backend"**
- Pastikan backend sudah running di port 8001
- Cek `REACT_APP_BACKEND_URL` di `frontend/.env`
- Lihat console browser (F12) untuk detail error

### MongoDB:

**Error: "MongoServerError: Authentication failed"**
- Cek username/password di connection string
- Pastikan user memiliki akses ke database

**Error: "Connection timeout"**
- Jika pakai Atlas: Whitelist IP address di dashboard
- Pastikan internet connection stabil

---

## 📝 Import Excel Format

Untuk import produk via Excel, gunakan format berikut:

| nama_barang | jumlah_barang | harga_beli | harga_jual | gambar (opsional) |
|-------------|---------------|------------|------------|-------------------|
| Mie Instan  | 100           | 2500       | 3000       | https://...       |
| Sabun Mandi | 50            | 8000       | 10000      |                   |

**Kolom wajib:** nama_barang, jumlah_barang, harga_beli, harga_jual

**Format file:** .xlsx atau .csv

---

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS, Shadcn UI, Axios
- **Backend:** FastAPI, Motor (MongoDB async), JWT, bcrypt
- **Database:** MongoDB
- **Export:** pandas (Excel), reportlab (PDF)

---

## 📞 Support

Jika mengalami masalah:
1. Cek log error di terminal backend
2. Buka Developer Tools browser (F12) dan lihat Console
3. Pastikan semua dependencies ter-install dengan benar
4. Restart backend dan frontend

---

## 📄 License

MIT License - Free to use and modify

---

**Selamat mencoba Smart Kasir! 🎉**

