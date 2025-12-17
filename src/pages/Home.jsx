import React from 'react';
import { Link } from 'react-router-dom';
import ImagemPatrimonio from '../assets/patri.png';
import '../styles/Home.css';
import AuthBox from '../components/AuthBox';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user, loading, logout } = useAuth();
    const isAuthenticated = !!user;

    return (
        <div className="home-container">
            {/* NOVO: PERFIL DO USUÁRIO NO TOPO */}
            {isAuthenticated && !loading && (
                <header className="user-header">
                    <div className="user-info">
                        <span className="user-status-dot"></span>
                        <span className="user-display-name">
                            {user.email}
                        </span>
                        <button onClick={logout} className="logout-text-btn">
                            (Sair)
                        </button>
                    </div>
                </header>
            )}

            <div className="hero-section">
                <div className="hero-content">
                    <h1>Portal de Chamados do Patrimônio Hospitalar</h1>
                    <p>
                        Hospital Municipal Conde Modesto Leal: Registre e acompanhe solicitações de manutenção e suporte técnico para garantir a excelência operacional de nossos bens e equipamentos.
                    </p>

                    {loading && (
                        <p className="loading-state">Verificando estado da sessão...</p>
                    )}

                    {/* BLOCO DE AÇÕES PARA LOGADOS */}
                    {isAuthenticated && !loading && (
                        <div className="logged-area">
                            <div className="separator"></div>
                            <h3 className="welcome-message">
                                Olá, {user.displayName || 'Rodrigo'}! O que deseja fazer hoje?
                            </h3>

                            <div className="hero-actions">
                                <Link to="/abrir-chamado" className="hero-button primary-cta">
                                    🔔 Abrir Novo Chamado
                                </Link>
                                <Link to="/meus-chamados" className="hero-button secondary-cta">
                                    📋 Acompanhar Meus Tickets
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* BLOCO DE LOGIN PARA NÃO LOGADOS */}
                    {!isAuthenticated && !loading && (
                        <>
                            <AuthBox />
                            <div className="separator"></div>
                            <p className="login-prompt">
                                Faça login acima para acessar o sistema de chamados.
                            </p>
                        </>
                    )}
                </div>

                <div className="hero-image">
                    <img
                        src={ImagemPatrimonio}
                        alt="Setor de Patrimônio Hospitalar"
                    />
                </div>
            </div>

            <footer className="home-footer">
                © 2025 Sistema de Chamados. Todos os direitos reservados.
            </footer>
        </div>
    );
};

export default Home;