import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, doc, addDoc, serverTimestamp, increment, runTransaction } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/Estoque.css';

const Estoque = () => {
    const [itensAtivos, setItensAtivos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');
    const [quantidadeParaRetirar, setQuantidadeParaRetirar] = useState(1);

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
            const q = query(
                ativosRef,
                where("setor", "in", ["patrimonio", "Patrimonio"]),
                where("status", "==", "Ativo")
            );

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

        const ativoRef = doc(db, "ativos", itemSelecionado.id);
        const qtdSolicitada = Number(quantidadeParaRetirar);

        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(ativoRef);
                if (!sfDoc.exists()) {
                    throw new Error("O item não existe mais no banco de dados.");
                }

                const dadosOriginais = sfDoc.data();
                const qtdAtual = Number(dadosOriginais.quantidade || 1);

                if (qtdSolicitada > qtdAtual) {
                    throw new Error(`Quantidade insuficiente! Só restam ${qtdAtual} unidades.`);
                }

                const isSP = dadosOriginais.patrimonio?.toUpperCase() === 'S/P';
                const patrimonioFinal = (isSP && novoPatrimonioParaSP)
                    ? novoPatrimonioParaSP.toUpperCase().trim()
                    : dadosOriginais.patrimonio;

                // --- LÓGICA DE INVENTÁRIO (CRIAÇÃO DE REGISTRO) ---

                if (isSP && qtdSolicitada < qtdAtual) {
                    // CASO 1: SAÍDA PARCIAL (Desmembramento)
                    // Atualiza o que fica no Patrimônio
                    transaction.update(ativoRef, {
                        quantidade: increment(-qtdSolicitada),
                        ultimaMovimentacao: serverTimestamp()
                    });

                    // Cria um NOVO documento para o destino (para aparecer no inventário de lá)
                    const novoAtivoRef = doc(collection(db, "ativos"));
                    transaction.set(novoAtivoRef, {
                        ...dadosOriginais, // Copia todos os dados (nome, marca, categoria)
                        id: novoAtivoRef.id,
                        quantidade: qtdSolicitada,
                        patrimonio: patrimonioFinal,
                        unidade: dadosSaida.novaUnidade,
                        setor: dadosSaida.novoSetor.toLowerCase().trim(),
                        ultimaMovimentacao: serverTimestamp(),
                        dataCadastro: serverTimestamp() // Data de entrada na nova unidade
                    });

                } else {
                    // CASO 2: SAÍDA TOTAL
                    // Apenas move o documento atual para o novo destino
                    transaction.update(ativoRef, {
                        unidade: dadosSaida.novaUnidade,
                        setor: dadosSaida.novoSetor.toLowerCase().trim(),
                        patrimonio: patrimonioFinal,
                        quantidade: isSP ? qtdSolicitada : qtdAtual,
                        ultimaMovimentacao: serverTimestamp()
                    });
                }

                // REGISTRO NA COLEÇÃO DE MOVIMENTAÇÕES
                const logsRef = collection(db, "saidaEquipamento");
                transaction.set(doc(logsRef), {
                    ativoId: itemSelecionado.id,
                    patrimonio: patrimonioFinal,
                    nomeEquipamento: itemSelecionado.nome,
                    unidadeOrigem: itemSelecionado.unidade,
                    setorOrigem: itemSelecionado.setor,
                    unidadeDestino: dadosSaida.novaUnidade,
                    setorDestino: dadosSaida.novoSetor,
                    quantidadeRetirada: qtdSolicitada,
                    responsavelRecebimento: dadosSaida.responsavelRecebimento,
                    motivo: dadosSaida.motivo,
                    dataSaida: serverTimestamp()
                });
            });

            toast.success("Movimentação e Inventário atualizados!");
            fecharModal();
            carregarEstoquePatrimonio();
        } catch (error) {
            console.error(error);
            toast.error(error.message || "Erro ao processar saída.");
        } finally {
            setLoading(false);
        }
    };

    const fecharModal = () => {
        setItemSelecionado(null);
        setNovoPatrimonioParaSP('');
        setQuantidadeParaRetirar(1);
        setDadosSaida({
            novaUnidade: '',
            novoSetor: '',
            responsavelRecebimento: '',
            motivo: 'Transferência'
        });
    };

    return (
        <div className="estoque-layout">
            <header className="estoque-header">
                <div className="header-info">
                    <h1>🏬 Sala do Patrimônio</h1>
                    <p>Gerenciamento de Ativos e Distribuição</p>
                </div>
                <div className="header-actions">
                    <button onClick={carregarEstoquePatrimonio} className="btn-atualizar" disabled={loading}>
                        {loading ? '...' : '🔄 Atualizar'}
                    </button>
                    <Link to="/" className="back-link">Voltar</Link>
                </div>
            </header>

            <div className="tabela-container">
                {loading && !itemSelecionado ? (
                    <div className="loading-state">Carregando itens...</div>
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
                                    <td><span className={`status-badge ${item.estado?.toLowerCase()}`}>{item.estado}</span></td>
                                    <td>{item.quantidade || 1}</td>
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
                            <p>Item: <strong>{itemSelecionado.nome}</strong></p>
                            <p>Disponível: <strong>{itemSelecionado.quantidade || 1}</strong></p>
                        </div>

                        <form onSubmit={handleSaida}>
                            {itemSelecionado.patrimonio?.toUpperCase() === 'S/P' && (
                                <div className="alerta-sp-form">
                                    <div className="estoque-form-group">
                                        <label>Novo Patrimônio (Obrigatório):</label>
                                        <input
                                            type="text"
                                            className="input-patrimonio-novo"
                                            value={novoPatrimonioParaSP}
                                            onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {Number(itemSelecionado.quantidade) > 1 && (
                                        <div className="estoque-form-group">
                                            <label>Quantidade a retirar:</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={itemSelecionado.quantidade}
                                                value={quantidadeParaRetirar}
                                                onChange={(e) => setQuantidadeParaRetirar(e.target.value)}
                                                required
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="estoque-form-group">
                                <label>Unidade de Destino</label>
                                <select required value={dadosSaida.novaUnidade} onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div className="estoque-form-group">
                                <label>Setor de Destino</label>
                                <input type="text" required placeholder="Ex: Farmácia" value={dadosSaida.novoSetor} onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })} />
                            </div>

                            <div className="estoque-form-group">
                                <label>Responsável</label>
                                <input type="text" required value={dadosSaida.responsavelRecebimento} onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })} />
                            </div>

                            <div className="modal-actions-container">
                                <button type="submit" className="btn-confirmar-transferencia" disabled={loading}>
                                    {loading ? 'Processando...' : 'Confirmar Saída'}
                                </button>
                                <button type="button" className="btn-modal-cancelar" onClick={fecharModal}>Cancelar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estoque;