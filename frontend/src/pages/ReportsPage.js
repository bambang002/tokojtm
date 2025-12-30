import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const BACKEND_URL = "http://localhost:8001";

export default function ReportsPage() {
  const [period, setPeriod] = useState('daily');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/reports/financial?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportData(response.data);
    } catch (error) {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  const periodNames = {
    daily: 'Harian',
    weekly: 'Mingguan',
    monthly: 'Bulanan',
    yearly: 'Tahunan'
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Laporan Keuangan</h1>
          <p className="text-gray-600 mt-2">Analisis keuangan bisnis Anda</p>
        </div>
        <div className="w-64">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger data-testid="period-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Harian</SelectItem>
              <SelectItem value="weekly">Mingguan</SelectItem>
              <SelectItem value="monthly">Bulanan</SelectItem>
              <SelectItem value="yearly">Tahunan</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
                  <p className="text-3xl font-bold text-emerald-600" data-testid="report-total-transactions">{reportData.summary.total_transactions}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-cyan-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-cyan-600" data-testid="report-revenue">Rp {reportData.summary.total_revenue.toLocaleString('id-ID')}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-green-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Keuntungan</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="report-profit">Rp {reportData.summary.total_profit.toLocaleString('id-ID')}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hutang Belum Lunas</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="report-debts">Rp {reportData.summary.debts_unpaid.toLocaleString('id-ID')}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Lunas</p>
                    <p className="text-lg font-bold text-green-600">{reportData.payment_summary.lunas} Transaksi</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">Rp {reportData.summary.total_lunas.toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
                  <div>
                    <p className="text-sm text-gray-600">Hutang</p>
                    <p className="text-lg font-bold text-orange-600">{reportData.payment_summary.hutang} Transaksi</p>
                  </div>
                  <p className="text-xl font-bold text-orange-600">Rp {reportData.summary.total_hutang.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-white/80 backdrop-blur-sm border-cyan-100 shadow-lg">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Periode Laporan</h3>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Jenis Laporan:</span>
                  <span className="font-semibold text-gray-800">{periodNames[period]}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Dari:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(reportData.start_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Sampai:</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(reportData.end_date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Transaction List */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Rincian Transaksi</h2>
            {reportData.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold">No</th>
                      <th className="text-left py-4 px-6 font-semibold">Tanggal</th>
                      <th className="text-left py-4 px-6 font-semibold">Items</th>
                      <th className="text-left py-4 px-6 font-semibold">Total</th>
                      <th className="text-left py-4 px-6 font-semibold">Pembayaran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.transactions.map((trans, index) => (
                      <tr key={trans.id} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Tidak ada transaksi pada periode ini</p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}