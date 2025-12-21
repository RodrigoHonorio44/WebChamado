import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/CadastroEquipamento.css';

const Estoque = () => {
    const [itensAtivos, setItensAtivos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para o Modal de Saída
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
            setItemSelecionado(null);
            setNovoPatrimonioParaSP('');
            carregarEstoquePatrimonio();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar saída.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>🏬 Itens na Sala do Patrimônio</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={carregarEstoquePatrimonio} className="btn-atualizar">🔄 Atualizar</button>
                    <Link to="/" className="back-link">Voltar</Link>
                </div>
            </header>

            <div className="tabela-container" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {loading && !itemSelecionado ? (
                    <p>Carregando...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', color: '#64748b' }}>
                                <th style={{ padding: '12px' }}>Nome</th>
                                <th>Patrimônio</th>
                                <th>Estado</th>
                                <th>Qtd</th>
                                <th>Observações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itensAtivos.map(item => (
                                <tr key={item.id}
                                    onClick={() => setItemSelecionado(item)}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                    className="linha-estoque">
                                    <td style={{ padding: '12px' }}><strong>{item.nome}</strong></td>
                                    <td><code>{item.patrimonio || 's/p'}</code></td>
                                    <td>{item.estado}</td>
                                    <td>{item.quantidade}</td>
                                    <td style={{ fontSize: '12px' }}>{item.observacoes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {itemSelecionado && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: '10px' }}>📦 Movimentar Item</h2>
                        <p style={{ marginBottom: '20px', color: '#475569' }}>Item: <strong>{itemSelecionado.nome}</strong></p>

                        <form onSubmit={handleSaida}>
                            {itemSelecionado.patrimonio?.toUpperCase() === 'S/P' && (
                                <div className="form-group" style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d', marginBottom: '15px' }}>
                                    <label style={{ fontWeight: 'bold', color: '#92400e' }}>Identificar este S/P agora?</label>
                                    <input
                                        type="text"
                                        placeholder="Digite o novo número"
                                        value={novoPatrimonioParaSP}
                                        onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                        style={{ marginTop: '8px' }}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Unidade de Destino:</label>
                                <select required onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                    <option value="">Selecione...</option>
                                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Novo Setor:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Recepção"
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Responsável pelo Recebimento:</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome de quem recebeu"
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                                <button type="submit" className="btn-registrar-patrimonio" style={{ flex: 2, padding: '12px', fontWeight: 'bold' }}>
                                    Confirmar Saída
                                </button>

                                {/* BOTÃO CANCELAR MELHORADO */}
                                <button
                                    type="button"
                                    onClick={() => setItemSelecionado(null)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: '#f1f5f9', // Fundo cinza bem claro
                                        color: '#475569',           // Texto cinza escuro
                                        border: '1px solid #cbd5e1', // Borda sutil
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = '#e2e8f0';
                                        e.target.style.color = '#1e293b';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = '#f1f5f9';
                                        e.target.style.color = '#475569';
                                    }}
                                >
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