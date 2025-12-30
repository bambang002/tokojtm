import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const BACKEND_URL = "http://localhost:8001";

export default function TransactionsPage() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cart, setCart] = useState([]);
  const [jenisPembayaran, setJenisPembayaran] = useState('lunas');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, []);

  useEffect(() => {
    // Filter products based on search query
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.filter(p => p.jumlah_barang > 0));
      setFilteredProducts(response.data.filter(p => p.jumlah_barang > 0));
    } catch (error) {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      toast.error('Gagal memuat transaksi');
    }
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product_id === product.id);
    if (existingItem) {
      if (existingItem.jumlah >= product.jumlah_barang) {
        toast.error('Stok tidak mencukupi');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id
          ? { ...item, jumlah: item.jumlah + 1, subtotal: (item.jumlah + 1) * item.harga_jual }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        nama_barang: product.nama_barang,
        jumlah: 1,
        harga_jual: product.harga_jual,
        subtotal: product.harga_jual,
        max_stock: product.jumlah_barang
      }]);
    }
    toast.success(`${product.nama_barang} ditambahkan`);
  };

  const updateCartQuantity = (productId, newQuantity) => {
    const item = cart.find(i => i.product_id === productId);
    if (newQuantity > item.max_stock) {
      toast.error('Stok tidak mencukupi');
      return;
    }
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item =>
      item.product_id === productId
        ? { ...item, jumlah: newQuantity, subtotal: newQuantity * item.harga_jual }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmitTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }

    if (jenisPembayaran === 'hutang' && !namaPelanggan.trim()) {
      toast.error('Nama pelanggan harus diisi untuk pembayaran hutang');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        items: cart.map(item => ({
          product_id: item.product_id,
          nama_barang: item.nama_barang,
          jumlah: item.jumlah,
          harga_jual: item.harga_jual,
          subtotal: item.subtotal
        })),
        total: calculateTotal(),
        jenis_pembayaran: jenisPembayaran,
        nama_pelanggan: jenisPembayaran === 'hutang' ? namaPelanggan : null
      };

      const response = await axios.post(`${BACKEND_URL}/api/transactions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Transaksi berhasil!');
      
      // Prepare receipt data
      setCurrentReceipt({
        ...response.data,
        items: cart,
        total: calculateTotal(),
        jenis_pembayaran: jenisPembayaran,
        nama_pelanggan: namaPelanggan,
        tanggal: new Date().toISOString()
      });
      
      // Reset form and show receipt
      setCart([]);
      setJenisPembayaran('lunas');
      setNamaPelanggan('');
      setSearchQuery('');
      setShowForm(false);
      setShowReceipt(true);
      
      fetchProducts();
      fetchTransactions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaksi gagal');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleSaveReceipt = () => {
    const receiptContent = document.getElementById('receipt-content');
    if (receiptContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      printWindow.document.write('<html><head><title>Nota Transaksi</title>');
      printWindow.document.write('<style>body{font-family:Arial,sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}.text-right{text-align:right;}.total{font-weight:bold;font-size:18px;}</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write(receiptContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/export/transactions/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaksi.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export berhasil');
    } catch (error) {
      toast.error('Export gagal');
    }
  };

  const handleExportPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/export/transactions/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaksi.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export berhasil');
    } catch (error) {
      toast.error('Export gagal');
    }
  };

  const viewTransactionDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailDialog(true);
  };

  const handleDeleteTransaction = async (transactionId) => {
    const result = await Swal.fire({
      title: 'Hapus Transaksi?',
      text: 'Apakah Anda yakin ingin menghapus transaksi ini? Data tidak dapat dikembalikan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${BACKEND_URL}/api/transactions/${transactionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          title: 'Terhapus!',
          text: 'Transaksi berhasil dihapus.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        fetchTransactions();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.detail || 'Tidak dapat menghapus transaksi.', 'error');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Transaksi</h1>
          <p className="text-gray-600 mt-2">Kelola penjualan dan riwayat transaksi</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          data-testid="new-transaction-button"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          + Transaksi Baru
        </Button>
      </div>

      {/* Transaction Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Transaksi Baru</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-6 mt-4">
            {/* Product List with Search */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Pilih Produk</h3>
              
              {/* Search Box */}
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Cari barang..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="product-search-input"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="p-4 cursor-pointer hover:shadow-lg transition-all duration-300 border-emerald-100 hover:border-emerald-300"
                      onClick={() => addToCart(product)}
                      data-testid={`product-item-${product.id}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-800">{product.nama_barang}</p>
                          <p className="text-sm text-gray-600">Stok: {product.jumlah_barang}</p>
                        </div>
                        <p className="font-semibold text-emerald-600">Rp {product.harga_jual.toLocaleString('id-ID')}</p>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Barang tidak ditemukan</p>
                )}
              </div>
            </div>

            {/* Cart */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Keranjang</h3>
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {cart.length > 0 ? (
                  cart.map((item) => (
                    <Card key={item.product_id} className="p-4 border-cyan-100" data-testid={`cart-item-${item.product_id}`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-gray-800">{item.nama_barang}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product_id)}
                          data-testid={`remove-cart-${item.product_id}`}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input
                          type="number"
                          step="0.01"
                          value={item.jumlah}
                          onChange={(e) => updateCartQuantity(item.product_id, parseFloat(e.target.value) || 0)}
                          data-testid={`cart-quantity-${item.product_id}`}
                          className="w-24"
                        />
                        <span className="text-gray-600">×</span>
                        <span className="text-gray-700">Rp {item.harga_jual.toLocaleString('id-ID')}</span>
                        <span className="ml-auto font-semibold text-emerald-600">Rp {item.subtotal.toLocaleString('id-ID')}</span>
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8" data-testid="empty-cart-message">Keranjang kosong</p>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-emerald-600" data-testid="cart-total">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>

                <div>
                  <Label>Jenis Pembayaran</Label>
                  <Select value={jenisPembayaran} onValueChange={setJenisPembayaran}>
                    <SelectTrigger className="mt-1.5" data-testid="payment-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lunas" data-testid="payment-type-lunas">Lunas</SelectItem>
                      <SelectItem value="hutang" data-testid="payment-type-hutang">Hutang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {jenisPembayaran === 'hutang' && (
                  <div>
                    <Label>Nama Pelanggan</Label>
                    <Input
                      value={namaPelanggan}
                      onChange={(e) => setNamaPelanggan(e.target.value)}
                      data-testid="customer-name-input"
                      placeholder="Masukkan nama pelanggan"
                      className="mt-1.5"
                    />
                  </div>
                )}

                <Button
                  onClick={handleSubmitTransaction}
                  data-testid="submit-transaction-button"
                  className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl h-11 font-medium"
                >
                  Proses Transaksi
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Nota Transaksi</DialogTitle>
          </DialogHeader>
          
          {currentReceipt && (
            <div id="receipt-content" className="mt-4">
              <div className="text-center mb-6 pb-4 border-b-2 border-gray-300">
                <h2 className="text-2xl font-bold text-emerald-600">Smart Kasir</h2>
                <p className="text-sm text-gray-600">Sistem Kasir & Inventory Modern</p>
              </div>

              <div className="mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">No. Transaksi:</span>
                  <span className="font-medium">{currentReceipt.id?.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Tanggal:</span>
                  <span className="font-medium">
                    {new Date(currentReceipt.tanggal).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {currentReceipt.nama_pelanggan && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Pelanggan:</span>
                    <span className="font-medium">{currentReceipt.nama_pelanggan}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Pembayaran:</span>
                  <span className={`font-medium ${currentReceipt.jenis_pembayaran === 'lunas' ? 'text-green-600' : 'text-orange-600'}`}>
                    {currentReceipt.jenis_pembayaran === 'lunas' ? 'LUNAS' : 'HUTANG'}
                  </span>
                </div>
              </div>

              <table className="w-full mb-4 text-sm">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-2">Item</th>
                    <th className="text-center py-2">Qty</th>
                    <th className="text-right py-2">Harga</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReceipt.items.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200">
                      <td className="py-2">{item.nama_barang}</td>
                      <td className="text-center py-2">{item.jumlah}</td>
                      <td className="text-right py-2">Rp {item.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="text-right py-2">Rp {item.subtotal.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-gray-300 pt-3 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span>TOTAL:</span>
                  <span className="text-emerald-600">Rp {currentReceipt.total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600 border-t pt-4">
                <p>Terima kasih atas pembelian Anda!</p>
                <p className="mt-1">Barang yang sudah dibeli tidak dapat dikembalikan</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              onClick={handlePrintReceipt}
              data-testid="print-receipt-button"
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl"
            >
              Cetak Nota
            </Button>
            <Button
              onClick={handleSaveReceipt}
              data-testid="save-receipt-button"
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl"
            >
              Simpan Nota
            </Button>
            <Button
              onClick={() => setShowReceipt(false)}
              variant="outline"
              className="flex-1 rounded-xl"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Detail Transaksi</DialogTitle>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="mt-4">
              <div className="bg-gray-50 p-4 rounded-xl mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">ID Transaksi:</p>
                    <p className="font-medium">{selectedTransaction.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tanggal:</p>
                    <p className="font-medium">
                      {new Date(selectedTransaction.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Jenis Pembayaran:</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTransaction.jenis_pembayaran === 'lunas'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedTransaction.jenis_pembayaran === 'lunas' ? 'Lunas' : 'Hutang'}
                    </span>
                  </div>
                  {selectedTransaction.nama_pelanggan && (
                    <div>
                      <p className="text-gray-600">Pelanggan:</p>
                      <p className="font-medium">{selectedTransaction.nama_pelanggan}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-3">Items:</h4>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{item.nama_barang}</p>
                        <p className="text-sm text-gray-600">{item.jumlah} × Rp {item.harga_jual.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-semibold text-emerald-600">Rp {item.subtotal.toLocaleString('id-ID')}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-emerald-600">Rp {selectedTransaction.total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setShowDetailDialog(false)}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>
          <div className="flex gap-3">
            <Button
              onClick={handleExportExcel}
              data-testid="export-excel-button"
              variant="outline"
              className="border-emerald-400 text-emerald-600 hover:bg-emerald-50 rounded-xl"
            >
              Export Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              data-testid="export-pdf-button"
              variant="outline"
              className="border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-xl"
            >
              Export PDF
            </Button>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">No</th>
                  <th className="text-left py-4 px-6 font-semibold">Tanggal</th>
                  <th className="text-left py-4 px-6 font-semibold">Items</th>
                  <th className="text-left py-4 px-6 font-semibold">Total</th>
                  <th className="text-left py-4 px-6 font-semibold">Pembayaran</th>
                  <th className="text-left py-4 px-6 font-semibold">Pelanggan</th>
                  <th className="text-left py-4 px-6 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trans, index) => (
                  <tr key={trans.id} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors" data-testid={`transaction-row-${index}`}>
                    <td className="py-4 px-6 text-gray-700 font-medium">{index + 1}</td>
                    <td className="py-4 px-6 text-gray-600">
                      {new Date(trans.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-4 px-6 text-gray-800">
                      {trans.items.slice(0, 2).map(item => `${item.nama_barang} (${item.jumlah})`).join(', ')}
                      {trans.items.length > 2 && ` +${trans.items.length - 2}`}
                    </td>
                    <td className="py-4 px-6 font-semibold text-emerald-600">
                      Rp {trans.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trans.jenis_pembayaran === 'lunas'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {trans.jenis_pembayaran === 'lunas' ? 'Lunas' : 'Hutang'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {trans.nama_pelanggan || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => viewTransactionDetail(trans)}
                          data-testid={`view-detail-${index}`}
                          size="sm"
                          variant="outline"
                          className="border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-lg"
                        >
                          Detail
                        </Button>
                        <Button
                          onClick={() => handleDeleteTransaction(trans.id)}
                          data-testid={`delete-transaction-${index}`}
                          size="sm"
                          variant="outline"
                          className="border-red-400 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500" data-testid="no-transactions-message">Belum ada transaksi</p>
          </div>
        )}
      </Card>
    </div>
  );
}
