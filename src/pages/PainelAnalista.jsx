import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy, writeBatch } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { FiX, FiClipboard, FiDownload, FiEye, FiPrinter, FiSearch } from 'react-icons/fi';
import '../styles/MeusChamados.css';

const PainelAnalista = () => {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

    // Modais
    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
    const [mostrarBuscaImpressao, setMostrarBuscaImpressao] = useState(false);

    const [chamadoParaFinalizar, setChamadoParaFinalizar] = useState(null);
    const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
    const [numeroOsBusca, setNumeroOsBusca] = useState("");

    const [parecerTecnico, setParecerTecnico] = useState("");
    const [patrimonio, setPatrimonio] = useState("");

    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

    const formatarDataHora = (timestamp) => {
        if (!timestamp) return "---";
        const date = timestamp.toDate();
        return date.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

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

    // FUNÇÃO DE BUSCA REVISADA
    const handleBuscarEImprimir = (e) => {
        e.preventDefault();

        // 1. Normaliza o que o usuário digitou (remove # e espaços)
        const termoBusca = numeroOsBusca.replace('#', '').trim();

        // 2. Procura na lista que veio do Firebase
        const encontrado = chamados.find(c => {
            // Normaliza o numeroOs do banco para comparação
            const osNoBanco = String(c.numeroOs).replace('#', '').trim();
            return osNoBanco === termoBusca;
        });

        if (encontrado) {
            setMostrarBuscaImpressao(false);
            setNumeroOsBusca("");
            // 3. Navega usando o ID do documento do Firebase
            // Certifique-se que sua rota no App.js é exatamente /imprimir-os/:id
            navigate(`/imprimir-os/${encontrado.id}`);
        } else {
            toast.error(`A OS #${termoBusca} não foi encontrada na lista. Verifique se ela já não foi exportada/apagada.`);
        }
    };

    const handleExportarELimpar = async () => {
        try {
            const chamadosFechados = chamados.filter(c => c.status === 'fechado');
            if (chamadosFechados.length === 0) {
                toast.warning("Não há chamados FECHADOS para exportar.");
                setAguardandoConfirmacao(false);
                return;
            }

            const dadosExportacao = chamadosFechados.map(c => ({
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

            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo: "CHAMADOS_POWERBI", dados: dadosExportacao })
            });

            const ws = XLSX.utils.json_to_sheet(dadosExportacao);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Chamados");
            XLSX.writeFile(wb, `Relatorio_Chamados_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);

            const batch = writeBatch(db);
            chamadosFechados.forEach((c) => { batch.delete(doc(db, "chamados", c.id)); });
            await batch.commit();

            toast.success("Sincronização concluída!");
            buscarTodosChamados();
            setAguardandoConfirmacao(false);
        } catch (error) {
            toast.error("Erro na exportação.");
        }
    };

    const abrirModalFinalizar = (chamado) => {
        setChamadoParaFinalizar(chamado);
        setMostrarModal(true);
    };

    const verDetalhesChamado = (chamado) => {
        setChamadoSelecionado(chamado);
        setMostrarDetalhes(true);
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

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={() => setMostrarBuscaImpressao(true)}
                        className="btn-print-top"
                        style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}
                    >
                        <FiPrinter /> Imprimir OS
                    </button>

                    {userData?.role === 'adm' && (
                        <>
                            {!aguardandoConfirmacao ? (
                                <button onClick={() => setAguardandoConfirmacao(true)} className="btn-action-remove" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FiDownload /> Exportar e Limpar
                                </button>
                            ) : (
                                <div className="confirm-action-box" style={{ background: '#fee2e2', padding: '10px', borderRadius: '8px', border: '1px solid #ef4444' }}>
                                    <small style={{ color: '#991b1b', fontWeight: 'bold' }}>Confirmar exclusão?</small>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                        <button onClick={handleExportarELimpar} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Sim</button>
                                        <button onClick={() => setAguardandoConfirmacao(false)} style={{ background: '#64748b', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px' }}>Não</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </header>

            {mostrarBuscaImpressao && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h2>Imprimir Relatório</h2>
                            <button onClick={() => setMostrarBuscaImpressao(false)} className="btn-close-modal"><FiX /></button>
                        </div>
                        <form onSubmit={handleBuscarEImprimir}>
                            <div className="input-group">
                                <label>Número da OS (Ex: 2025-9218)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={numeroOsBusca}
                                    onChange={(e) => setNumeroOsBusca(e.target.value)}
                                    placeholder="Digite a OS aqui..."
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn-salvar-modern" style={{ width: '100%', marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <FiSearch /> Buscar e Imprimir
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAIS DE FINALIZAR E DETALHES ABAIXO... */}
            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Encerrar Chamado #{chamadoParaFinalizar?.numeroOs}</h2>
                            <button onClick={() => setMostrarModal(false)} className="btn-close-modal"><FiX /></button>
                        </div>
                        <form onSubmit={handleFinalizarChamado}>
                            <div className="input-group" style={{ marginBottom: '15px' }}>
                                <label>Patrimônio / TAG</label>
                                <input type="text" className="form-input" style={{ textTransform: 'uppercase' }} value={patrimonio} onChange={(e) => setPatrimonio(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label>Parecer Técnico</label>
                                <textarea className="form-input" style={{ minHeight: '100px' }} value={parecerTecnico} onChange={(e) => setParecerTecnico(e.target.value)} required />
                            </div>
                            <div className="modal-actions-row" style={{ marginTop: '20px' }}>
                                <button type="button" onClick={() => setMostrarModal(false)} className="btn-cancelar">Cancelar</button>
                                <button type="submit" className="btn-salvar-modern">Finalizar Chamado</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {mostrarDetalhes && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ borderTop: '8px solid #ef4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2>Detalhes da OS #{chamadoSelecionado?.numeroOs}</h2>
                            <button onClick={() => setMostrarDetalhes(false)} className="btn-close-modal"><FiX /></button>
                        </div>
                        <div className="detalhes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                            <p><strong>Solicitante:</strong> {chamadoSelecionado?.nome}</p>
                            <p><strong>Unidade:</strong> {chamadoSelecionado?.unidade}</p>
                            <p><strong>Status:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{chamadoSelecionado?.status.toUpperCase()}</span></p>
                            <p><strong>Patrimônio:</strong> {chamadoSelecionado?.patrimonio}</p>
                        </div>
                        <button onClick={() => setMostrarDetalhes(false)} className="btn-cancelar" style={{ width: '100%', marginTop: '20px' }}>Fechar Visualização</button>
                    </div>
                </div>
            )}

            {loading ? <div className="loading">Carregando...</div> : (
                <div className="table-wrapper">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>OS</th>
                                <th>Aberto em</th>
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
                                    <td>{formatarDataHora(item.criadoEm)}</td>
                                    <td>{item.nome}</td>
                                    <td>{item.unidade}</td>
                                    <td>
                                        <span style={{
                                            background: item.status === 'aberto' ? '#dcfce7' : '#fee2e2',
                                            color: item.status === 'aberto' ? '#166534' : '#991b1b',
                                            padding: '4px 10px', borderRadius: '6px', fontWeight: 'bold'
                                        }}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        {item.status === 'aberto' ? (
                                            <button onClick={() => abrirModalFinalizar(item)} className="btn-abrir"><FiClipboard /> Finalizar</button>
                                        ) : (
                                            <button onClick={() => verDetalhesChamado(item)} className="btn-visualizar"><FiEye /> Ver</button>
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