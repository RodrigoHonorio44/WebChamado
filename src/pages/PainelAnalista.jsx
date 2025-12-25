import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy, writeBatch, deleteDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiCheck, FiX, FiClipboard, FiDownload } from 'react-icons/fi';
import '../styles/MeusChamados.css';

const PainelAnalista = () => {
    const { userData } = useAuth();
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

    const [mostrarModal, setMostrarModal] = useState(false);
    const [chamadoParaFinalizar, setChamadoParaFinalizar] = useState(null);
    const [parecerTecnico, setParecerTecnico] = useState("");
    const [patrimonio, setPatrimonio] = useState("");

    const buscarTodosChamados = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
            const querySnapshot = await getDocs(q);
            const lista = [];
            querySnapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            setChamados(lista);
        } catch (error) {
            toast.error("Erro ao carregar chamados.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarTodosChamados();
    }, []);

    // ✅ LÓGICA DE EXPORTAR E LIMPAR (IGUAL AO SEU ANTIGO)
    const handleExportarELimpar = async () => {
        try {
            if (chamados.length === 0) {
                toast.warning("Não há chamados para exportar.");
                return;
            }

            // 1. Preparar dados para o Excel
            const dadosExcel = chamados.map(c => ({
                OS: c.numeroOs,
                Data: c.criadoEm?.toDate().toLocaleString('pt-BR'),
                Solicitante: c.nome,
                Unidade: c.unidade,
                Descricao: c.descricao,
                Status: c.status,
                Patrimonio: c.patrimonio || "N/A",
                Parecer_Tecnico: c.feedbackAnalista || "",
                Finalizado_Por: c.tecnicoResponsavel || "",
                Finalizado_Em: c.finalizadoEm?.toDate().toLocaleString('pt-BR') || ""
            }));

            const ws = XLSX.utils.json_to_sheet(dadosExcel);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Chamados");
            XLSX.writeFile(wb, `Relatorio_Chamados_${new Date().toLocaleDateString()}.xlsx`);

            // 2. Limpar chamados do Firebase usando Batch
            const batch = writeBatch(db);
            chamados.forEach((c) => {
                const docRef = doc(db, "chamados", c.id);
                batch.delete(docRef);
            });

            await batch.commit();

            toast.success("Dados exportados e base limpa com sucesso!");
            setChamados([]);
            setAguardandoConfirmacao(false);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao processar limpeza.");
        }
    };

    const abrirModalFinalizar = (chamado) => {
        setChamadoParaFinalizar(chamado);
        setMostrarModal(true);
    };

    const handleFinalizarChamado = async (e) => {
        e.preventDefault();
        if (!parecerTecnico.trim() || !patrimonio.trim()) {
            toast.warning("Preencha todos os campos.");
            return;
        }

        try {
            const analistaLogado = auth.currentUser;
            const chamadoRef = doc(db, "chamados", chamadoParaFinalizar.id);

            await updateDoc(chamadoRef, {
                status: 'fechado',
                feedbackAnalista: parecerTecnico,
                patrimonio: patrimonio.toUpperCase(),
                tecnicoResponsavel: analistaLogado.displayName || userData?.name || "Analista",
                finalizadoEm: serverTimestamp()
            });

            toast.success("Chamado finalizado!");
            setMostrarModal(false);
            setParecerTecnico("");
            setPatrimonio("");
            buscarTodosChamados();
        } catch (error) {
            toast.error("Erro ao finalizar.");
        }
    };

    return (
        <div className="meus-chamados-container">
            <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1>Fila de Chamados</h1>
                    <Link to="/" className="back-link">← Voltar</Link>
                </div>

                {/* BOTÃO DE EXPORTAR E LIMPAR */}
                {userData?.role === 'adm' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {!aguardandoConfirmacao ? (
                            <button onClick={() => setAguardandoConfirmacao(true)} className="btn-action-remove" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FiDownload /> Exportar e Zerar Base
                            </button>
                        ) : (
                            <div className="confirm-action-box" style={{ background: '#fee2e2', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                <small style={{ color: '#991b1b', fontWeight: 'bold' }}>Deseja baixar o Excel e APAGAR tudo?</small>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                    <button onClick={handleExportarELimpar} className="btn-sim" style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Sim, Limpar</button>
                                    <button onClick={() => setAguardandoConfirmacao(false)} className="btn-nao" style={{ background: '#64748b', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>Não</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* MODAL DE FINALIZAÇÃO */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Encerrar Chamado #{chamadoParaFinalizar?.numeroOs}</h2>
                            <button onClick={() => setMostrarModal(false)} className="btn-close-modal"><FiX /></button>
                        </div>

                        <form onSubmit={handleFinalizarChamado}>
                            <div className="input-group" style={{ marginBottom: '15px' }}>
                                <label>Patrimônio / TAG (ou S/P)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    style={{ textTransform: 'uppercase' }}
                                    placeholder="Número do patrimônio"
                                    value={patrimonio}
                                    onChange={(e) => setPatrimonio(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Parecer Técnico</label>
                                <textarea
                                    className="form-input"
                                    style={{ minHeight: '100px' }}
                                    placeholder="O que foi feito?"
                                    value={parecerTecnico}
                                    onChange={(e) => setParecerTecnico(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="modal-actions-row" style={{ marginTop: '20px' }}>
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-cancelar">Cancelar</button>
                                <button type="submit" className="btn-salvar-modern">Finalizar Chamado</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TABELA */}
            {loading ? <div className="loading">Carregando...</div> : (
                <div className="table-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>OS</th>
                                <th>Solicitante</th>
                                <th>Unidade</th>
                                <th>Status</th>
                                <th>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id}>
                                    <td>#{item.numeroOs}</td>
                                    <td>{item.nome}</td>
                                    <td>{item.unidade}</td>
                                    <td>
                                        <span className={`badge-role ${item.status === 'aberto' ? 'user' : 'analista'}`} style={{ background: item.status === 'aberto' ? '#fee2e2' : '#dcfce7', color: item.status === 'aberto' ? '#991b1b' : '#166534' }}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        {item.status === 'aberto' ? (
                                            <button onClick={() => abrirModalFinalizar(item)} className="btn-abrir"><FiClipboard /> Finalizar</button>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Concluído por: {item.tecnicoResponsavel}</span>
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