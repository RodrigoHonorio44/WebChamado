// src/contexts/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../api/firebase'; // Importa a instância de autenticação

// 1. Cria o Contexto
const AuthContext = createContext();

// 2. Cria um Custom Hook para facilitar o uso
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Indica se o estado do usuário está sendo verificado

    // ➡️ Lógica Principal: Monitorar o Estado de Autenticação do Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false); // O estado inicial foi verificado
        });
        return unsubscribe;
    }, []);

    // Função de Logout
    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* 🛑 CORREÇÃO APLICADA AQUI 🛑 */}
            {loading ?
                (
                    <div style={{
                        // Garante que ocupe a tela toda e seja centralizado
                        minHeight: '100vh',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: '1.2em',
                        backgroundColor: '#f4f7fa', // Adiciona uma cor de fundo clara
                        color: '#3490dc' // Cor do texto
                    }}>
                        Carregando autenticação... Por favor, aguarde.
                    </div>
                )
                :
                children
            }
        </AuthContext.Provider>
    );
};

export default AuthContext;