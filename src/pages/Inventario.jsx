import React, { useState, useEffect } from 'react';
import { db, auth } from '../api/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { FiSearch, FiFileText, FiLogOut, FiShield, FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';
import '../styles/Inventario.css';

const Inventario = () => {
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [buscando, setBuscando] = useState(false);

    const [unidadeFiltro, setUnidadeFiltro] = useState('Todas');
    const [statusFiltro, setStatusFiltro] = useState('Ativo');
    const [buscaPatrimonio, setBuscaPatrimonio] = useState('');

    // --- ESTADO PARA O MODAL ---
    const [modalBaixa, setModalBaixa] = useState({ aberto: false, id: null, nome: '' });

    const navigate = useNavigate();

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
        try {
            const querySnapshot = await getDocs(collection(db, "ativos"));
            const todosOsDados = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const filtrados = todosOsDados.filter(item => {
                const matchUnidade = unidadeFiltro === 'Todas' ||
                    item.unidade?.toLowerCase() === unidadeFiltro.toLowerCase();
                const matchStatus = statusFiltro === 'Todos' || item.status === statusFiltro;
                return matchUnidade && matchStatus;
            });

            setItens(filtrados);
            if (filtrados.length === 0) toast.info("Nenhum item encontrado.");
        } catch (error) {
            toast.error("Erro ao carregar dados.");
        } finally {
            setBuscando(false);
        }
    };

    const itensFiltradosParaExibir = itens.filter(item => {
        const termoBusca = buscaPatrimonio.trim();
        if (termoBusca === "") return true;
        return String(item.patrimonio) === termoBusca;
    });

    // --- FUNÇÕES DO MODAL ---
    const abrirModalConfirmacao = (id, nome) => {
        setModalBaixa({ aberto: true, id, nome });
    };

    const fecharModal = () => {
        setModalBaixa({ aberto: false, id: null, nome: '' });
    };

    const confirmarBaixa = async () => {
        try {
            await updateDoc(doc(db, "ativos", modalBaixa.id), {
                status: "Baixado",
                dataBaixa: serverTimestamp()
            });
            toast.warning(`Patrimônio ${modalBaixa.nome} baixado.`);
            fecharModal();
            carregarDados();
        } catch (error) {
            toast.error("Erro ao processar baixa.");
        }
    };

    const exportarExcelCompleto = (e) => {
        if (e) e.preventDefault();
        if (itens.length === 0) return toast.error("Carregue os dados primeiro.");

        const wb = XLSX.utils.book_new();
        const unidades = ["Hospital conde", "upa de Santa rita", "upa de inoã", "samu do barroco", "samu de ponta negra"];

        unidades.forEach(unid => {
            const ativosDaUnidade = itens.filter(i => i.status === 'Ativo' && i.unidade?.toLowerCase() === unid.toLowerCase());
            if (ativosDaUnidade.length > 0) {
                const dados = ativosDaUnidade.map(i => ({ Patrimonio: i.patrimonio, Equipamento: i.nome, Setor: i.setor, Status: i.status }));
                const ws = XLSX.utils.json_to_sheet(dados);
                XLSX.utils.book_append_sheet(wb, ws, unid.toUpperCase().substring(0, 31));
            }
        });

        const baixados = itens.filter(i => i.status === 'Baixado');
        if (baixados.length > 0) {
            const dadosBaixados = baixados.map(i => ({ Patrimonio: i.patrimonio, Equipamento: i.nome, Unidade: i.unidade, Setor: i.setor, Status: i.status }));
            const wsBaixados = XLSX.utils.json_to_sheet(dadosBaixados);
            XLSX.utils.book_append_sheet(wb, wsBaixados, "ITENS BAIXADOS");
        }

        XLSX.writeFile(wb, `INVENTARIO_DETALHADO.xlsx`);
        toast.success("Excel gerado!");
    };

    if (loading) return <div className="loading">Carregando...</div>;
    if (!isAdmin) return null;

    return (
        <div className="admin-painel-layout cadastro-equip-container">
            <header className="cadastro-equip-header">
                <div className="header-title-container">
                    <h1><FiShield /> Painel Administrativo</h1>
                    <Link to="/" className="back-link-admin"><FiLogOut /> Sair do Painel</Link>
                </div>

                <div className="filters-grid">
                    <div className="filter-group">
                        <label>UNIDADE</label>
                        <select value={unidadeFiltro} onChange={(e) => setUnidadeFiltro(e.target.value)}>
                            <option value="Todas">🌍 Todas as Unidades</option>
                            <option value="Hospital conde">Hospital Conde</option>
                            <option value="upa de Santa rita">UPA de Santa Rita</option>
                            <option value="upa de inoã">UPA de Inoã</option>
                            <option value="samu do barroco">SAMU do Barroco</option>
                            <option value="samu de ponta negra">SAMU de Ponta Negra</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>STATUS</label>
                        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
                            <option value="Ativo">Apenas Ativos</option>
                            <option value="Baixado">Apenas Baixados</option>
                            <option value="Todos">Todos</option>
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>BUSCAR PATRIMÔNIO</label>
                        <input
                            type="text"
                            placeholder="Ex: 12345"
                            value={buscaPatrimonio}
                            onChange={(e) => setBuscaPatrimonio(e.target.value)}
                        />
                    </div>

                    <div className="actions-group">
                        <button type="button" className="btn-consultar" onClick={carregarDados}>
                            {buscando ? "..." : <><FiSearch /> Consultar</>}
                        </button>
                        <button type="button" className="btn-excel" onClick={exportarExcelCompleto}>
                            <FiFileText /> Gerar Excel
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
                            <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensFiltradosParaExibir.map(item => (
                            <tr key={item.id} className="row-hover">
                                <td className="td-patrimonio">#{item.patrimonio}</td>
                                <td>{item.nome}</td>
                                <td><span className="unit-tag">{item.unidade}</span> <br /> <small>{item.setor}</small></td>
                                <td>
                                    <span className={`status-badge ${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    {item.status === 'Ativo' && (
                                        <button
                                            type="button"
                                            className="btn-dar-baixa"
                                            onClick={() => abrirModalConfirmacao(item.id, item.nome)}
                                        >
                                            Dar Baixa
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL DE BAIXA --- */}
            {modalBaixa.aberto && (
                <div className="modal-baixa-overlay">
                    <div className="modal-baixa-card">
                        <div className="modal-baixa-icon">
                            <FiAlertTriangle />
                        </div>
                        <h3>Confirmar Baixa?</h3>
                        <p>Você está prestes a remover o item <strong>{modalBaixa.nome}</strong> do inventário ativo.</p>
                        <div className="modal-baixa-actions">
                            <button className="btn-modal-cancelar" onClick={fecharModal}>
                                <FiX /> Cancelar
                            </button>
                            <button className="btn-modal-confirmar" onClick={confirmarBaixa}>
                                <FiCheck /> Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventario;