import React from 'react';
import { Link } from 'react-router-dom';
import ImagemPatrimonio from '../assets/patri.png';
import '../styles/Home.css';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
    const { user, userData, loading, logout } = useAuth();

    if (loading) return null;

    return (
        <div className="home-container">
            {/* Header sempre visível pois a Home agora é só para logados */}
            <header className="user-header">
                <div className="user-info">
                    <span className="user-status-dot"></span>
                    <span className="user-display-name">
                        {userData?.name || user?.email}
                        <small style={{ marginLeft: '8px', color: '#64748b' }}>
                            [{userData?.role || 'user'}]
                        </small>
                    </span>
                    <button onClick={logout} className="logout-text-btn">(Sair)</button>
                </div>
            </header>

            <div className="hero-section">
                <div className="hero-content">
                    <h1>Portal de Gestão Integrada</h1>
                    <p className="subtitle">Setor de Patrimônio - HMCML</p>

                    <div className="logged-area">
                        <h3 className="welcome-message">O que você precisa fazer hoje?</h3>

                        <div className="action-grid">
                            {/* SEÇÃO USUÁRIO */}
                            <Link to="/abrir-chamado" className="action-card">
                                <div className="card-icon" style={{ backgroundColor: '#ebf5ff', color: '#3182ce' }}>🔔</div>
                                <div className="card-text">
                                    <strong>Novo Chamado</strong>
                                    <span>Registrar problema</span>
                                </div>
                            </Link>

                            <Link to="/meus-chamados" className="action-card">
                                <div className="card-icon" style={{ backgroundColor: '#f0fff4', color: '#38a169' }}>📋</div>
                                <div className="card-text">
                                    <strong>Meus Tickets</strong>
                                    <span>Ver andamento</span>
                                </div>
                            </Link>

                            {/* SEÇÃO TÉCNICA / ADM */}
                            {(userData?.role === 'analista' || userData?.role === 'adm') && (
                                <Link to="/painel-analista" className="action-card technical">
                                    <div className="card-icon" style={{ backgroundColor: '#fffaf0', color: '#dd6b20' }}>🛠️</div>
                                    <div className="card-text">
                                        <strong>Painel Técnico</strong>
                                        <span>Fila de trabalho</span>
                                    </div>
                                </Link>
                            )}

                            {userData?.role === 'adm' && (
                                <>
                                    <Link to="/admin/cadastro-patrimonio" className="action-card admin">
                                        <div className="card-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>📦</div>
                                        <div className="card-text"><strong>Novo Patrimônio</strong><span>Entrada</span></div>
                                    </Link>
                                    <Link to="/admin/saida-patrimonio" className="action-card admin">
                                        <div className="card-icon" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>📤</div>
                                        <div className="card-text"><strong>Transferência</strong><span>Movimentar</span></div>
                                    </Link>
                                    <Link to="/admin/inventario" className="action-card admin">
                                        <div className="card-icon" style={{ backgroundColor: '#e0f2fe', color: '#0369a1' }}>📊</div>
                                        <div className="card-text"><strong>Inventário Geral</strong><span>Relatórios</span></div>
                                    </Link>
                                    <Link to="/admin/estoque" className="action-card admin">
                                        <div className="card-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>🏬</div>
                                        <div className="card-text"><strong>Estoque</strong><span>Materiais</span></div>
                                    </Link>
                                    <Link to="/admin/usuarios" className="action-card admin">
                                        <div className="card-icon" style={{ backgroundColor: '#fff5f5', color: '#e53e3e' }}>👥</div>
                                        <div className="card-text"><strong>Usuários</strong><span>Acessos</span></div>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* A imagem lateral continua aqui, exatamente como antes */}
                <div className="hero-image">
                    <img src={ImagemPatrimonio} alt="Setor de Patrimônio" />
                </div>
            </div>
        </div>
    );
};

export default Home;