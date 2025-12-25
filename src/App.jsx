import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer';

// Importações do Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- PÁGINAS ATUALIZADAS ---
import Login from './pages/Login';
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
import MeusChamados from './pages/MeusChamados';

// PÁGINAS TÉCNICAS E ADM
import PainelAnalista from './pages/PainelAnalista';
import AdminUsuarios from './pages/AdminUsuarios';
import DashboardAdm from './pages/DashboardAdm';

// PÁGINAS DE PATRIMÔNIO E LOGÍSTICA
import CadastroEquipamento from './pages/CadastroEquipamento';
import SaidaEquipamento from './pages/SaidaEquipamento';
import Inventario from './pages/Inventario';
import Estoque from './pages/Estoque';

// ✅ NOVAS PÁGINAS COMERCIAIS
import Suporte from './pages/Suporte';
import Termos from './pages/Termos';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="App" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <main style={{ flex: '1' }}>
        <Routes>
          {/* ROTA RAIZ */}
          <Route path="/" element={
            user ? <Navigate to="/home" /> : <Login />
          } />

          {/* 🟢 PAINEL PRINCIPAL (PROTEGIDO) */}
          <Route path="/home" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />

          {/* 🟢 ROTAS DO USUÁRIO COMUM */}
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

          {/* 🔵 ROTA DO ANALISTA */}
          <Route path="/painel-analista" element={
            <ProtectedRoute roleRequired="analista">
              <PainelAnalista />
            </ProtectedRoute>
          } />

          {/* 🔴 ROTAS DO ADM */}
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

          {/* 📦 GESTÃO DE PATRIMÔNIO E INVENTÁRIO */}
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

          {/* 📄 ROTAS PÚBLICAS (SUPORTE E TERMOS) */}
          {/* Deixamos fora do ProtectedRoute para que o usuário possa ler mesmo sem login */}
          <Route path="/ajuda" element={<Suporte />} />
          <Route path="/termos" element={<Termos />} />

          {/* Rota 404 */}
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