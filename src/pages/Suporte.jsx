import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiMessageCircle } from 'react-icons/fi';
import '../styles/InfoPages.css';

const Suporte = () => {
    const navigate = useNavigate();

    return (
        <div className="info-page-container">
            <button className="btn-voltar-info" onClick={() => navigate(-1)}>
                <FiArrowLeft /> Voltar ao Sistema
            </button>

            <div className="info-card">
                <h1>Central de Suporte</h1>
                <p>Olá! Precisa de ajuda com o <strong>HelpDesk Pro</strong>? Confira abaixo as dúvidas mais comuns ou entre em contacto.</p>

                <div className="faq-section">
                    <h2>Perguntas Frequentes</h2>
                    <div className="faq-item">
                        <strong>Como altero a minha palavra-passe?</strong>
                        <span>No menu de perfil, selecione "Alterar Senha". Por segurança, utilize letras maiúsculas e símbolos.</span>
                    </div>
                    <div className="faq-item">
                        <strong>Como exportar relatórios?</strong>
                        <span>Apenas Administradores podem exportar a base de dados para CSV/Excel através do painel de Relatórios.</span>
                    </div>
                    <div className="faq-item">
                        <strong>O sistema está lento, o que fazer?</strong>
                        <span>Verifique a sua ligação à internet. O nosso sistema opera na nuvem e requer uma ligação estável.</span>
                    </div>
                </div>

                <div className="contato-suporte">
                    <h2>Ainda precisa de ajuda?</h2>
                    <p><FiMail /> <strong>Email:</strong> rodrigohono21@gmail.com</p>
                    <p><FiMessageCircle /> <strong>Atendimento:</strong> Seg. a Sex. das 08:00 às 17:00</p>
                </div>
            </div>
        </div>
    );
};

export default Suporte;