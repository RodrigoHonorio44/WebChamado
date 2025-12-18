// src/components/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../api/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProtectedRoute = ({ children, roleRequired }) => {
    const { user, loading: authLoading } = useAuth();
    const [roleLoading, setRoleLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!user) {
                setRoleLoading(false);
                return;
            }

            try {
                // Busca o documento do usuário para conferir o cargo (role)
                const docRef = doc(db, "usuarios", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const role = docSnap.data().role;
                    setUserRole(role);

                    // Lógica de autorização:
                    // 1. Se não exigir role específico, está autorizado.
                    // 2. Se for ADM, tem acesso a tudo.
                    // 3. Se o role do usuário for igual ao exigido pela rota.
                    if (!roleRequired || role === 'adm' || role === roleRequired) {
                        setIsAuthorized(true);
                    } else {
                        setIsAuthorized(false);
                    }
                } else {
                    // Caso o usuário exista no Auth mas não no Firestore (foi deletado)
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Erro ao verificar cargo:", error);
                setIsAuthorized(false);
            } finally {
                setRoleLoading(false);
            }
        };

        checkUserRole();
    }, [user, roleRequired]);

    // 1. Aguarda o Firebase Auth carregar
    if (authLoading || roleLoading) {
        return <div style={{ padding: '50px', textAlign: 'center' }}>Verificando permissões...</div>;
    }

    // 2. Se não estiver logado, vai para Home
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // 3. Se estiver logado mas não tiver o cargo necessário
    if (!isAuthorized) {
        alert("Acesso negado: Você não tem permissão para acessar esta área.");
        return <Navigate to="/" replace />;
    }

    // 4. Tudo certo! Renderiza a página
    return children;
};

export default ProtectedRoute;