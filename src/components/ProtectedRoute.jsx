// src/components/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
    // Acessa o estado de autenticação (user e loading)
    const { user, loading } = useAuth();

    // 1. Se estiver carregando (verificando o estado do Firebase), mostra um status
    if (loading) {
        // Usa um div simples para evitar que a tela fique branca
        return <div style={{ padding: '50px', textAlign: 'center' }}>Verificando acesso...</div>;
    }

    // 2. Se o usuário NÃO estiver logado, redireciona para a Home (/)
    if (!user) {
        // O componente Navigate é usado para redirecionar
        return <Navigate to="/" replace />;
    }

    // 3. Se o usuário estiver logado, renderiza a página solicitada (children)
    return children;
};

export default ProtectedRoute;