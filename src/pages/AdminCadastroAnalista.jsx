import React, { useState } from 'react';
import { db, auth } from '../api/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { FiMail, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import '../styles/Admin.css';

const AdminCadastroAnalista = () => {
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // ✅ FUNÇÃO PARA RESETAR SENHA (VISÍVEL E DIRETA)
    const handleResetSenha = async () => {
        if (!email) {
            toast.warning("Digite o e-mail no campo acima para enviar o reset.");
            return;
        }

        setResetLoading(true);
        try {
            await sendPasswordResetEmail(auth, email.toLowerCase().trim());
            toast.success(`Link de senha enviado para: ${email}`);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar. Verifique se o e-mail está correto.");
        } finally {
            setResetLoading(false);
        }
    };

    const handleCadastrarAnalista = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const emailFormatado = email.toLowerCase().trim();

            await setDoc(doc(db, "usuarios_autorizados", emailFormatado), {
                nome: nome,
                email: emailFormatado,
                role: 'analista',
                cadastradoEm: serverTimestamp(),
                ultimaTrocaSenha: serverTimestamp(),
                historicoSenhas: []
            });

            // Envia o primeiro reset automaticamente após autorizar
            await sendPasswordResetEmail(auth, emailFormatado);

            toast.success(`Analista autorizado! E-mail de senha enviado.`);
            setEmail('');
            setNome('');
        } catch (error) {
            toast.error("Erro ao cadastrar analista.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h2>🛡️ Painel Administrativo</h2>
            <h3>Gerenciar Analista</h3>

            <form onSubmit={handleCadastrarAnalista} className="admin-form">
                <div className="input-group">
                    <label>Nome Completo</label>
                    <input
                        type="text"
                        placeholder="Ex: João Silva"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>E-mail Institucional</label>
                    <input
                        type="email"
                        placeholder="analista@hmcml.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="admin-actions">
                    {/* BOTÃO 1: CADASTRAR */}
                    <button type="submit" disabled={loading} className="btn-autorizar">
                        <FiCheckCircle /> {loading ? 'Autorizando...' : 'Autorizar Novo Analista'}
                    </button>

                    <div className="divider">OU</div>

                    {/* BOTÃO 2: RESETAR SENHA (AGORA BEM VISÍVEL) */}
                    <button
                        type="button"
                        onClick={handleResetSenha}
                        disabled={resetLoading}
                        className="btn-reset-visible"
                    >
                        {resetLoading ? <FiRefreshCw className="spin" /> : <FiMail />}
                        Enviar Reset de Senha para este E-mail
                    </button>
                </div>
            </form>

            <div className="admin-helper">
                <small>
                    Utilize o botão de reset caso o analista já esteja cadastrado mas esqueceu a senha.
                </small>
            </div>
        </div>
    );
};

export default AdminCadastroAnalista;