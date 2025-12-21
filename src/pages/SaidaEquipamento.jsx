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
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');

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

        try {
            const ativosRef = collection(db, "ativos");
            let q;

            if (tipo === 'patrimonio') {
                const termo = patrimonioBusca.toUpperCase().trim();
                if (termo === 'S/P' || termo === 'SP') {
                    toast.info("Para itens S/P, use o campo de busca por NOME.");
                    setLoading(false);
                    return;
                }
                q = query(ativosRef, where("patrimonio", "==", termo), where("status", "==", "Ativo"));
                const snap = await getDocs(q);
                const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                processarResultados(lista);
            } else {
                // ESTRATÉGIA NOVA: Busca global por itens ativos e filtra no código
                const termoOriginal = nomeBusca.toLowerCase().trim();
                if (!termoOriginal) { toast.warn("Digite o nome."); setLoading(false); return; }

                // Buscamos os itens Ativos (limitado a 100 para não pesar)
                const qGeral = query(ativosRef, where("status", "==", "Ativo"), limit(100));
                const snapGeral = await getDocs(qGeral);

                const listaFiltrada = snapGeral.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item =>
                        item.nome.toLowerCase().includes(termoOriginal) ||
                        item.patrimonio.toLowerCase() === termoOriginal
                    );

                processarResultados(listaFiltrada);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar.");
        } finally {
            setLoading(false);
        }
    };

    const processarResultados = (lista) => {
        if (lista.length > 0) {
            setItensEncontrados(lista);
            if (lista.length === 1) {
                setItemSelecionado(lista[0]);
                toast.success("Item localizado!");
            }
        } else {
            toast.error("Nenhum item encontrado. Verifique se está cadastrado como 'Ativo'.");
        }
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);
            const patrimonioFinal = (itemSelecionado.patrimonio === 'S/P' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase()
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

            toast.success("Transferência realizada!");
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
                <Link to="/" className="back-link">Voltar</Link>
            </header>

            {/* BUSCA POR PATRIMÔNIO */}
            <div className="busca-unificada-container" style={{
                background: '#fff', padding: '20px', borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '15px', border: '1px solid #e2e8f0'
            }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Nº Patrimônio:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text" placeholder="HMC-001" value={patrimonioBusca}
                        onChange={(e) => setPatrimonioBusca(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button onClick={() => executarBusca('patrimonio')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#1e293b', color: 'white', border: 'none', cursor: 'pointer' }}>Buscar</button>
                </div>
            </div>

            {/* BUSCA POR NOME (AQUI É ONDE TUDO É RESOLVIDO) */}
            <div className="busca-unificada-container" style={{
                background: '#fff', padding: '20px', borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px', border: '1px solid #e2e8f0'
            }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#475569' }}>Busca por Nome ou S/P:</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text" placeholder="Ex: mesa, monitor, sp..." value={nomeBusca}
                        onChange={(e) => setNomeBusca(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                    <button onClick={() => executarBusca('nome')} style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#4f46e5', color: 'white', border: 'none', cursor: 'pointer' }}>Buscar Nome</button>
                </div>
            </div>

            {/* LISTA DE RESULTADOS */}
            {!itemSelecionado && itensEncontrados.length > 0 && (
                <div style={{ marginBottom: '20px', maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '10px' }}>
                    {itensEncontrados.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setItemSelecionado(item)}
                            style={{
                                padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer',
                                display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff'
                            }}
                        >
                            <span><strong>{item.nome}</strong> — {item.patrimonio}</span>
                            <small style={{ color: '#6366f1' }}>{item.unidade}</small>
                        </div>
                    ))}
                </div>
            )}

            {/* FORMULÁRIO DE SAÍDA */}
            {itemSelecionado && (
                <form onSubmit={handleSaida} className="equip-form" style={{ borderTop: '4px solid #4f46e5' }}>
                    <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>{itemSelecionado.nome}</strong>
                            <button type="button" onClick={() => setItemSelecionado(null)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>[Trocar]</button>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Patrimônio Atual: {itemSelecionado.patrimonio}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Local Atual: {itemSelecionado.unidade}</p>
                    </div>

                    {itemSelecionado.patrimonio === 'S/P' && (
                        <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Deseja numerar este S/P agora?</label>
                            <input type="text" placeholder="Novo Patrimônio" value={novoPatrimonioParaSP} onChange={(e) => setNovoPatrimonioParaSP(e.target.value)} />
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Unidade de Destino:</label>
                            <select required onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                <option value="">Selecione...</option>
                                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Novo Setor:</label>
                            <input type="text" required placeholder="Ex: Financeiro" onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Responsável pelo Recebimento:</label>
                        <input type="text" required placeholder="Nome de quem recebeu" onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-registrar-patrimonio" disabled={loading} style={{ width: '100%', backgroundColor: '#4f46e5' }}>
                        {loading ? 'Processando...' : 'Confirmar Transferência'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SaidaEquipamento;