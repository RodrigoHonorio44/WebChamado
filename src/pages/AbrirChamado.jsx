import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineHome } from 'react-icons/ai';
import '../styles/AbrirChamado.css';

// --- IMPORTAÇÕES DO FIREBASE ---
import { db, auth } from "../api/firebase";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const UNIDADES = [
    'Hospital Conde',
    'Upa Inoã',
    'Upa Santa Rita',
    'Samu Barroco',
    'Samu Ponta Negra',
];

const AbrirChamado = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nome: '',
        unidade: UNIDADES[0],
        setor: '',
        descricao: '',
        prioridade: 'média',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;

        if (!user) {
            setError('Você precisa estar logado para abrir um chamado.');
            setIsLoading(false);
            return;
        }

        try {
            const chamadosRef = collection(db, 'chamados');

            // 🚀 GERAÇÃO DO NÚMERO DE OS ALEATÓRIO (Ex: 2025-8429)
            const anoAtual = new Date().getFullYear();
            const aleatorio = Math.floor(1000 + Math.random() * 9000);
            const novaOs = `${anoAtual}-${aleatorio}`;

            // Envio dos dados incluindo o numeroOs
            await addDoc(chamadosRef, {
                numeroOs: novaOs,             // ✅ NOVO CAMPO: Número da Ordem de Serviço
                userId: user.uid,
                emailSolicitante: user.email,
                nome: formData.nome,
                unidade: formData.unidade,
                setor: formData.setor,
                descricao: formData.descricao,
                prioridade: formData.prioridade,
                status: 'aberto',
                criadoEm: serverTimestamp(),
            });

            setIsSubmitted(true);
            setFormData({
                nome: '',
                unidade: UNIDADES[0],
                setor: '',
                descricao: '',
                prioridade: 'média'
            });

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            console.error("Erro ao salvar chamado:", err);
            setError('Erro ao registrar chamado no banco de dados. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chamado-container">
            <Link to="/" className="back-button">
                <AiOutlineHome size={18} />
                Início
            </Link>

            <h2 className="chamado-title">📝 Abrir Novo Chamado</h2>
            <p className="chamado-subtitle">
                Por favor, preencha todos os campos com a maior riqueza de detalhes possível.
            </p>

            {isSubmitted && (
                <div className="success-message">
                    ✅ Chamado registrado com sucesso! OS: Gerada
                </div>
            )}

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="chamado-form">
                <div className="form-group">
                    <label htmlFor="nome">Seu Nome</label>
                    <input
                        type="text" id="nome" name="nome" value={formData.nome}
                        onChange={handleChange} required className="form-input"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="unidade">Unidade</label>
                    <select
                        id="unidade" name="unidade" value={formData.unidade}
                        onChange={handleChange} required className="form-input"
                        disabled={isLoading}
                    >
                        {UNIDADES.map(unidade => (
                            <option key={unidade} value={unidade}>{unidade}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="setor">Setor</label>
                    <input
                        type="text" id="setor" name="setor" value={formData.setor}
                        onChange={handleChange} required className="form-input"
                        disabled={isLoading} placeholder="Ex: TI, Farmácia, Enfermagem..."
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="prioridade">Prioridade</label>
                    <select
                        id="prioridade" name="prioridade" value={formData.prioridade}
                        onChange={handleChange} required className="form-input"
                        disabled={isLoading}
                    >
                        <option value="baixa">Baixa (Pode esperar)</option>
                        <option value="média">Média (Idealmente hoje)</option>
                        <option value="alta">Alta (Urgente, impede o trabalho)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="descricao">Descrição Detalhada do Problema</label>
                    <textarea
                        id="descricao" name="descricao" value={formData.descricao}
                        onChange={handleChange} required className="form-textarea"
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit" className="submit-button" disabled={isLoading}
                >
                    {isLoading ? 'Enviando ao Banco...' : 'Abrir Chamado'}
                </button>
            </form>
        </div>
    );
};

export default AbrirChamado;