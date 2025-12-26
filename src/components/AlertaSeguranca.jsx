import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import '../styles/AlertaSeguranca.css';

const AlertaSeguranca = ({ userData }) => {
    const navigate = useNavigate();
    const [diasParaExpirar, setDiasParaExpirar] = useState(null);

    useEffect(() => {
        if (userData?.ultimaTrocaSenha) {
            // Converte o timestamp do Firebase ou string para Date
            const ultimaTroca = userData.ultimaTrocaSenha?.toDate
                ? userData.ultimaTrocaSenha.toDate()
                : new Date(userData.ultimaTrocaSenha);

            const hoje = new Date();
            const dataExp = new Date(ultimaTroca);

            // Adiciona 4 meses à data da última troca
            dataExp.setMonth(dataExp.getMonth() + 4);

            const diffTime = dataExp - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            setDiasParaExpirar(diffDays);

            // Bloqueio imediato se já expirou
            if (diffDays <= 0) {
                navigate('/trocar-senha');
            }
        }
    }, [userData, navigate]);

    // Só exibe o banner se faltar 5 dias ou menos (e ainda não tiver expirado)
    if (diasParaExpirar === null || diasParaExpirar > 5 || diasParaExpirar <= 0) {
        return null;
    }

    return (
        <div className="banner-seguranca">
            <div className="banner-content">
                <FiAlertTriangle className="banner-icon" />
                <p>
                    Atenção: Sua senha expira em <strong>{diasParaExpirar} {diasParaExpirar === 1 ? 'dia' : 'dias'}</strong>.
                </p>
            </div>
            <button onClick={() => navigate('/trocar-senha')} className="banner-button">
                Atualizar Agora <FiArrowRight />
            </button>
        </div>
    );
};

export default AlertaSeguranca;