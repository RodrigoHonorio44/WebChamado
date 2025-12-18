// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// PÁGINAS EXISTENTES
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
import MeusChamados from './pages/MeusChamados';

// 🆕 NOVAS PÁGINAS (Crie estes arquivos na pasta pages)
import PainelAnalista from './pages/PainelAnalista'; // Fila de chamados
import AdminUsuarios from './pages/AdminUsuarios';   // Gerenciar analistas
import DashboardAdm from './pages/DashboardAdm';     // Gráficos e stats

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            {/* Rota Pública */}
            <Route path="/" element={<Home />} />

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

            {/* 🔵 ROTA DO ANALISTA (Fila Geral) */}
            <Route path="/painel-analista" element={
              <ProtectedRoute roleRequired="analista">
                <PainelAnalista />
              </ProtectedRoute>
            } />

            {/* 🔴 ROTAS DO ADM (Gestão e Dashboard) */}
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

            <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>404 - Página Não Encontrada</h2></div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;