import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/CadastroEquipamento.css';

const SaidaEquipamento = () => {
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [nomeBusca, setNomeBusca] = useState('');
    const [itensEncontrados, setItensEncontrados] = useState([]);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState(''); // Novo estado

    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        motivo: 'Transferência',
        responsavelRecebimento: ''
    });

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    const executarBusca = async (tipo) => {
        setLoading(true);
        setItemSelecionado(null);
        setItensEncontrados([]);
        setNovoPatrimonioParaSP('');

        try {
            const ativosRef = collection(db, "ativos");
            let q;

            if (tipo === 'patrimonio') {
                if (!patrimonioBusca) return;
                q = query(ativosRef, where("patrimonio", "==", patrimonioBusca.toUpperCase()));
            } else {
                if (!nomeBusca) return;
                // Busca por nome exato ou S/P
                q = query(ativosRef, where("nome", "==", nomeBusca), limit(15));
            }

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItensEncontrados(lista);
                if (lista.length === 1) setItemSelecionado(lista[0]);
            } else {
                toast.error("Nenhum item encontrado.");
            }
        } catch (error) {
            toast.error("Erro na consulta.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);

            // Define o número final do patrimônio (se era S/P e digitou um novo, usa o novo)
            const patrimonioFinal = (itemSelecionado.patrimonio === 'S/P' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase()
                : itemSelecionado.patrimonio;

            // 1. Atualiza o Ativo
            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal, // Atualiza se deixou de ser S/P
                ultimaMovimentacao: serverTimestamp()
            });

            // 2. Salva Histórico
            await addDoc(collection(db, "movimentacoes"), {
                patrimonio: patrimonioFinal,
                nome: itemSelecionado.nome,
                origemUnidade: itemSelecionado.unidade,
                destinoUnidade: dadosSaida.novaUnidade,
                motivo: dadosSaida.motivo,
                quemRecebeu: dadosSaida.responsavelRecebimento,
                dataSaida: serverTimestamp(),
                observacao: itemSelecionado.patrimonio === 'S/P' && novoPatrimonioParaSP ? "Patrimônio atribuído na saída" : ""
            });

            toast.success("Movimentação e atualização realizadas!");
            setItemSelecionado(null);
            setItensEncontrados([]);
            setPatrimonioBusca('');
            setNomeBusca('');
            setNovoPatrimonioParaSP('');
        } catch (error) {
            toast.error("Erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>📤 Saída / Transferência</h1>
                <Link to="/" className="back-link">Voltar ao Início</Link>
            </header>

            {/* SEÇÃO DE BUSCA ESTILIZADA */}
            <div className="busca-unificada-container" style={{
                background: '#ffffff',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                marginBottom: '30px',
                border: '1px solid #e2e8f0'
            }}>
                <h3 style={{ marginBottom: '15px', color: '#1e293b', fontSize: '1rem' }}>🔎 Localizar Equipamento</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

                    <div className="campo-busca">
                        <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Por Nº Patrimônio</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                            <input
                                type="text"
                                placeholder="HMC-000"
                                value={patrimonioBusca}
                                onChange={(e) => setPatrimonioBusca(e.target.value)}
                                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                            <button onClick={() => executarBusca('patrimonio')} className="btn-save" style={{ margin: 0, padding: '0 15px' }}>OK</button>
                        </div>
                    </div>

                    <div className="campo-busca">
                        <label style={{ fontSize: '0.85rem', color: '#64748b' }}>Por Nome do Item</label>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                            <input
                                type="text"
                                placeholder="Cadeira, Monitor..."
                                value={nomeBusca}
                                onChange={(e) => setNomeBusca(e.target.value)}
                                style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                            />
                            <button onClick={() => executarBusca('nome')} className="btn-save" style={{ margin: 0, padding: '0 15px', backgroundColor: '#4f46e5' }}>OK</button>
                        </div>
                    </div>

                </div>
            </div>

            {/* LISTAGEM DE RESULTADOS */}
            {!itemSelecionado && itensEncontrados.length > 0 && (
                <div className="resultados-lista" style={{ animation: 'fadeIn 0.3s ease-in' }}>
                    <p style={{ marginBottom: '10px', color: '#475569' }}>Encontramos {itensEncontrados.length} itens. <strong>Clique no correto:</strong></p>
                    {itensEncontrados.map(item => (
                        <div key={item.id} className="item-resultado-card" onClick={() => setItemSelecionado(item)}
                            style={{
                                padding: '15px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '10px',
                                marginBottom: '10px',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}>
                            <div>
                                <strong style={{ fontSize: '1.1rem', color: '#1e293b' }}>{item.nome}</strong>
                                <div style={{ marginTop: '4px' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        background: item.patrimonio === 'S/P' ? '#fee2e2' : '#f1f5f9',
                                        color: item.patrimonio === 'S/P' ? '#b91c1c' : '#475569',
                                        fontWeight: 'bold'
                                    }}>
                                        {item.patrimonio}
                                    </span>
                                    <span style={{ marginLeft: '10px', color: '#64748b', fontSize: '0.85rem' }}>📍 {item.unidade} ({item.setor})</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FORMULÁRIO DE MOVIMENTAÇÃO */}
            {itemSelecionado && (
                <form onSubmit={handleSaida} className="equip-form" style={{ background: '#fff', padding: '25px', borderRadius: '15px', border: '1px solid #4f46e5' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div>
                            <h2 style={{ color: '#1e293b' }}>{itemSelecionado.nome}</h2>
                            <p style={{ color: '#64748b' }}>Localização Atual: {itemSelecionado.unidade} - {itemSelecionado.setor}</p>
                        </div>
                        <button type="button" onClick={() => setItemSelecionado(null)} style={{ background: '#fff1f2', color: '#e11d48', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' }}>Trocar Item</button>
                    </div>

                    {/* CAMPO CONDICIONAL PARA ITEM S/P */}
                    {itemSelecionado.patrimonio === 'S/P' && (
                        <div style={{
                            background: '#fffbeb',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid #fcd34d',
                            marginBottom: '20px'
                        }}>
                            <label style={{ color: '#92400e', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                                📢 Item sem patrimônio! Deseja numerar agora?
                            </label>
                            <input
                                type="text"
                                placeholder="Digite o novo Nº de Patrimônio (Opcional)"
                                value={novoPatrimonioParaSP}
                                onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                style={{ borderColor: '#fcd34d' }}
                            />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Unidade de Destino:</label>
                            <select required onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                <option value="">Selecione a Unidade...</option>
                                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Novo Setor:</label>
                            <input type="text" required placeholder="Ex: CTI Adulto" onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Responsável pelo Recebimento:</label>
                        <input type="text" required placeholder="Quem recebeu o item?" onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-registrar-patrimonio" disabled={loading} style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', width: '100%', marginTop: '10px' }}>
                        {loading ? 'Gravando Alterações...' : 'Confirmar Saída e Atualizar Local'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SaidaEquipamento;