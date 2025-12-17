import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const EsqueciSenha = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { resetPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await resetPassword(email);
            setMessage('Verifique sua caixa de entrada para redefinir a senha.');
            setError('');
        } catch (err) {
            setError('Falha ao enviar e-mail. Verifique se o endereço está correto.');
        }
    };

    return (
        <div className="auth-card">
            <h2>Recuperar Senha</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Seu e-mail cadastrado"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <button type="submit" className="btn-primary">Enviar Link</button>
            </form>
            <Link to="/">Voltar para o Login</Link>
        </div>
    );
};

export default EsqueciSenha;