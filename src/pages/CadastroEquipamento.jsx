import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify'; // Importando para melhor feedback
import '../styles/CadastroEquipamento.css';

const CadastroEquipamento = () => {
    const { userData, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        patrimonio: '',
        nome: '',
        tipo: 'Mobiliário',
        quantidade: 1,
        setor: '',
        unidade: '',
        estado: 'Novo',
        observacoes: ''
    });

    useEffect(() => {
        if (!authLoading && userData?.role !== 'adm') {
            toast.error("Acesso negado. Apenas administradores.");
            navigate('/');
        }
    }, [userData, authLoading, navigate]);

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.unidade) {
            toast.warning("Por favor, selecione uma unidade.");
            return;
        }

        setLoading(true);
        const idToast = toast.loading("Salvando no patrimônio...");

        try {
            // Criando o objeto de salvamento
            const novoAtivo = {
                ...formData,
                quantidade: Number(formData.quantidade),
                status: 'Ativo',
                criadoEm: serverTimestamp(),
            };

            // Tenta salvar na coleção "ativos"
            const docRef = await addDoc(collection(db, "ativos"), novoAtivo);

            console.log("Documento escrito com ID: ", docRef.id);

            toast.update(idToast, {
                render: "Equipamento registrado com sucesso!",
                type: "success",
                isLoading: false,
                autoClose: 3000
            });

            // Limpa o form mantendo a unidade
            setFormData({
                patrimonio: '',
                nome: '',
                tipo: 'Mobiliário',
                quantidade: 1,
                setor: '',
                unidade: formData.unidade,
                estado: 'Novo',
                observacoes: ''
            });

        } catch (error) {
            console.error("Erro detalhado ao cadastrar:", error);
            toast.update(idToast, {
                render: `Erro: ${error.message}`,
                type: "error",
                isLoading: false,
                autoClose: 5000
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <p style={{ textAlign: 'center', marginTop: '50px' }}>Carregando...</p>;

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1>📦 Entrada de Patrimônio</h1>
                    <Link to="/" className="back-link">Voltar à Home</Link>
                </div>
            </header>

            <form onSubmit={handleSubmit} className="equip-form">
                {/* O restante do seu JSX permanece igual */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Número do Patrimônio (TAG):</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: HMC-1234"
                            value={formData.patrimonio}
                            onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Unidade de Alocação:</label>
                        <select
                            required
                            value={formData.unidade}
                            onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                        >
                            <option value="">Selecione a Unidade...</option>
                            {unidades.map((uni) => (
                                <option key={uni} value={uni}>{uni}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Tipo de Item:</label>
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                        >
                            <option value="Mobiliário">Mobiliário</option>
                            <option value="Refrigeração">Refrigeração</option>
                            <option value="Informática">Informática</option>
                            <option value="Equip. Médico">Equipamento Médico</option>
                            <option value="Ferramenta">Ferramenta</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Setor / Sala:</label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: Recepção / Sala 02"
                            value={formData.setor}
                            onChange={(e) => setFormData({ ...formData, setor: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Nome / Descrição do Equipamento:</label>
                    <input
                        type="text"
                        required
                        placeholder="Ex: Mesa de Escritório em L"
                        value={formData.nome}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Quantidade:</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantidade}
                            onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Estado de Conservação:</label>
                        <select
                            value={formData.estado}
                            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        >
                            <option value="Novo">Novo</option>
                            <option value="Bom">Bom</option>
                            <option value="Regular">Regular</option>
                            <option value="Danificado">Danificado</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Observações Adicionais:</label>
                    <textarea
                        rows="3"
                        placeholder="Detalhes como marca, cor, se possui NF..."
                        value={formData.observacoes}
                        onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    />
                </div>

                <button type="submit" className="btn-registrar-patrimonio" disabled={loading}>
                    {loading ? 'Processando Registro...' : 'Finalizar Entrada de Patrimônio'}
                </button>
            </form>
        </div>
    );
};

export default CadastroEquipamento;