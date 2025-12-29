import React, { useState, useEffect } from 'react';
import { db, auth } from '../api/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { FiSearch, FiLogOut, FiShield, FiAlertTriangle, FiCheck, FiX, FiRefreshCw, FiTrash2, FiCloudLightning } from 'react-icons/fi';
import '../styles/Inventario.css';

const Inventario = () => {
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [buscando, setBuscando] = useState(false);

    const [unidadeFiltro, setUnidadeFiltro] = useState('Todas');
    const [statusFiltro, setStatusFiltro] = useState('Ativo');
    const [buscaPatrimonio, setBuscaPatrimonio] = useState('');
    const [termoAplicado, setTermoAplicado] = useState('');

    const [modalBaixa, setModalBaixa] = useState({ aberto: false, id: null, nome: '' });
    const navigate = useNavigate();

    // 🔗 URL DO GOOGLE APPS SCRIPT (Certifique-se de usar a URL da 'Nova Implantação')
    const WEBAPP_URL_SHEETS = "https://script.google.com/macros/s/AKfycbwHsFnuMc_onDTG9vloDYNW6o_eIrTTfXt6O4WuhGxEP86rl1ZH4WY6o_JsSSljZqck3g/exec";

    useEffect(() => {
        const verificarPermissao = async () => {
            const user = auth.currentUser;
            if (!user) {
                toast.error("Acesso negado.");
                navigate('/');
                return;
            }
            try {
                const userDoc = await getDoc(doc(db, "usuarios", user.uid));
                if (userDoc.exists() && userDoc.data().role === 'adm') {
                    setIsAdmin(true);
                } else {
                    toast.error("Acesso restrito!");
                    navigate('/');
                }
            } catch (error) {
                navigate('/');
            } finally {
                setLoading(false);
            }
        };
        verificarPermissao();
    }, [navigate]);

    const carregarDados = async (e) => {
        if (e) e.preventDefault();
        setBuscando(true);
        setTermoAplicado(buscaPatrimonio.trim().toUpperCase());

        try {
            const querySnapshot = await getDocs(collection(db, "ativos"));
            const todosOsDados = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItens(todosOsDados);
            if (todosOsDados.length === 0) toast.info("Nenhum item encontrado.");
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setBuscando(false);
        }
    };

    const limparFiltros = () => {
        setBuscaPatrimonio('');
        setTermoAplicado('');
        setUnidadeFiltro('Todas');
        setStatusFiltro('Ativo');
        setItens([]);
        toast.info("Filtros resetados.");
    };

    const itensParaExibirNaTela = itens.filter(item => {
        let matchBusca = true;
        if (termoAplicado !== "") {
            const patItem = String(item.patrimonio).toUpperCase().trim();
            matchBusca = (patItem === termoAplicado || (termoAplicado === "SP" && patItem === "S/P"));
        }
        const matchUnidade = unidadeFiltro === 'Todas' ||
            item.unidade?.toLowerCase().trim() === unidadeFiltro.toLowerCase().trim();
        const matchStatus = statusFiltro === 'Todos' || item.status === statusFiltro;
        return matchBusca && matchUnidade && matchStatus;
    });

    const abrirModalConfirmacao = (id, nome) => setModalBaixa({ aberto: true, id, nome });
    const fecharModal = () => setModalBaixa({ aberto: false, id: null, nome: '' });

    const confirmarBaixa = async () => {
        try {
            await updateDoc(doc(db, "ativos", modalBaixa.id), {
                status: "Baixado",
                dataBaixa: serverTimestamp()
            });
            toast.warning(`Patrimônio ${modalBaixa.nome} marcado como inutilizado.`);
            fecharModal();
            carregarDados();
        } catch (error) {
            toast.error("Erro ao processar baixa.");
        }
    };

    const formatarData = (timestamp) => {
        if (!timestamp) return "---";
        const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return data.toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const exportarExcelCompleto = async (e) => {
        if (e) e.preventDefault();
        if (itens.length === 0) return toast.error("Clique em 'Consultar' primeiro.");

        toast.info("Sincronizando abas e enviando...");

        // 1. GERAR EXCEL LOCAL (Apenas para download do usuário)
        const wb = XLSX.utils.book_new();
        const configuracaoAbas = [
            { label: "HOSPITAL CONDE", busca: "hospital conde" },
            { label: "UPA SANTA RITA", busca: "santa rita" },
            { label: "UPA INOÃ", busca: "inoã" },
            { label: "SAMU BARROCO", busca: "samu barroco" },
            { label: "SAMU PONTA NEGRA", busca: "samu de ponta negra" }
        ];

        configuracaoAbas.forEach(aba => {
            const dadosUnidade = itens.filter(i =>
                i.status === 'Ativo' &&
                i.unidade?.toLowerCase().includes(aba.busca)
            ).map(i => ({
                Patrimonio: i.patrimonio,
                Equipamento: i.nome,
                Setor: i.setor,
                Estado: i.estado,
                Quantidade: i.quantidade,
                Observacoes: i.observacoes || ""
            }));

            if (dadosUnidade.length > 0) {
                const ws = XLSX.utils.json_to_sheet(dadosUnidade);
                XLSX.utils.book_append_sheet(wb, ws, aba.label);
            }
        });

        const baixados = itens.filter(i => i.status === 'Baixado').map(i => ({
            Patrimonio: i.patrimonio,
            Equipamento: i.nome,
            Unidade: i.unidade,
            Setor: i.setor,
            Status: "Inutilizado",
            "Data da Baixa": formatarData(i.dataBaixa)
        }));

        if (baixados.length > 0) {
            const wsBaixados = XLSX.utils.json_to_sheet(baixados);
            XLSX.utils.book_append_sheet(wb, wsBaixados, "ITENS INUTILIZADOS");
        }

        XLSX.writeFile(wb, `INVENTARIO_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);

        // 2. TRANSMISSÃO PARA GOOGLE SHEETS (Sincronização Automática)
        try {
            const dadosParaEnviar = itens.map(i => {
                // Converte Timestamp do Firebase para Milissegundos para o Apps Script
                let dataUnix = null;
                if (i.dataBaixa) {
                    dataUnix = i.dataBaixa.seconds ? i.dataBaixa.seconds * 1000 : i.dataBaixa;
                }

                return {
                    patrimonio: i.patrimonio,
                    nome: i.nome,
                    unidade: i.unidade || "",
                    setor: i.setor || "",
                    estado: i.estado || "Bom",
                    quantidade: i.quantidade || 1,
                    status: i.status,
                    observacoes: i.observacoes || "",
                    dataBaixa: dataUnix // Enviando a data real do banco
                };
            });

            fetch(WEBAPP_URL_SHEETS, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosParaEnviar)
            }).then(() => {
                toast.success("Planilha Google atualizada com sucesso!");
            }).catch(err => {
                console.error("Erro Fetch:", err);
                toast.error("Erro na comunicação com Google.");
            });

        } catch (error) {
            console.error("Erro geral na sincronização:", error);
        }
    };

    if (loading) return <div className="loading">Carregando permissões...</div>;
    if (!isAdmin) return null;

    return (
        <div className="admin-painel-layout">
            <header className="cadastro-equip-header">
                <div className="header-title-container">
                    <h1><FiShield /> Painel Administrativo</h1>
                    <Link to="/" className="back-link-admin"><FiLogOut /> Sair</Link>
                </div>

                <div className="filters-grid">
                    <div className="filter-group">
                        <label>UNIDADE</label>
                        <select value={unidadeFiltro} onChange={(e) => setUnidadeFiltro(e.target.value)}>
                            <option value="Todas">🌍 Todas as Unidades</option>
                            <option value="Hospital conde">Hospital Conde</option>
                            <option value="upa de Santa rita">UPA de Santa Rita</option>
                            <option value="upa de inoã">UPA de Inoã</option>
                            <option value="samu barroco">SAMU Barroco</option>
                            <option value="samu de ponta negra">SAMU Ponta Negra</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>STATUS</label>
                        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                            <option value="Ativo">Apenas Ativos</option>
                            <option value="Baixado">Apenas Inutilizados</option>
                            <option value="Todos">Todos</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>BUSCAR PATRIMÔNIO</label>
                        <input type="text" placeholder="Ex: 105 ou S/P" value={buscaPatrimonio} onChange={(e) => setBuscaPatrimonio(e.target.value)} />
                    </div>

                    <div className="actions-group">
                        <button type="button" className="btn-consultar" onClick={carregarDados}>
                            {buscando ? "..." : <><FiSearch /> Consultar</>}
                        </button>
                        <button type="button" className="btn-limpar" onClick={limparFiltros}>
                            <FiRefreshCw /> Limpar
                        </button>
                        <button type="button" className="btn-excel" onClick={exportarExcelCompleto}>
                            <FiCloudLightning /> Excel + Sheets
                        </button>
                    </div>
                </div>
            </header>

            <div className="tabela-container">
                <table>
                    <thead>
                        <tr>
                            <th>Patrimônio</th>
                            <th>Equipamento</th>
                            <th>Unidade / Setor</th>
                            <th>Status</th>
                            <th style={{ textAlign: 'center' }}>Ação / Registro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensParaExibirNaTela.map(item => (
                            <tr key={item.id} className="row-hover">
                                <td className="td-patrimonio">#{item.patrimonio}</td>
                                <td>{item.nome}</td>
                                <td><span className="unit-tag">{item.unidade}</span> <br /> <small>{item.setor}</small></td>
                                <td><span className={`status-badge ${item.status?.toLowerCase()}`}>{item.status === 'Baixado' ? 'Inutilizado' : item.status}</span></td>
                                <td style={{ textAlign: 'center' }}>
                                    {item.status === 'Ativo' ? (
                                        <button className="btn-dar-baixa" onClick={() => abrirModalConfirmacao(item.id, item.nome)}>
                                            Dar Baixa
                                        </button>
                                    ) : (
                                        <div className="info-inutilizado">
                                            <span className="label-inutilizado"><FiTrash2 /> INUTILIZADO EM:</span>
                                            <span className="data-inutilizado">{formatarData(item.dataBaixa)}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalBaixa.aberto && (
                <div className="modal-baixa-overlay">
                    <div className="modal-baixa-card">
                        <div className="modal-baixa-icon"><FiAlertTriangle /></div>
                        <h3>Confirmar Baixa?</h3>
                        <p>Deseja marcar o item <strong>{modalBaixa.nome}</strong> como inutilizado?</p>
                        <div className="modal-baixa-actions">
                            <button className="btn-modal-cancelar" onClick={fecharModal}><FiX /> Cancelar</button>
                            <button className="btn-modal-confirmar" onClick={confirmarBaixa}><FiCheck /> Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;