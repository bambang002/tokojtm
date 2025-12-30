import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const BACKEND_URL = "http://localhost:8001";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    alamat: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/register`, {
        nama: formData.nama,
        email: formData.email,
        alamat: formData.alamat,
        password: formData.password
      });

      toast.success('Registrasi berhasil! Silakan login');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-cyan-100">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-emerald-600 bg-clip-text text-transparent">Daftar Akun</h1>
            <p className="text-gray-600 mt-2">Buat akun baru untuk memulai</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nama" className="text-gray-700">Nama Lengkap</Label>
              <Input
                id="nama"
                name="nama"
                type="text"
                data-testid="register-nama-input"
                value={formData.nama}
                onChange={handleChange}
                placeholder="John Doe"
                className="mt-1.5 h-11 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                data-testid="register-email-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="mt-1.5 h-11 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="alamat" className="text-gray-700">Alamat</Label>
              <Input
                id="alamat"
                name="alamat"
                type="text"
                data-testid="register-alamat-input"
                value={formData.alamat}
                onChange={handleChange}
                placeholder="Jl. Contoh No. 123"
                className="mt-1.5 h-11 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                data-testid="register-password-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1.5 h-11 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">Konfirmasi Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                data-testid="register-confirm-password-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="mt-1.5 h-11 border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500"
                required
              />
            </div>

            <Button
              type="submit"
              data-testid="register-submit-button"
              disabled={loading}
              className="w-full h-11 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" data-testid="login-link" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Login di sini
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}