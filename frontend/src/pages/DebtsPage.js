import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

const BACKEND_URL = "http://localhost:8001";

// Axios Interceptor untuk otomatis handle token expired
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk mengontrol Accordion (pelanggan mana yang sedang dibuka)
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/debts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDebts(response.data);
    } catch (error) {
      toast.error('Gagal memuat data hutang');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (parseFloat(paymentAmount) > selectedDebt.sisa_hutang) {
      toast.error('Jumlah pembayaran melebihi sisa hutang');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${BACKEND_URL}/api/debts/${selectedDebt.id}/pay`,
        {
          jumlah_dibayar: parseFloat(paymentAmount),
          catatan: paymentNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Pembayaran berhasil dicatat');
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNote('');
      setSelectedDebt(null);
      fetchDebts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Pembayaran gagal');
    }
  };

  const openPaymentDialog = (debt) => {
    setSelectedDebt(debt);
    setShowPaymentDialog(true);
  };

  const closePaymentDialog = () => {
    setShowPaymentDialog(false);
    setPaymentAmount('');
    setPaymentNote('');
    setSelectedDebt(null);
  };

  const handleDeleteDebt = async (debtId, namaPelanggan) => {
    const result = await Swal.fire({
      title: 'Hapus Data Hutang?',
      text: `Apakah Anda yakin ingin menghapus data hutang transaksi ini untuk "${namaPelanggan}"? Data tidak dapat dikembalikan.`,
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
        await axios.delete(`${BACKEND_URL}/api/debts/${debtId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        Swal.fire({
          title: 'Terhapus!',
          text: 'Data hutang berhasil dihapus.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        
        fetchDebts();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.detail || 'Tidak dapat menghapus data hutang.', 'error');
      }
    }
  };

  const toggleCustomer = (namaPelanggan) => {
    if (expandedCustomer === namaPelanggan) {
      setExpandedCustomer(null); // Tutup jika sudah terbuka
    } else {
      setExpandedCustomer(namaPelanggan); // Buka pelanggan yang diklik
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

  // --- LOGIKA PENGELOMPOKKAN DATA BERDASARKAN PELANGGAN ---
  const groupedDebts = debts.reduce((acc, debt) => {
    const nama = debt.nama_pelanggan || 'Tanpa Nama';
    if (!acc[nama]) {
      acc[nama] = {
        nama_pelanggan: nama,
        total_hutang_semua: 0,
        total_dibayar_semua: 0,
        sisa_hutang_semua: 0,
        items: []
      };
    }
    acc[nama].total_hutang_semua += debt.total_hutang;
    acc[nama].total_dibayar_semua += debt.dibayar;
    acc[nama].sisa_hutang_semua += debt.sisa_hutang;
    acc[nama].items.push(debt);
    return acc;
  }, {});

  // Ubah object hasil group menjadi array agar bisa di-map di JSX
  const groupedDebtsArray = Object.values(groupedDebts).sort((a, b) => 
    a.nama_pelanggan.localeCompare(b.nama_pelanggan)
  );

  // Kalkulasi statistik global
  const totalHutang = debts.filter(d => d.status === 'belum_lunas').reduce((sum, d) => sum + d.sisa_hutang, 0);
  const totalLunas = debts.filter(d => d.status === 'lunas').length;
  const totalBelumLunas = debts.filter(d => d.status === 'belum_lunas').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Manajemen Hutang</h1>
        <p className="text-gray-600 mt-2">Kelola pembayaran hutang pelanggan</p>
      </div>

      {/* --- KARTU STATISTIK ATAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Piutang Tersisa</p>
              <p className="text-2xl font-bold text-orange-600">Rp {totalHutang.toLocaleString('id-ID')}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-red-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nota Belum Lunas</p>
              <p className="text-3xl font-bold text-red-600">{totalBelumLunas}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-green-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nota Sudah Lunas</p>
              <p className="text-3xl font-bold text-green-600">{totalLunas}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* --- DIALOG PEMBAYARAN --- */}
      <Dialog open={showPaymentDialog} onOpenChange={closePaymentDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Catat Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedDebt && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600">Pelanggan</p>
                <p className="font-semibold text-gray-800">{selectedDebt.nama_pelanggan}</p>
                <p className="text-sm text-gray-600 mt-2">Sisa Hutang Transaksi Ini</p>
                <p className="text-2xl font-bold text-orange-600">Rp {selectedDebt.sisa_hutang.toLocaleString('id-ID')}</p>
              </div>

              <div>
                <Label htmlFor="payment-amount">Jumlah Dibayar</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Masukkan jumlah"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="payment-note">Catatan</Label>
                <Textarea
                  id="payment-note"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Catatan pembayaran (opsional)"
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePayment}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl"
                >
                  Catat Pembayaran
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closePaymentDialog}
                  className="flex-1 rounded-xl"
                >
                  Batal
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- DAFTAR HUTANG (GROUPED BY CUSTOMER) --- */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Daftar Hutang Pelanggan</h2>

        {groupedDebtsArray.length > 0 ? (
          <div className="space-y-4">
            {groupedDebtsArray.map((group, index) => {
              const isExpanded = expandedCustomer === group.nama_pelanggan;
              const isAllPaid = group.sisa_hutang_semua === 0;

              return (
                <div key={index} className="border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Bagian Header Pelanggan (Bisa Diklik) */}
                  <div 
                    className={`p-5 cursor-pointer flex items-center justify-between transition-colors ${
                      isExpanded ? 'bg-emerald-50' : 'bg-white'
                    }`}
                    onClick={() => toggleCustomer(group.nama_pelanggan)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        isAllPaid ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {group.nama_pelanggan.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-800">{group.nama_pelanggan}</h3>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                            isAllPaid ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            {isAllPaid ? 'LUNAS SEMUA' : `${group.items.filter(i => i.status === 'belum_lunas').length} NOTA AKTIF`}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Total Transaksi: {group.items.length} Nota
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Keseluruhan Sisa Hutang</p>
                        <p className={`text-xl font-bold ${isAllPaid ? 'text-green-600' : 'text-orange-600'}`}>
                          Rp {group.sisa_hutang_semua.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Detail (Muncul saat Accordion Terbuka) */}
                  {isExpanded && (
                    <div className="bg-gray-50 p-6 border-t border-gray-100">
                      <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Rincian Transaksi:</h4>
                      <div className="space-y-4">
                        {group.items.map((debt, idx) => (
                          <Card
                            key={debt.id}
                            className={`p-5 border-l-4 transition-all duration-300 ${
                              debt.status === 'lunas' ? 'border-l-green-400 bg-white' : 'border-l-orange-400 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Tanggal</p>
                                    <p className="font-semibold text-gray-800">
                                      {new Date(debt.tanggal_hutang).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Total Transaksi</p>
                                    <p className="font-semibold text-gray-800">Rp {debt.total_hutang.toLocaleString('id-ID')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Terbayar</p>
                                    <p className="font-semibold text-green-600">Rp {debt.dibayar.toLocaleString('id-ID')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Sisa Hutang</p>
                                    <p className={`font-bold ${debt.status === 'lunas' ? 'text-green-600' : 'text-orange-600'}`}>
                                      Rp {debt.sisa_hutang.toLocaleString('id-ID')}
                                    </p>
                                  </div>
                                </div>

                                {/* Riwayat Cicilan untuk Nota Spesifik */}
                                {debt.cicilan && debt.cicilan.length > 0 && (
                                  <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                                    <p className="text-xs font-bold text-gray-600 mb-2">Riwayat Pembayaran Nota Ini:</p>
                                    <div className="space-y-2">
                                      {debt.cicilan.map((cicil, cIdx) => (
                                        <div key={cIdx} className="flex justify-between items-center text-sm">
                                          <div>
                                            <span className="text-gray-600 mr-2">
                                              {new Date(cicil.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="text-gray-500 italic">{cicil.catatan ? `- ${cicil.catatan}` : ''}</span>
                                          </div>
                                          <span className="font-semibold text-green-600">+ Rp {cicil.jumlah.toLocaleString('id-ID')}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Tombol Aksi per Transaksi */}
                              <div className="ml-6 flex flex-col gap-2 min-w-[120px]">
                                {debt.status === 'belum_lunas' && (
                                  <Button
                                    onClick={() => openPaymentDialog(debt)}
                                    size="sm"
                                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg shadow-sm"
                                  >
                                    Bayar
                                  </Button>
                                )}
                                <Button
                                  onClick={() => handleDeleteDebt(debt.id, debt.nama_pelanggan)}
                                  size="sm"
                                  variant="outline"
                                  className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 rounded-lg"
                                >
                                  Hapus
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500">Belum ada data hutang</p>
          </div>
        )}
      </Card>
    </div>
  );
}
