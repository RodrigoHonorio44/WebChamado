import React, { useState } from 'react';
import { db } from '../api/firebase';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/Admin.css';

const AdminCadastroAnalista = () => {
    const [email, setEmail] = useState('');
    const [nome, setNome] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleCadastrarAnalista = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Criamos um registro na coleção "usuarios" com o cargo de analista
            // Usamos o email como ID ou um ID gerado. 
            // O ideal é que quando o analista logar, o sistema verifique essa coleção.
            await setDoc(doc(db, "usuarios_autorizados", email.toLowerCase()), {
                nome: nome,
                email: email.toLowerCase(),
                cargo: 'analista',
                cadastradoEm: new Date()
            });

            setMessage(`✅ Analista ${nome} autorizado com sucesso!`);
            setEmail('');
            setNome('');
        } catch (error) {
            console.error("Erro ao autorizar analista:", error);
            setMessage("❌ Erro ao cadastrar. Verifique sua permissão.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h2>🛡️ Painel Administrativo</h2>
            <h3>Cadastrar Novo Analista</h3>
            <p>O analista poderá acessar o sistema com este e-mail após ser autorizado aqui.</p>

            <form onSubmit={handleCadastrarAnalista} className="admin-form">
                <input
                    type="text" placeholder="Nome do Analista"
                    value={nome} onChange={(e) => setNome(e.target.value)} required
                />
                <input
                    type="email" placeholder="E-mail do Analista"
                    value={email} onChange={(e) => setEmail(e.target.value)} required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Cadastrando...' : 'Autorizar Analista'}
                </button>
            </form>
            {message && <p className="admin-message">{message}</p>}
        </div>
    );
};

export default AdminCadastroAnalista;