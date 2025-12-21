import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../styles/CadastroEquipamento.css';

const BaixaPatrimonio = () => {
    const [busca, setBusca] = useState('');
    const [itensEncontrados, setItensEncontrados] = useState([]);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [loading, setLoading] = useState(false);

    const [dadosBaixa, setDadosBaixa] = useState({
        motivo: 'Sucata/Danificado',
        observacao: '',
        autorizadoPor: ''
    });

    const buscarEquipamento = async () => {
        if (!busca) {
            toast.warn("Digite o patrimônio ou nome do item.");
            return;
        }

        setLoading(true);
        setItemSelecionado(null);
        setItensEncontrados([]);

        try {
            const ativosRef = collection(db, "ativos");
            const termoBusca = busca.toUpperCase().trim();

            // Tenta buscar primeiro por Patrimônio exato
            let q = query(ativosRef, where("patrimonio", "==", termoBusca), where("status", "==", "Ativo"));
            let querySnapshot = await getDocs(q);

            // Se não achou por patrimônio, tenta buscar por Nome (para itens S/P)
            if (querySnapshot.empty) {
                q = query(
                    ativosRef,
                    where("nome", ">=", busca),
                    where("nome", "<=", busca + '\uf8ff'),
                    where("status", "==", "Ativo"),
                    limit(10)
                );
                querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
                const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setItensEncontrados(lista);
                if (lista.length === 1) setItemSelecionado(lista[0]);
                toast.success(`${lista.length} item(s) encontrado(s)`);
            } else {
                toast.error("Nenhum item ativo encontrado com este termo.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro na busca.");
        } finally {
            setLoading(false);
        }
    };

    const handleBaixa = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);

            await updateDoc(ativoRef, {
                status: 'Baixado',
                dataBaixa: serverTimestamp(),
                motivoBaixa: dadosBaixa.motivo,
                ultimaMovimentacao: serverTimestamp()
            });

            await addDoc(collection(db, "historico_baixas"), {
                ativoId: itemSelecionado.id,
                patrimonio: itemSelecionado.patrimonio,
                nome: itemSelecionado.nome,
                unidadeAnterior: itemSelecionado.unidade,
                setorAnterior: itemSelecionado.setor,
                motivo: dadosBaixa.motivo,
                observacao: dadosBaixa.observacao,
                autorizadoPor: dadosBaixa.autorizadoPor,
                dataBaixa: serverTimestamp()
            });

            toast.success("Baixa definitiva registrada!");
            setItemSelecionado(null);
            setItensEncontrados([]);
            setBusca('');
            setDadosBaixa({ motivo: 'Sucata/Danificado', observacao: '', autorizadoPor: '' });
        } catch (error) {
            toast.error("Erro ao processar baixa.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>⚠️ Baixa de Patrimônio</h1>
                <Link to="/" className="back-link">Voltar ao Início</Link>
            </header>

            {/* BUSCA COM DESIGN MELHORADO */}
            <div className="busca-unificada-container" style={{
                background: '#fff',
                padding: '25px',
                borderRadius: '16px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                marginBottom: '25px',
                border: '1px solid #e2e8f0'
            }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>
                    Buscar por Patrimônio ou Nome (Itens S/P):
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                        type="text"
                        placeholder="Ex: HMC-001 ou Monitor Dell..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid #cbd5e1',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                    />
                    <button
                        onClick={buscarEquipamento}
                        disabled={loading}
                        style={{
                            padding: '0 25px',
                            borderRadius: '10px',
                            backgroundColor: '#1e293b',
                            color: 'white',
                            fontWeight: '600',
                            cursor: 'pointer',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#334155'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#1e293b'}
                    >
                        {loading ? '...' : '🔍 Buscar'}
                    </button>
                </div>
            </div>

            {/* SELEÇÃO QUANDO HÁ MÚLTIPLOS RESULTADOS (S/P) */}
            {!itemSelecionado && itensEncontrados.length > 1 && (
                <div style={{ marginBottom: '20px', display: 'grid', gap: '10px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b' }}>Selecione o item para baixa:</p>
                    {itensEncontrados.map(item => (
                        <div
                            key={item.id}
                            onClick={() => setItemSelecionado(item)}
                            style={{
                                padding: '12px',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}
                        >
                            <span><strong>{item.nome}</strong> - {item.patrimonio}</span>
                            <span style={{ color: '#6366f1' }}>Selecionar →</span>
                        </div>
                    ))}
                </div>
            )}

            {itemSelecionado && (
                <form onSubmit={handleBaixa} className="equip-form" style={{ borderTop: '4px solid #ef4444', animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h3 style={{ color: '#991b1b' }}>Confirmação de Baixa</h3>
                            <button type="button" onClick={() => setItemSelecionado(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Trocar Item</button>
                        </div>
                        <p style={{ marginTop: '10px' }}><strong>Item:</strong> {itemSelecionado.nome} | <strong>Patrimônio:</strong> {itemSelecionado.patrimonio}</p>
                        <p><strong>Localização:</strong> {itemSelecionado.unidade} ({itemSelecionado.setor})</p>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Motivo da Baixa:</label>
                            <select value={dadosBaixa.motivo} required onChange={(e) => setDadosBaixa({ ...dadosBaixa, motivo: e.target.value })}>
                                <option value="Sucata/Danificado">Sucata / Danificado</option>
                                <option value="Extravio/Roubo">Extravio / Roubo</option>
                                <option value="Leilão">Leilão</option>
                                <option value="Devolução">Devolução ao Fornecedor</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Autorizado por:</label>
                            <input type="text" required placeholder="Nome do Responsável" value={dadosBaixa.autorizadoPor} onChange={(e) => setDadosBaixa({ ...dadosBaixa, autorizadoPor: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observações da Baixa:</label>
                        <textarea placeholder="Detalhes técnicos sobre o motivo da baixa..." value={dadosBaixa.observacao} onChange={(e) => setDadosBaixa({ ...dadosBaixa, observacao: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-registrar-patrimonio" disabled={loading} style={{ background: '#b91c1c', width: '100%', padding: '15px', fontSize: '1rem' }}>
                        {loading ? 'Processando...' : 'Confirmar BAIXA DEFINITIVA'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default BaixaPatrimonio;