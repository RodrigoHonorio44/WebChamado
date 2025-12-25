import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

// Firebase para o logout automático
import { auth } from './api/firebase';
import { signOut } from 'firebase/auth';

// Importações do Toastify
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- PÁGINAS ---
import Login from './pages/Login';
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
import MeusChamados from './pages/MeusChamados';
import PainelAnalista from './pages/PainelAnalista';
import AdminUsuarios from './pages/AdminUsuarios';
import DashboardAdm from './pages/DashboardAdm';
import CadastroEquipamento from './pages/CadastroEquipamento';
import SaidaEquipamento from './pages/SaidaEquipamento';
import Inventario from './pages/Inventario';
import Estoque from './pages/Estoque';
import Suporte from './pages/Suporte';
import Termos from './pages/Termos';

const AppContent = () => {
  const { user, loading } = useAuth();
  const timerRef = useRef(null);

  // --- LÓGICA DE LOGOUT POR INATIVIDADE (30 MINUTOS) ---
  const resetarTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Só ativa o timer se houver um usuário logado
    if (user) {
      timerRef.current = setTimeout(() => {
        handleLogoutAutomatico();
      }, 30 * 60 * 1000); // 30 minutos
    }
  };

  const handleLogoutAutomatico = () => {
    signOut(auth).then(() => {
      toast.info("Sessão encerrada por inatividade.");
    });
  };

  useEffect(() => {
    if (user) {
      // Eventos que resetam o cronômetro de inatividade
      window.addEventListener("mousemove", resetarTimer);
      window.addEventListener("keypress", resetarTimer);
      window.addEventListener("scroll", resetarTimer);
      window.addEventListener("click", resetarTimer);

      resetarTimer();
    }

    return () => {
      window.removeEventListener("mousemove", resetarTimer);
      window.removeEventListener("keypress", resetarTimer);
      window.removeEventListener("scroll", resetarTimer);
      window.removeEventListener("click", resetarTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  if (loading) return null;

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: '1' }}>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" /> : <Login />} />

          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          <Route path="/abrir-chamado" element={
            <ProtectedRoute>
              <AbrirChamado />
            </ProtectedRoute>
          } />

          <Route path="/meus-chamados" element={
            <ProtectedRoute>
              <MeusChamados />
            </ProtectedRoute>
          } />

          <Route path="/painel-analista" element={
            <ProtectedRoute roleRequired="analista">
              <PainelAnalista />
            </ProtectedRoute>
          } />

          <Route path="/admin/usuarios" element={
            <ProtectedRoute roleRequired="adm">
              <AdminUsuarios />
            </ProtectedRoute>
          } />

          <Route path="/admin/dashboard" element={
            <ProtectedRoute roleRequired="adm">
              <DashboardAdm />
            </ProtectedRoute>
          } />

          <Route path="/admin/cadastro-patrimonio" element={
            <ProtectedRoute roleRequired="adm">
              <CadastroEquipamento />
            </ProtectedRoute>
          } />

          <Route path="/admin/saida-patrimonio" element={
            <ProtectedRoute roleRequired="adm">
              <SaidaEquipamento />
            </ProtectedRoute>
          } />

          <Route path="/admin/inventario" element={
            <ProtectedRoute roleRequired="adm">
              <Inventario />
            </ProtectedRoute>
          } />

          <Route path="/admin/estoque" element={
            <ProtectedRoute roleRequired="adm">
              <Estoque />
            </ProtectedRoute>
          } />

          <Route path="/ajuda" element={<Suporte />} />
          <Route path="/termos" element={<Termos />} />

          <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>404 - Página Não Encontrada</h2></div>} />
        </Routes>
      </main>

      <Footer />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
      />
    </div>
  );
};

const App = () => (
  <Router>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </Router>
);

export default App;