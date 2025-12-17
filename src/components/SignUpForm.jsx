// src/components/SignUpForm.jsx

import React, { useState } from 'react';
// 🛑 NOVAS IMPORTAÇÕES NECESSÁRIAS 🛑
import { auth, db } from '../api/firebase'; // Importa Auth e Firestore DB
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'; // Adiciona updateProfile
import { doc, setDoc } from 'firebase/firestore'; // Adiciona Firestore

const SignUpForm = ({ onRegisterSuccess, onBackToLogin }) => {
    // 🛑 Adiciona o estado 'name' para salvar o nome do usuário 🛑
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);

        // 1. Validação simples de campos (Adicionando validação de nome)
        if (!name || !email) { // Adiciona 'name' à validação
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
            // 2. Chama a função do Firebase para criar o usuário (Authentication)
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 3. 🛑 ATUALIZAÇÃO 1: Adicionar Nome de Exibição no Firebase Auth 🛑
            await updateProfile(user, {
                displayName: name,
            });

            // 4. 🛑 ATUALIZAÇÃO 2: Salvar Dados no Firestore 🛑
            // Usa o user.uid para garantir que o ID do documento seja o mesmo ID de autenticação
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: 'user', // Define um papel padrão
                createdAt: new Date().toISOString(),
            });

            // 5. Notifica o componente pai (AuthBox) do sucesso
            if (onRegisterSuccess) {
                onRegisterSuccess();
            }

        } catch (firebaseError) {
            // 6. Tratamento de Erros do Firebase
            let friendlyMessage = "Ocorreu um erro no registro.";
            if (firebaseError.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este email já está em uso. Tente fazer login.";
            } else if (firebaseError.code === 'auth/weak-password') {
                friendlyMessage = "A senha é muito fraca (mínimo de 6 caracteres).";
            } else if (firebaseError.code === 'auth/invalid-email') {
                friendlyMessage = "O formato do email é inválido.";
            }

            setError(friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="auth-form">
            <h3>Crie Sua Conta</h3>
            <p className="auth-instruction">Cadastre seu e-mail e senha para acessar o sistema.</p>

            {/* 🛑 CAMPO NOVO: NOME DO USUÁRIO 🛑 */}
            <input
                type="text"
                placeholder="Seu Nome Completo"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
            />
            {/* FIM CAMPO NOVO */}

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

            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}

            <div className="auth-actions-visual">
                <button type="submit" className="auth-button register-btn" disabled={isLoading}>
                    {isLoading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                </button>
                <button type="button" onClick={onBackToLogin} className="auth-button back-btn" disabled={isLoading}>
                    Voltar para Login
                </button>
            </div>
        </form>
    );
};

export default SignUpForm;