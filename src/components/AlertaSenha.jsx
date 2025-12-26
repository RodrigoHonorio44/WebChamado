import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import '../styles/AlertaSenha.css';

const AlertaSenha = ({ userData }) => {
    const navigate = useNavigate();
    const [diasParaExpirar, setDiasParaExpirar] = useState(null);

    useEffect(() => {
        if (userData?.ultimaTrocaSenha) {
            // Suporta tanto Timestamp do Firebase quanto data ISO
            const ultimaTroca = userData.ultimaTrocaSenha?.toDate
                ? userData.ultimaTrocaSenha.toDate()
                : new Date(userData.ultimaTrocaSenha);

            const hoje = new Date();
            const dataExp = new Date(ultimaTroca);
            dataExp.setMonth(dataExp.getMonth() + 4); // Regra dos 4 meses

            const diffTime = dataExp - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            setDiasParaExpirar(diffDays);

            // Bloqueio forçado se expirar
            if (diffDays <= 0) {
                navigate('/trocar-senha');
            }
        }
    }, [userData, navigate]);

    // Só renderiza se faltar 5 dias ou menos (e ainda não expirou)
    if (diasParaExpirar === null || diasParaExpirar > 5 || diasParaExpirar <= 0) {
        return null;
    }

    return (
        <div className="senha-expira-alerta">
            <div className="alerta-content">
                <FiAlertTriangle className="alerta-icon" />
                <span>
                    Sua senha de acesso <strong>expira em {diasParaExpirar} {diasParaExpirar === 1 ? 'dia' : 'dias'}</strong>.
                </span>
            </div>
            <button onClick={() => navigate('/trocar-senha')} className="alerta-btn">
                Trocar Senha Agora <FiArrowRight />
            </button>
        </div>
    );
};

export default AlertaSenha;