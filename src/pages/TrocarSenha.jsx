import React, { useState } from 'react';
import { auth, db } from '../api/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';
import { toast } from 'react-toastify';
import { FiLock, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import '../styles/TrocarSenha.css'; // Certifique-se de usar o novo arquivo CSS

const TrocarSenha = () => {
    const [senhaAtual, setSenhaAtual] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validações Básicas
        if (novaSenha !== confirmarSenha) return toast.error("As novas senhas não coincidem!");
        if (novaSenha.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres!");
        if (senhaAtual === novaSenha) return toast.error("A nova senha deve ser diferente da atual!");

        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("Usuário não autenticado.");

            const userRef = doc(db, "usuarios", user.uid);

            // 1. Reautenticação (Segurança do Firebase)
            const credential = EmailAuthProvider.credential(user.email, senhaAtual);
            await reauthenticateWithCredential(user, credential);

            // 2. Busca histórico para validar repetição
            const userSnap = await getDoc(userRef);
            if (!userSnap.exists()) throw new Error("Perfil do usuário não encontrado.");

            const dados = userSnap.data();
            const historico = dados.historicoSenhas || [];

            // 3. Verifica se a senha já foi usada (Hash Comparison)
            const novoHash = CryptoJS.SHA256(novaSenha).toString();
            if (historico.includes(novoHash)) {
                setLoading(false);
                return toast.error("Esta senha já foi usada anteriormente. Escolha uma nova!");
            }

            // 4. Executa a troca no Firebase Auth
            await updatePassword(user, novaSenha);

            // 5. Atualiza Firestore (Reset do contador de 4 meses e Histórico)
            const novoHistorico = [...historico, novoHash].slice(-5); // Mantém apenas as últimas 5

            await updateDoc(userRef, {
                ultimaTrocaSenha: serverTimestamp(),
                historicoSenhas: novoHistorico
            });

            toast.success("Senha atualizada com sucesso!");
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                toast.error("A senha atual informada está incorreta.");
            } else {
                toast.error("Erro ao atualizar senha. Tente novamente.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="seguranca-page">
            <div className="seguranca-card">
                <header className="seguranca-header">
                    <h1><FiLock /> Segurança da Conta</h1>
                    <p className="seguranca-subtitle">Mantenha seu acesso protegido</p>
                </header>

                <form onSubmit={handleSubmit} className="seguranca-form">
                    <div className="seguranca-rules">
                        <p>• A nova senha não pode ser igual às últimas utilizadas.</p>
                        <p>• Validade do acesso: <strong>120 dias (4 meses)</strong>.</p>
                    </div>

                    <div className="seguranca-group">
                        <label>Senha Atual</label>
                        <input
                            type="password"
                            required
                            value={senhaAtual}
                            onChange={e => setSenhaAtual(e.target.value)}
                            placeholder="Sua senha de login"
                        />
                    </div>

                    <div className="seguranca-group">
                        <label>Nova Senha</label>
                        <input
                            type="password"
                            required
                            value={novaSenha}
                            onChange={e => setNovaSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div className="seguranca-group">
                        <label>Confirmar Nova Senha</label>
                        <input
                            type="password"
                            required
                            value={confirmarSenha}
                            onChange={e => setConfirmarSenha(e.target.value)}
                            placeholder="Repita a nova senha"
                        />
                    </div>

                    <button type="submit" className="seguranca-btn" disabled={loading}>
                        {loading ? (
                            <>
                                <FiRefreshCw className="spin" /> Processando...
                            </>
                        ) : (
                            'Confirmar Alteração'
                        )}
                    </button>

                    <button
                        type="button"
                        className="seguranca-back"
                        onClick={() => navigate('/dashboard')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%' }}
                    >
                        <FiArrowLeft /> Voltar ao Início
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TrocarSenha;