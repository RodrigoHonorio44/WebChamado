// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 🛑 IMPORTAÇÕES DE CONTEXTO E PROTEÇÃO
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// IMPORTAÇÃO DAS PÁGINAS
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
// ✅ AGORA SIM CORRIGIDO: Importando do arquivo de lista, não do de abertura
import MeusChamados from './pages/MeusChamados';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>

            {/* Rota Pública: Home (Login/Hero) */}
            <Route path="/" element={<Home />} />

            {/* Rota Protegida: Formulário de Abertura */}
            <Route
              path="/abrir-chamado"
              element={
                <ProtectedRoute>
                  <AbrirChamado />
                </ProtectedRoute>
              }
            />

            {/* Rota Protegida: Lista de Chamados (Acompanhamento) */}
            <Route
              path="/meus-chamados"
              element={
                <ProtectedRoute>
                  <MeusChamados />
                </ProtectedRoute>
              }
            />

            {/* Rota para páginas não encontradas */}
            <Route path="*" element={<div style={{ padding: '50px', textAlign: 'center' }}><h2>404 - Página Não Encontrada</h2></div>} />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;