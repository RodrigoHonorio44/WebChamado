// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// PÁGINAS EXISTENTES
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
import MeusChamados from './pages/MeusChamados';

// PÁGINAS TÉCNICAS E ADM
import PainelAnalista from './pages/PainelAnalista';
import AdminUsuarios from './pages/AdminUsuarios';
import DashboardAdm from './pages/DashboardAdm';

// PÁGINAS DE PATRIMÔNIO
import CadastroEquipamento from './pages/CadastroEquipamento';
import SaidaEquipamento from './pages/SaidaEquipamento';
import BaixaPatrimonio from './pages/BaixaPatrimonio'; // 🆕 Importando a nova página de Baixa

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

            {/* 📦 GESTÃO DE PATRIMÔNIO (Entrada) */}
            <Route path="/admin/cadastro-patrimonio" element={
              <ProtectedRoute roleRequired="adm">
                <CadastroEquipamento />
              </ProtectedRoute>
            } />

            {/* 📤 GESTÃO DE PATRIMÔNIO (Saída/Movimentação) */}
            <Route path="/admin/saida-patrimonio" element={
              <ProtectedRoute roleRequired="adm">
                <SaidaEquipamento />
              </ProtectedRoute>
            } />

            {/* ⚠️ GESTÃO DE PATRIMÔNIO (Baixa Definitiva) */}
            <Route path="/admin/baixa-patrimonio" element={ // 🆕 Rota para Baixa
              <ProtectedRoute roleRequired="adm">
                <BaixaPatrimonio />
              </ProtectedRoute>
            } />

            {/* Rota 404 */}
            <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>404 - Página Não Encontrada</h2></div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;