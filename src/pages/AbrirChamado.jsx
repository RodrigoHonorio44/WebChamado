import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AiOutlineHome } from 'react-icons/ai';
import '../styles/AbrirChamado.css';

// --- IMPORTAÇÕES DO FIREBASE ---
import { db, auth } from "../api/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'; // Adicionado doc e getDoc

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
        cargo: '', // ✅ Campo de cargo adicionado ao estado
        unidade: UNIDADES[0],
        setor: '',
        descricao: '',
        prioridade: 'média',
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // 🚀 Efeito para buscar Nome e Cargo automaticamente
    useEffect(() => {
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                // 1. Pega o nome que já está no Auth
                const nomeAuth = user.displayName || '';

                // 2. Busca o cargo lá na coleção "usuarios" do Firestore
                try {
                    const userRef = doc(db, "usuarios", user.uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const dadosDoBanco = userSnap.data();
                        setFormData(prev => ({
                            ...prev,
                            nome: nomeAuth,
                            cargo: dadosDoBanco.cargo || '' // ✅ Preenche o cargo vindo do Firestore
                        }));
                    } else {
                        setFormData(prev => ({ ...prev, nome: nomeAuth }));
                    }
                } catch (err) {
                    console.error("Erro ao buscar cargo:", err);
                    setFormData(prev => ({ ...prev, nome: nomeAuth }));
                }
            }
        };

        fetchUserData();
    }, []);

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

            const anoAtual = new Date().getFullYear();
            const aleatorio = Math.floor(1000 + Math.random() * 9000);
            const novaOs = `${anoAtual}-${aleatorio}`;

            await addDoc(chamadosRef, {
                numeroOs: novaOs,
                userId: user.uid,
                emailSolicitante: user.email,
                nome: formData.nome,
                cargo: formData.cargo, // ✅ Salva o cargo junto com o chamado
                unidade: formData.unidade,
                setor: formData.setor,
                descricao: formData.descricao,
                prioridade: formData.prioridade,
                status: 'aberto',
                criadoEm: serverTimestamp(),
            });

            setIsSubmitted(true);

            // Reseta o form mantendo os dados do usuário
            setFormData(prev => ({
                ...prev,
                unidade: UNIDADES[0],
                setor: '',
                descricao: '',
                prioridade: 'média'
            }));

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            console.error("Erro ao salvar chamado:", err);
            setError('Erro ao registrar chamado no banco de dados.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chamado-container">
            <Link to="/" className="back-button">
                <AiOutlineHome size={18} /> Início
            </Link>

            <h2 className="chamado-title">📝 Abrir Novo Chamado</h2>

            {isSubmitted && <div className="success-message">✅ Chamado registrado com sucesso!</div>}
            {error && <div className="error-message">❌ {error}</div>}

            <form onSubmit={handleSubmit} className="chamado-form">
                <div className="form-row" style={{ display: 'flex', gap: '10px' }}>
                    {/* Campo Nome (Auto-preenchido) */}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="nome">Seu Nome</label>
                        <input
                            type="text" id="nome" name="nome" value={formData.nome}
                            readOnly className="form-input input-readonly"
                        />
                    </div>

                    {/* ✅ Novo Campo Cargo (Auto-preenchido) */}
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="cargo">Seu Cargo</label>
                        <input
                            type="text" id="cargo" name="cargo" value={formData.cargo}
                            readOnly className="form-input input-readonly"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="unidade">Unidade</label>
                    <select
                        id="unidade" name="unidade" value={formData.unidade}
                        onChange={handleChange} required className="form-input"
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
                        placeholder="Ex: Farmácia, TI, Recepção..."
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="prioridade">Prioridade</label>
                    <select
                        id="prioridade" name="prioridade" value={formData.prioridade}
                        onChange={handleChange} required className="form-input"
                    >
                        <option value="baixa">Baixa</option>
                        <option value="média">Média</option>
                        <option value="alta">Alta</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="descricao">Descrição Detalhada</label>
                    <textarea
                        id="descricao" name="descricao" value={formData.descricao}
                        onChange={handleChange} required className="form-textarea"
                    />
                </div>

                <button type="submit" className="submit-button" disabled={isLoading}>
                    {isLoading ? 'Enviando...' : 'Abrir Chamado'}
                </button>
            </form>
        </div>
    );
};

export default AbrirChamado;