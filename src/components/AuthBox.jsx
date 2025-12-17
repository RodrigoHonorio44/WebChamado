import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthBox.css';
import SignUpForm from './SignUpForm';
import { auth } from '../api/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

const AuthBox = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('Informe suas credenciais.');
    const [isLoading, setIsLoading] = useState(false);

    // 🔄 Estado para controlar a visão: 'login', 'register' ou 'reset'
    const [view, setView] = useState('login');

    const navigate = useNavigate();

    // --- FUNÇÃO PARA ENVIAR LINK DE REDEFINIÇÃO ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!email) {
            setMessage("⚠️ Por favor, digite seu e-mail primeiro.");
            return;
        }
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("✅ Link enviado! Verifique seu e-mail para cadastrar a nova senha.");
            // Opcional: Voltar para o login após alguns segundos
            setTimeout(() => setView('login'), 6000);
        } catch (error) {
            setMessage("❌ Erro ao enviar link. Verifique se o e-mail está correto.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/meus-chamados');
        } catch (error) {
            setMessage("❌ Erro: E-mail ou senha incorretos.");
        } finally {
            setIsLoading(false);
        }
    };

    // 1️⃣ VISÃO DE CADASTRO
    if (view === 'register') {
        return (
            <div className="auth-box">
                <SignUpForm
                    onRegisterSuccess={() => navigate('/abrir-chamado')}
                    onBackToLogin={() => setView('login')}
                />
            </div>
        );
    }

    // 2️⃣ VISÃO DE RECUPERAÇÃO (ESQUECI SENHA)
    if (view === 'reset') {
        return (
            <div className="auth-box">
                <h3>Recuperar Senha</h3>
                <p className="auth-instruction">Digite seu e-mail para receber o link de redefinição.</p>

                <form onSubmit={handleResetPassword}>
                    <input
                        type="email"
                        placeholder="Seu e-mail cadastrado"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <div className="auth-actions-visual">
                        <button type="submit" className="auth-button login-btn" disabled={isLoading}>
                            {isLoading ? 'Enviando...' : 'Enviar Link'}
                        </button>
                        <button type="button" className="auth-button back-btn" onClick={() => setView('login')}>
                            Voltar
                        </button>
                    </div>
                </form>
                {message && <p className={`auth-message ${message.includes('✅') ? 'success' : ''}`}>{message}</p>}
            </div>
        );
    }

    // 3️⃣ VISÃO DE LOGIN (PADRÃO)
    return (
        <div className="auth-box">
            <h3>Área de Acesso</h3>
            <p className="auth-instruction">Use seu e-mail e senha para acessar o portal.</p>

            <form onSubmit={handleSignIn}>
                <input
                    type="email"
                    placeholder="Seu E-mail"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Sua Senha"
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className="forgot-password-container">
                    <button type="button" className="forgot-password-link" onClick={() => setView('reset')}>
                        Esqueceu a senha?
                    </button>
                </div>

                <div className="auth-actions-visual">
                    <button type="submit" className="auth-button login-btn" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                    <button type="button" className="auth-button register-btn" onClick={() => setView('register')}>
                        Cadastro
                    </button>
                </div>
            </form>
            {message && <p className="auth-message">{message}</p>}
        </div>
    );
};

export default AuthBox;