// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 🛑 NOVAS IMPORTAÇÕES NECESSÁRIAS
import { AuthProvider } from './contexts/AuthContext'; // 1. O Provedor de Contexto
import ProtectedRoute from './components/ProtectedRoute'; // 2. O Componente de Proteção de Rotas

// Importe as páginas que você vai usar
import Home from './pages/Home';
import AbrirChamado from './pages/AbrirChamado';
// Importe ou crie esta página se ainda não existir
import MeusChamados from './pages/AbrirChamado';

// Importe os estilos globais (opcional, mas recomendado)
// import './styles/Global.css'; 

const App = () => {
  return (
    // O BrowserRouter habilita a navegação por rota
    <Router>
      {/* 🛑 PASSO CRÍTICO: Envolver toda a aplicação com o AuthProvider 🛑 */}
      <AuthProvider>
        <div className="App">
          {/* O componente Routes gerencia qual componente será renderizado */}
          <Routes>

            {/* Rota Pública: Exibe a página Home (contém Login) */}
            <Route path="/" element={<Home />} />

            {/* Rota Protegida: Exibe a página AbrirChamado SOMENTE se logado */}
            <Route
              path="/abrir-chamado"
              element={
                <ProtectedRoute>
                  <AbrirChamado />
                </ProtectedRoute>
              }
            />

            {/* Rota Protegida: Acompanhar Chamados SOMENTE se logado */}
            <Route
              path="/meus-chamados"
              element={
                <ProtectedRoute>
                  <MeusChamados />
                </ProtectedRoute>
              }
            />

            {/* Opcional: Rota para páginas não encontradas (404) */}
            <Route path="*" element={<div>404 - Página Não Encontrada</div>} />

          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;