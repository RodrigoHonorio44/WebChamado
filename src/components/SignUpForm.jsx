import React, { useState } from 'react';
import { auth, db } from '../api/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const SignUpForm = ({ onRegisterSuccess, onBackToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cargo, setCargo] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ LISTA DE CARGOS ATUALIZADA
    const CARGOS = [
        'Administrativo',
        'Médico(a)',
        'Enfermeiro(a)',
        'Técnico(a) de Enfermagem',
        'Técnico(a) de Radiologia',
        'Farmacêutico(a)',
        'Recepcionista',
        'Diretoria',
        'Surpevisão',
        'TI'
    ];

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(null);

        // Validações básicas
        if (!name || !email || !cargo) {
            setError("Por favor, preencha todos os campos, incluindo o cargo.");
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

            // 2. Atualiza o Perfil no Auth (DisplayName)
            await updateProfile(user, {
                displayName: name,
            });

            // 3. SALVA NO FIRESTORE (Na coleção 'usuarios')
            await setDoc(doc(db, "usuarios", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                cargo: cargo,
                role: 'user',
                createdAt: new Date().toISOString(),
            });

            // 4. Sucesso
            setTimeout(() => {
                if (onRegisterSuccess) {
                    onRegisterSuccess();
                }
            }, 500);

        } catch (firebaseError) {
            console.error("Erro no cadastro:", firebaseError);
            let friendlyMessage = "Ocorreu um erro no registro.";

            if (firebaseError.code === 'auth/email-already-in-use') {
                friendlyMessage = "Este email já está em uso.";
            } else if (firebaseError.code === 'permission-denied') {
                friendlyMessage = "Erro de permissão no Firestore. Verifique as Regras (Rules).";
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

            {/* Nome */}
            <input
                type="text"
                placeholder="Seu Nome Completo"
                className="auth-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
            />

            {/* Email */}
            <input
                type="email"
                placeholder="Seu E-mail"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
            />

            {/* Seleção de Cargo */}
            <select
                className="auth-input"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                required
                disabled={isLoading}
                style={{ backgroundColor: 'white' }}
            >
                <option value="" disabled>Selecione seu Cargo</option>
                {CARGOS.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>

            {/* Senha */}
            <input
                type="password"
                placeholder="Senha (mín. 6 dígitos)"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
            />

            {/* Confirmar Senha */}
            <input
                type="password"
                placeholder="Confirme a Senha"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
            />

            {error && <p className="error-message" style={{ color: 'red', fontSize: '0.9em', textAlign: 'center' }}>{error}</p>}

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