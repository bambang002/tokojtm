import { Outlet, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Layout({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-emerald-100 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">Web Toko Jatimas</h2>
            </div>
          </div>

          <nav className="space-y-2">
            <Link to="/dashboard" data-testid="nav-dashboard">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/dashboard') 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Dashboard
              </div>
            </Link>

            <Link to="/products" data-testid="nav-products">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/products') 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Data Barang
              </div>
            </Link>

            <Link to="/transactions" data-testid="nav-transactions">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/transactions') 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Transaksi
              </div>
            </Link>

            <Link to="/debts" data-testid="nav-debts">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/debts') 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Hutang
              </div>
            </Link>

            <Link to="/reports" data-testid="nav-reports">
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                isActive('/reports') 
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-emerald-50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Laporan
              </div>
            </Link>
          </nav>
        </div>

        <div className="absolute bottom-0 w-64 p-6 border-t border-emerald-100">
          <div className="bg-emerald-50 rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Logged in as</p>
            <p className="font-semibold text-emerald-700" data-testid="user-name">{user?.nama}</p>
            <p className="text-xs text-gray-500" data-testid="user-email">{user?.email}</p>
          </div>
          <Button
            onClick={onLogout}
            data-testid="logout-button"
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl"
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}