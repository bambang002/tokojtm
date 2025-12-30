import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const BACKEND_URL = "http://localhost:8001";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    nama_barang: '',
    jumlah_barang: '',
    harga_beli: '',
    harga_jual: '',
    gambar: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (error) {
      toast.error('Gagal memuat data produk');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const payload = {
        nama_barang: formData.nama_barang,
        jumlah_barang: parseFloat(formData.jumlah_barang),
        harga_beli: parseFloat(formData.harga_beli),
        harga_jual: parseFloat(formData.harga_jual),
        gambar: formData.gambar || null
      };

      if (editingProduct) {
        await axios.put(`${BACKEND_URL}/api/products/${editingProduct.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Produk berhasil diupdate');
      } else {
        await axios.post(`${BACKEND_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Produk berhasil ditambahkan');
      }

      setOpenDialog(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menyimpan produk');
    }
  };

  const handleDelete = async (id, namaBarang) => {
    const result = await Swal.fire({
      title: 'Hapus Produk?',
      text: `Apakah Anda yakin ingin menghapus "${namaBarang}"? Data tidak dapat dikembalikan.`,
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
        await axios.delete(`${BACKEND_URL}/api/products/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          title: 'Terhapus!',
          text: 'Produk berhasil dihapus.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        fetchProducts();
      } catch (error) {
        Swal.fire('Gagal!', 'Tidak dapat menghapus produk.', 'error');
      }
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      nama_barang: product.nama_barang,
      jumlah_barang: product.jumlah_barang.toString(),
      harga_beli: product.harga_beli.toString(),
      harga_jual: product.harga_jual.toString(),
      gambar: product.gambar || ''
    });
    setOpenDialog(true);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/products/import`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(response.data.message);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal import file');
    }
    e.target.value = '';
  };

  const resetForm = () => {
    setFormData({
      nama_barang: '',
      jumlah_barang: '',
      harga_beli: '',
      harga_jual: '',
      gambar: ''
    });
    setEditingProduct(null);
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
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Data Barang</h1>
          <p className="text-gray-600 mt-2">Kelola inventori produk Anda</p>
        </div>
        <div className="flex gap-3">
          <label htmlFor="file-upload">
            <div className="px-5 py-2.5 bg-white border-2 border-cyan-400 text-cyan-600 rounded-xl font-medium cursor-pointer hover:bg-cyan-50 transition-all duration-300 shadow-md hover:shadow-lg" data-testid="import-button">
              Import Excel
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <Button
            onClick={() => {
              resetForm();
              setOpenDialog(true);
            }}
            data-testid="add-product-button"
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
          >
            + Tambah Barang
          </Button>
        </div>
      </div>

      {/* Dialog for Add/Edit Product */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        setOpenDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{editingProduct ? 'Edit Barang' : 'Tambah Barang'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nama_barang">Nama Barang</Label>
              <Input
                id="nama_barang"
                data-testid="product-name-input"
                value={formData.nama_barang}
                onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jumlah_barang">Jumlah</Label>
                <Input
                  id="jumlah_barang"
                  type="number"
                  step="0.01"
                  data-testid="product-quantity-input"
                  value={formData.jumlah_barang}
                  onChange={(e) => setFormData({ ...formData, jumlah_barang: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="harga_beli">Harga Beli</Label>
                <Input
                  id="harga_beli"
                  type="number"
                  step="0.01"
                  data-testid="product-buy-price-input"
                  value={formData.harga_beli}
                  onChange={(e) => setFormData({ ...formData, harga_beli: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="harga_jual">Harga Jual</Label>
              <Input
                id="harga_jual"
                type="number"
                step="0.01"
                data-testid="product-sell-price-input"
                value={formData.harga_jual}
                onChange={(e) => setFormData({ ...formData, harga_jual: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="gambar">URL Gambar (opsional)</Label>
              <Input
                id="gambar"
                data-testid="product-image-input"
                value={formData.gambar}
                onChange={(e) => setFormData({ ...formData, gambar: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" data-testid="product-submit-button" className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl">
                {editingProduct ? 'Update' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="flex-1 rounded-xl">
                Batal
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg overflow-hidden">
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold">No</th>
                  <th className="text-left py-4 px-6 font-semibold">Gambar</th>
                  <th className="text-left py-4 px-6 font-semibold">Nama Barang</th>
                  <th className="text-left py-4 px-6 font-semibold">Stok</th>
                  <th className="text-left py-4 px-6 font-semibold">Harga Beli</th>
                  <th className="text-left py-4 px-6 font-semibold">Harga Jual</th>
                  <th className="text-left py-4 px-6 font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, index) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors" data-testid={`product-row-${index}`}>
                    <td className="py-4 px-6 text-gray-700 font-medium">{index + 1}</td>
                    <td className="py-4 px-6">
                      {product.gambar ? (
                        <img src={product.gambar} alt={product.nama_barang} className="w-14 h-14 rounded-lg object-cover shadow-md" />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 font-medium text-gray-800" data-testid={`product-name-${index}`}>{product.nama_barang}</td>
                    <td className="py-4 px-6 text-gray-700" data-testid={`product-stock-${index}`}>{product.jumlah_barang}</td>
                    <td className="py-4 px-6 text-gray-700">Rp {product.harga_beli.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6 font-semibold text-emerald-600">Rp {product.harga_jual.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-6">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(product)}
                          data-testid={`edit-product-${index}`}
                          size="sm"
                          variant="outline"
                          className="border-cyan-400 text-cyan-600 hover:bg-cyan-50 rounded-lg"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id, product.nama_barang)}
                          data-testid={`delete-product-${index}`}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500" data-testid="no-products-message">Belum ada produk. Tambahkan produk pertama Anda!</p>
          </div>
        )}
      </Card>
    </div>
  );
}
