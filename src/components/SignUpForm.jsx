import React, { useState } from 'react';
import { auth, db } from '../api/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const SignUpForm = ({ onRegisterSuccess, onBackToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);

        if (!name || !email) {
            setError("Por favor, preencha o nome e o email.");
            return;
        }
        if (password !== confirmPassword) {
            setError("As senhas não coincidem.");
            return;
        }
        if (password.length < 6) {
            setError("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Cria o usuário no Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Atualiza o Perfil no Auth
            await updateProfile(user, {
                displayName: name,
            });

            // 3. SALVA NO FIRESTORE
            // 🛑 IMPORTANTE: Alterado de "users" para "usuarios" para bater com o AuthContext
            await setDoc(doc(db, "usuarios", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'user', // Todo novo cadastro nasce como usuário comum
                createdAt: new Date().toISOString(),
            });

            // 4. Aguarda um curto momento (500ms) para o Firestore processar 
            // antes de disparar o sucesso e redirecionar
            setTimeout(() => {
                if (onRegisterSuccess) {
                    onRegisterSuccess();
                }
            }, 500);

        } catch (firebaseError) {
            let friendlyMessage = "Ocorreu um erro no registro.";
            if (firebaseError.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este email já está em uso.";
            } else if (firebaseError.code === 'auth/weak-password') {
                friendlyMessage = "A senha é muito fraca.";
            } else if (firebaseError.code === 'auth/invalid-email') {
                friendlyMessage = "E-mail inválido.";
            }
            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="auth-form">
            <h3>Crie Sua Conta</h3>
            <p className="auth-instruction">Cadastre-se para acessar o sistema.</p>

            <input
                type="text"
                placeholder="Seu Nome Completo"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
            />

            <input
                type="email"
                placeholder="Seu E-mail"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
            />

            <input
                type="password"
                placeholder="Senha (mín. 6 dígitos)"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
            />

            <input
                type="password"
                placeholder="Confirme a Senha"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
            />

            {error && <p className="error-message" style={{ color: 'red', fontSize: '0.9em' }}>{error}</p>}

            <div className="auth-actions-visual">
                <button type="submit" className="auth-button register-btn" disabled={isLoading}>
                    {isLoading ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
                <button type="button" onClick={onBackToLogin} className="auth-button back-btn" disabled={isLoading}>
                    Voltar
                </button>
            </div>
        </form>
    );
};

export default SignUpForm;