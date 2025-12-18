// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../api/firebase'; // Importa auth e db
import { doc, getDoc } from 'firebase/firestore';

// 1. Cria o Contexto
const AuthContext = createContext();

// 2. Cria um Custom Hook para facilitar o uso
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Armazena dados do Firestore (como role)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // 🔍 VERIFICAÇÃO CRÍTICA: O usuário ainda existe no banco de dados?
                    const userRef = doc(db, "usuarios", currentUser.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        // Usuário ok, salvamos os dados do banco
                        setUser(currentUser);
                        setUserData(userSnap.data());
                    } else {
                        // 🚨 FOI EXCLUÍDO DO BANCO: Forçamos o logout
                        console.warn("Usuário excluído do Firestore. Encerrando sessão...");
                        await signOut(auth);
                        setUser(null);
                        setUserData(null);
                    }
                } catch (error) {
                    console.error("Erro ao validar usuário:", error);
                    setUser(null);
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        userData, // Agora você pode acessar o cargo direto daqui: userData.role
        loading,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontSize: '1.2em',
                    backgroundColor: '#f4f7fa',
                    color: '#3490dc',
                    fontFamily: 'sans-serif'
                }}>
                    <div className="loader"></div> {/* Opcional: Adicionar um spinner CSS */}
                    <p>Verificando credenciais...</p>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;