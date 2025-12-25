import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Estoque.css';

const Estoque = () => {
    const [itensAtivos, setItensAtivos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');
    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        responsavelRecebimento: '',
        motivo: 'Transferência'
    });

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    const carregarEstoquePatrimonio = async () => {
        setLoading(true);
        try {
            const ativosRef = collection(db, "ativos");
            const q = query(ativosRef, where("setor", "==", "patrimonio"), where("status", "==", "Ativo"));
            const querySnapshot = await getDocs(q);
            const lista = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setItensAtivos(lista);
        } catch (error) {
            console.error("Erro ao buscar ativos:", error);
            toast.error("Erro ao carregar itens.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        carregarEstoquePatrimonio();
    }, []);

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);
            const patrimonioFinal = (itemSelecionado.patrimonio?.toUpperCase() === 'S/P' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase().trim()
                : itemSelecionado.patrimonio;

            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal,
                ultimaMovimentacao: serverTimestamp()
            });

            await addDoc(collection(db, "saidaEquipamento"), {
                ativoId: itemSelecionado.id,
                patrimonio: patrimonioFinal,
                nomeEquipamento: itemSelecionado.nome,
                unidadeOrigem: itemSelecionado.unidade,
                setorOrigem: itemSelecionado.setor,
                unidadeDestino: dadosSaida.novaUnidade,
                setorDestino: dadosSaida.novoSetor,
                responsavelRecebimento: dadosSaida.responsavelRecebimento,
                motivo: dadosSaida.motivo,
                dataSaida: serverTimestamp()
            });

            toast.success("Transferência realizada com sucesso!");
            fecharModal();
            carregarEstoquePatrimonio();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar saída.");
        } finally {
            setLoading(false);
        }
    };

    const fecharModal = () => {
        setItemSelecionado(null);
        setNovoPatrimonioParaSP('');
        setDadosSaida({ ...dadosSaida, novaUnidade: '', novoSetor: '', responsavelRecebimento: '' });
    };

    return (
        <div className="estoque-layout">
            <header className="estoque-header">
                <div className="header-info">
                    <h1>🏬 Sala do Patrimônio</h1>
                    <p>Itens aguardando distribuição ou manutenção</p>
                </div>
                <div className="header-actions">
                    <button onClick={carregarEstoquePatrimonio} className="btn-atualizar">
                        🔄 Atualizar Grade
                    </button>
                    <Link to="/" className="back-link">Voltar ao Início</Link>
                </div>
            </header>

            <div className="tabela-container">
                {loading && !itemSelecionado ? (
                    <div className="loading-state">Carregando estoque...</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Equipamento</th>
                                <th>Patrimônio</th>
                                <th>Estado</th>
                                <th>Qtd</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itensAtivos.map(item => (
                                <tr key={item.id} className="linha-estoque" onClick={() => setItemSelecionado(item)}>
                                    <td><strong>{item.nome}</strong></td>
                                    <td><code className="patrimonio-tag">{item.patrimonio || 'S/P'}</code></td>
                                    <td>
                                        <span className={`status-badge ${item.estado?.toLowerCase()}`}>
                                            {item.estado}
                                        </span>
                                    </td>
                                    <td>{item.quantidade}</td>
                                    <td className="td-obs">{item.observacoes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {itemSelecionado && (
                <div className="estoque-modal-overlay">
                    <div className="estoque-modal-content">
                        <h2>📦 Movimentar Equipamento</h2>

                        <div className="item-details-card">
                            <p>Equipamento: <strong>{itemSelecionado.nome}</strong></p>
                            <p>Origem: <span>{itemSelecionado.unidade}</span></p>
                        </div>

                        <form onSubmit={handleSaida}>
                            {/* CAMPO CONDICIONAL PARA S/P COM VISUAL MELHORADO */}
                            {itemSelecionado.patrimonio?.toUpperCase() === 'S/P' && (
                                <div className="alerta-sp-form">
                                    <label>Este item não tem patrimônio. Identifique-o agora:</label>
                                    <input
                                        type="text"
                                        className="input-patrimonio-novo"
                                        placeholder="N° Patrimônio"
                                        value={novoPatrimonioParaSP}
                                        onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div className="estoque-form-group">
                                <label>Unidade de Destino</label>
                                <select
                                    required
                                    value={dadosSaida.novaUnidade}
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}
                                >
                                    <option value="">Selecione a unidade...</option>
                                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div className="estoque-form-group">
                                <label>Setor de Destino</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Sala de Raio-X"
                                    value={dadosSaida.novoSetor}
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                                />
                            </div>

                            <div className="estoque-form-group">
                                <label>Responsável pelo Recebimento</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome de quem recebeu"
                                    value={dadosSaida.responsavelRecebimento}
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                                />
                            </div>

                            <div className="modal-actions-container">
                                <button type="submit" className="btn-confirmar-transferencia" disabled={loading}>
                                    {loading ? 'Processando...' : 'Confirmar Saída'}
                                </button>
                                <button type="button" className="btn-modal-cancelar" onClick={fecharModal}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estoque;