import React from 'react';
import ImagemPatrimonio from '../assets/patri.png';
import AuthBox from '../components/AuthBox';
import '../styles/Login.css'; // Atualizado para o novo CSS de Login

const Login = () => {
    return (
        <div className="home-container">
            <div className="hero-section">
                <div className="hero-content">
                    <h1>Portal de Gestão Integrada</h1>
                    <p className="subtitle">Setor de Patrimônio - HMCML</p>

                    {/* A caixa de login centralizada */}
                    <div className="auth-wrapper">
                        <AuthBox />
                    </div>
                </div>

                <div className="hero-image">
                    <img src={ImagemPatrimonio} alt="Setor de Patrimônio" />
                </div>
            </div>
        </div>
    );
};

export default Login;