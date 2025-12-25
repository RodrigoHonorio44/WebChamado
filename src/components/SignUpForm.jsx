import React, { useState } from 'react';
import { auth, db } from '../api/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FiCheck, FiX, FiUser, FiMail, FiLock, FiArrowLeft, FiBriefcase } from 'react-icons/fi';
import { toast } from 'react-toastify';

const SignUpForm = ({ onRegisterSuccess, onBackToLogin }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [cargo, setCargo] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const CARGOS = [
        'Administrativo', 'Médico(a)', 'Enfermeiro(a)',
        'Técnico(a) de Enfermagem', 'Técnico(a) de Radiologia',
        'Farmacêutico(a)', 'Recepcionista', 'Diretoria',
        'Surpevisão', 'TI'
    ];

    // ✅ REGRAS DE VALIDAÇÃO (Mesmas do Admin)
    const requisitos = {
        nome: name.trim().includes(" ") && name.trim().split(" ").length >= 2,
        minimo: password.length >= 6,
        maiuscula: /[A-Z]/.test(password),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const podeCadastrar = Object.values(requisitos).every(Boolean) && email.includes("@") && cargo !== "";

    const handleSignUp = async (e) => {
        e.preventDefault();
        if (!podeCadastrar) return;

        setIsLoading(true);

        try {
            // 1. Cria o usuário no Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Atualiza o Perfil no Auth
            await updateProfile(user, { displayName: name });

            // 3. Salva no Firestore
            await setDoc(doc(db, "usuarios", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                cargo: cargo,
                role: 'user', // Nível de acesso padrão
                createdAt: new Date().toISOString(),
            });

            toast.success("Cadastro realizado com sucesso!");
            if (onRegisterSuccess) onRegisterSuccess();

        } catch (error) {
            console.error("Erro no cadastro:", error);
            if (error.code === 'auth/email-already-in-use') {
                toast.error("Este e-mail já está em uso.");
            } else {
                toast.error("Erro ao realizar cadastro.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSignUp} className="auth-form">
            <h3>Crie Sua Conta</h3>
            <p className="auth-instruction">Preencha os dados abaixo para acessar o portal.</p>

            <div className="input-group">
                <label><FiUser /> Nome Completo</label>
                <input
                    type="text" placeholder="Nome e Sobrenome"
                    className="auth-input" value={name}
                    onChange={(e) => setName(e.target.value)} required
                    disabled={isLoading}
                />
            </div>

            <div className="input-group">
                <label><FiMail /> E-mail</label>
                <input
                    type="email" placeholder="seu@email.com"
                    className="auth-input" value={email}
                    onChange={(e) => setEmail(e.target.value)} required
                    disabled={isLoading}
                />
            </div>

            <div className="input-group">
                <label><FiBriefcase /> Cargo</label>
                <select
                    className="auth-input" value={cargo}
                    onChange={(e) => setCargo(e.target.value)} required
                    disabled={isLoading}
                    style={{ backgroundColor: 'white' }}
                >
                    <option value="" disabled>Selecione seu Cargo</option>
                    {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="input-group">
                <label><FiLock /> Senha</label>
                <input
                    type="password" placeholder="Defina sua senha"
                    className="auth-input" value={password}
                    onChange={(e) => setPassword(e.target.value)} required
                    disabled={isLoading}
                />
            </div>

            {/* Checklist Visual Interativo */}
            <ul className="password-checker-modern">
                <li className={requisitos.nome ? 'met' : ''}>
                    {requisitos.nome ? <FiCheck /> : <FiX />} Nome e Sobrenome
                </li>
                <li className={requisitos.minimo ? 'met' : ''}>
                    {requisitos.minimo ? <FiCheck /> : <FiX />} Mínimo 6 caracteres
                </li>
                <li className={requisitos.maiuscula ? 'met' : ''}>
                    {requisitos.maiuscula ? <FiCheck /> : <FiX />} 1 Letra Maiúscula
                </li>
                <li className={requisitos.especial ? 'met' : ''}>
                    {requisitos.especial ? <FiCheck /> : <FiX />} 1 Caractere Especial
                </li>
            </ul>

            <div className="auth-actions-visual">
                <button type="submit" className="auth-button register-btn" disabled={!podeCadastrar || isLoading}>
                    {isLoading ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
                <button type="button" onClick={onBackToLogin} className="auth-button back-btn" disabled={isLoading}>
                    <FiArrowLeft /> Voltar
                </button>
            </div>
        </form>
    );
};

export default SignUpForm;