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

export default function DebtsPage() {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
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
      text: `Apakah Anda yakin ingin menghapus data hutang "${namaPelanggan}"? Data tidak dapat dikembalikan.`,
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

  const totalHutang = debts.filter(d => d.status === 'belum_lunas').reduce((sum, d) => sum + d.sisa_hutang, 0);
  const totalLunas = debts.filter(d => d.status === 'lunas').length;
  const totalBelumLunas = debts.filter(d => d.status === 'belum_lunas').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Manajemen Hutang</h1>
        <p className="text-gray-600 mt-2">Kelola pembayaran hutang pelanggan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hutang</p>
              <p className="text-2xl font-bold text-orange-600" data-testid="total-debt-amount">Rp {totalHutang.toLocaleString('id-ID')}</p>
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
              <p className="text-sm text-gray-600 mb-1">Belum Lunas</p>
              <p className="text-3xl font-bold text-red-600" data-testid="unpaid-debt-count">{totalBelumLunas}</p>
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
              <p className="text-sm text-gray-600 mb-1">Sudah Lunas</p>
              <p className="text-3xl font-bold text-green-600" data-testid="paid-debt-count">{totalLunas}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Dialog */}
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
                <p className="text-sm text-gray-600 mt-2">Sisa Hutang</p>
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
                  data-testid="payment-amount-input"
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
                  data-testid="payment-note-input"
                  placeholder="Catatan pembayaran (opsional)"
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handlePayment}
                  data-testid="submit-payment-button"
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

      {/* Debts List */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Daftar Hutang</h2>

        {debts.length > 0 ? (
          <div className="space-y-4">
            {debts.map((debt, index) => (
              <Card
                key={debt.id}
                className={`p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                  debt.status === 'lunas' ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                }`}
                data-testid={`debt-card-${index}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800" data-testid={`debt-customer-${index}`}>{debt.nama_pelanggan}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        debt.status === 'lunas'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {debt.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Total Hutang</p>
                        <p className="font-semibold text-gray-800">Rp {debt.total_hutang.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sudah Dibayar</p>
                        <p className="font-semibold text-green-600">Rp {debt.dibayar.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sisa Hutang</p>
                        <p className="font-semibold text-orange-600" data-testid={`debt-remaining-${index}`}>Rp {debt.sisa_hutang.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Tanggal</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(debt.tanggal_hutang).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {debt.cicilan && debt.cicilan.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Riwayat Cicilan:</p>
                        <div className="space-y-2">
                          {debt.cicilan.map((cicil, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-200" data-testid={`payment-history-${index}-${idx}`}>
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    {new Date(cicil.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                  {cicil.catatan && <p className="text-sm text-gray-500 mt-1">{cicil.catatan}</p>}
                                </div>
                                <p className="font-semibold text-green-600">Rp {cicil.jumlah.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex flex-col gap-2">
                    {debt.status === 'belum_lunas' && (
                      <Button
                        onClick={() => openPaymentDialog(debt)}
                        data-testid={`pay-debt-button-${index}`}
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        Bayar
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteDebt(debt.id, debt.nama_pelanggan)}
                      data-testid={`delete-debt-button-${index}`}
                      variant="outline"
                      className="border-red-400 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500" data-testid="no-debts-message">Belum ada data hutang</p>
          </div>
        )}
      </Card>
    </div>
  );
}