import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const BACKEND_URL = "http://localhost:8001";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/transactions/today`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Dashboard</h1>
        <p className="text-gray-600 mt-2">Ringkasan penjualan hari ini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transaksi</p>
              <p className="text-3xl font-bold text-emerald-600" data-testid="total-transactions">{data?.total_transaksi || 0}</p>
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
              <p className="text-sm text-gray-600 mb-1">Total Penjualan</p>
              <p className="text-2xl font-bold text-cyan-600" data-testid="total-sales">Rp {(data?.total_penjualan || 0).toLocaleString('id-ID')}</p>
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
              <p className="text-sm text-gray-600 mb-1">Pembayaran Lunas</p>
              <p className="text-2xl font-bold text-green-600" data-testid="total-paid">Rp {(data?.total_lunas || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-sm border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hutang</p>
              <p className="text-2xl font-bold text-orange-600" data-testid="total-debt">Rp {(data?.total_hutang || 0).toLocaleString('id-ID')}</p>
            </div>
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6 bg-white/80 backdrop-blur-sm border-emerald-100 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Transaksi Hari Ini</h2>
        
        {data?.transaksi && data.transaksi.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-emerald-200">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Waktu</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Items</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Total</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Pembayaran</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Pelanggan</th>
                </tr>
              </thead>
              <tbody>
                {data.transaksi.map((trans, index) => (
                  <tr key={trans.id} className="border-b border-gray-100 hover:bg-emerald-50 transition-colors" data-testid={`transaction-row-${index}`}>
                    <td className="py-4 px-4 text-gray-600">
                      {new Date(trans.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 text-gray-800">
                      {trans.items.slice(0, 2).map(item => item.nama_barang).join(', ')}
                      {trans.items.length > 2 && ` +${trans.items.length - 2} lainnya`}
                    </td>
                    <td className="py-4 px-4 font-semibold text-emerald-600">
                      Rp {trans.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trans.jenis_pembayaran === 'lunas' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {trans.jenis_pembayaran === 'lunas' ? 'Lunas' : 'Hutang'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {trans.nama_pelanggan || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500" data-testid="no-transactions-message">Belum ada transaksi hari ini</p>
          </div>
        )}
      </Card>
    </div>
  );
}