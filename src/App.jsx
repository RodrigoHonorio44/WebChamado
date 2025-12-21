import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Footer from './components/Footer'; // ✅ Importação do novo Footer

// Importações do Toastify
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
import BaixaPatrimonio from './pages/BaixaPatrimonio';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        {/* ✅ Wrapper com Flexbox para empurrar o footer para baixo */}
        <div className="App" style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh' // Ocupa no mínimo a altura da tela inteira
        }}>

          {/* ✅ O conteúdo principal cresce para ocupar o espaço disponível */}
          <main style={{ flex: '1' }}>
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

              {/* 📦 GESTÃO DE PATRIMÔNIO */}
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

              <Route path="/admin/baixa-patrimonio" element={
                <ProtectedRoute roleRequired="adm">
                  <BaixaPatrimonio />
                </ProtectedRoute>
              } />

              {/* Rota 404 */}
              <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>404 - Página Não Encontrada</h2></div>} />
            </Routes>
          </main>

          {/* ✅ Footer inserido fora do <main> para ficar no rodapé global */}
          <Footer />

          {/* 🔔 Container de Notificações Global */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;