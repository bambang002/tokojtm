import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import TransactionsPage from "./pages/TransactionsPage";
import DebtsPage from "./pages/DebtsPage";
import ReportsPage from "./pages/ReportsPage";
import Layout from "./components/Layout";

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!token ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/dashboard" />} />
          
          {token ? (
            <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="debts" element={<DebtsPage />} />
              <Route path="reports" element={<ReportsPage />} />
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;