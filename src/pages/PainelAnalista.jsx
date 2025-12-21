import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import '../styles/MeusChamados.css';

const PainelAnalista = () => {
    const { userData } = useAuth();
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [aguardandoConfirmação, setAguardandoConfirmação] = useState(false);
    const [chamadoParaFinalizar, setChamadoParaFinalizar] = useState(null);
    const [parecerTecnico, setParecerTecnico] = useState("");

    // ✅ Estados para os indicadores e unidades
    const [stats, setStats] = useState({ abertos: 0, hoje: 0, total: 0 });
    const [statsUnidades, setStatsUnidades] = useState({});

    const buscarTodosChamados = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
            const querySnapshot = await getDocs(q);
            const lista = [];

            let contAbertos = 0;
            let contHoje = 0;
            const dataHoje = new Date().toLocaleDateString('pt-BR');
            const unidadesMap = {};

            querySnapshot.forEach((doc) => {
                const dados = doc.data();
                lista.push({ id: doc.id, ...dados });

                // Contar abertos
                if (dados.status?.toLowerCase() === 'aberto') {
                    contAbertos++;

                    // ✅ Contagem por unidade (apenas para chamados abertos)
                    if (dados.unidade) {
                        unidadesMap[dados.unidade] = (unidadesMap[dados.unidade] || 0) + 1;
                    }
                }

                // Contar chamados do dia
                if (dados.criadoEm) {
                    const dataDoc = dados.criadoEm.toDate().toLocaleDateString('pt-BR');
                    if (dataDoc === dataHoje) {
                        contHoje++;
                    }
                }
            });

            setChamados(lista);
            setStatsUnidades(unidadesMap);
            setStats({
                abertos: contAbertos,
                hoje: contHoje,
                total: lista.length
            });
        } catch (error) {
            toast.error("Erro ao carregar chamados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarTodosChamados();
    }, []);

    const exportarEZerarFila = async () => {
        setIsExporting(true);
        const idToast = toast.loading("Preparando exportação...");
        try {
            const dadosExcel = chamados.map(c => ({
                OS: c.numeroOs,
                Solicitante: c.nome,
                Setor: c.setor,
                Unidade: c.unidade,
                Status: c.status,
                Parecer: c.feedbackAnalista || "",
                Data: c.criadoEm?.toDate().toLocaleString() || ""
            }));

            const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Chamados");
            XLSX.writeFile(workbook, `Backup_Chamados_${new Date().toLocaleDateString()}.xlsx`);

            const batch = writeBatch(db);
            chamados.forEach((c) => {
                const ref = doc(db, "chamados", c.id);
                batch.delete(ref);
            });

            await batch.commit();
            toast.update(idToast, { render: "Fila zerada e Excel baixado!", type: "success", isLoading: false, autoClose: 3000 });
            setChamados([]);
            setStats({ abertos: 0, hoje: 0, total: 0 });
            setStatsUnidades({});
            setAguardandoConfirmação(false);
        } catch (error) {
            toast.update(idToast, { render: "Erro na operação.", type: "error", isLoading: false, autoClose: 3000 });
        } finally {
            setIsExporting(false);
        }
    };

    const confirmarFinalizacao = async () => {
        if (!parecerTecnico.trim()) {
            toast.warning("Descreva o parecer técnico antes de fechar.");
            return;
        }

        try {
            const analistaLogado = auth.currentUser;
            const chamadoRef = doc(db, "chamados", chamadoParaFinalizar);

            await updateDoc(chamadoRef, {
                status: 'fechado',
                feedbackAnalista: parecerTecnico,
                tecnicoResponsavel: analistaLogado.displayName || "Equipe de TI",
                finalizadoEm: serverTimestamp()
            });

            toast.success("Chamado finalizado com sucesso!");
            setChamadoParaFinalizar(null);
            setParecerTecnico("");
            buscarTodosChamados();
        } catch (error) {
            toast.error("Erro ao concluir chamado.");
        }
    };

    return (
        <div className="meus-chamados-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#1e293b' }}>Fila Geral (Analista)</h1>
                    <Link to="/" className="back-link" style={{ textDecoration: 'none', color: '#6366f1', fontWeight: '500' }}>← Voltar ao Início</Link>
                </div>

                {userData?.role === 'adm' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {!aguardandoConfirmação ? (
                            <button
                                onClick={() => setAguardandoConfirmação(true)}
                                style={{ backgroundColor: '#475569', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                            >
                                📥 Exportar e Limpar
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fee2e2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                                <span style={{ color: '#991b1b', fontSize: '0.85rem', fontWeight: 'bold' }}>Tem certeza?</span>
                                <button onClick={exportarEZerarFila} style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Sim</button>
                                <button onClick={() => setAguardandoConfirmação(false)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Não</button>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* ✅ SEÇÃO DE CARDS DE INDICADORES PRINCIPAIS */}
            {!loading && (
                <>
                    <div className="stats-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                        <div className="stat-card" style={{ background: '#fff', padding: '15px', borderRadius: '10px', borderLeft: '5px solid #6366f1', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>TOTAL NA FILA</span>
                            <h2 style={{ fontSize: '1.6rem', margin: '5px 0', color: '#1e293b' }}>{stats.total}</h2>
                        </div>
                        <div className="stat-card" style={{ background: '#fff', padding: '15px', borderRadius: '10px', borderLeft: '5px solid #f59e0b', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>⏳ AGUARDANDO (ABERTOS)</span>
                            <h2 style={{ fontSize: '1.6rem', margin: '5px 0', color: '#d97706' }}>{stats.abertos}</h2>
                        </div>
                        <div className="stat-card" style={{ background: '#fff', padding: '15px', borderRadius: '10px', borderLeft: '5px solid #10b981', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b' }}>🆕 CHAMADOS DE HOJE</span>
                            <h2 style={{ fontSize: '1.6rem', margin: '5px 0', color: '#059669' }}>{stats.hoje}</h2>
                        </div>
                    </div>

                    {/* ✅ SEÇÃO DE INDICADORES POR UNIDADE */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px', marginBottom: '25px' }}>
                        {Object.entries(statsUnidades).length > 0 ? (
                            Object.entries(statsUnidades).map(([nomeUnidade, qtd]) => (
                                <div key={nomeUnidade} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>{nomeUnidade}</span>
                                    <span style={{ background: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{qtd}</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Nenhum chamado aberto por unidade.</div>
                        )}
                    </div>
                </>
            )}

            {loading ? <div className="loading-state">Carregando chamados...</div> : (
                <div className="table-responsive" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <table className="chamados-table">
                        <thead>
                            <tr>
                                <th>OS</th>
                                <th>Solicitante</th>
                                <th>Setor</th>
                                <th>Descrição / Parecer</th>
                                <th>Unidade</th>
                                <th style={{ textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td className="os-cell" style={{ fontWeight: 'bold', color: '#4f46e5' }}>#{item.numeroOs || 'S/N'}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '600' }}>{item.nome}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.prioridade}</span>
                                        </div>
                                    </td>
                                    <td>{item.setor}</td>
                                    <td style={{ maxWidth: '350px' }}>
                                        {item.status === 'fechado' ? (
                                            <div style={{ background: '#f0fdf4', padding: '8px', borderRadius: '6px', borderLeft: '4px solid #22c55e' }}>
                                                <small style={{ fontWeight: 'bold', color: '#166534' }}>PARECER TÉCNICO:</small>
                                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#166534' }}>{item.feedbackAnalista}</p>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '0.85rem', color: '#475569' }}>{item.descricao}</p>
                                        )}
                                    </td>
                                    <td>{item.unidade}</td>
                                    <td style={{ minWidth: '180px' }}>
                                        {item.status === 'aberto' ? (
                                            chamadoParaFinalizar === item.id ? (
                                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <textarea
                                                        value={parecerTecnico}
                                                        onChange={(e) => setParecerTecnico(e.target.value)}
                                                        placeholder="O que foi feito para resolver?"
                                                        style={{ width: '100%', minHeight: '80px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '8px', fontSize: '0.85rem', marginBottom: '8px', outline: 'none' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            onClick={confirmarFinalizacao}
                                                            style={{ flex: 1, backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                                                        >
                                                            Confirmar
                                                        </button>
                                                        <button
                                                            onClick={() => { setChamadoParaFinalizar(null); setParecerTecnico(""); }}
                                                            style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem' }}
                                                        >
                                                            Sair
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setChamadoParaFinalizar(item.id)}
                                                    style={{ width: '100%', backgroundColor: '#6366f1', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                                                    onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
                                                    onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
                                                >
                                                    Finalizar Chamado
                                                </button>
                                            )
                                        ) : (
                                            <div style={{ textAlign: 'center', color: '#22c55e', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                <span>✓</span> CONCLUÍDO
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PainelAnalista;