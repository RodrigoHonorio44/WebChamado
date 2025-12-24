import React, { useState, useEffect } from 'react';
import { db, auth } from '../api/firebase';
import { collection, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import '../styles/CadastroEquipamento.css';

const Inventario = () => {
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [buscando, setBuscando] = useState(false);

    const [unidadeFiltro, setUnidadeFiltro] = useState('Todas');
    const [statusFiltro, setStatusFiltro] = useState('Ativo');
    const [buscaPatrimonio, setBuscaPatrimonio] = useState('');

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

    const confirmarBaixa = async (id, nome) => {
        if (window.confirm(`CONFIRMAR BAIXA: ${nome}?`)) {
            try {
                await updateDoc(doc(db, "ativos", id), {
                    status: "Baixado",
                    dataBaixa: serverTimestamp()
                });
                toast.warning("Patrimônio baixado.");
                carregarDados();
            } catch (error) {
                toast.error("Erro ao processar.");
            }
        }
    };

    const exportarExcelCompleto = (e) => {
        if (e) e.preventDefault();
        if (itensFiltradosParaExibir.length === 0) return toast.error("Sem dados.");
        const wb = XLSX.utils.book_new();
        const dados = itensFiltradosParaExibir.map(i => ({
            Patrimonio: i.patrimonio,
            Equipamento: i.nome,
            Unidade: i.unidade,
            Setor: i.setor,
            Status: i.status
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados), "Relatorio");
        XLSX.writeFile(wb, `RELATORIO_${unidadeFiltro}.xlsx`);
    };

    if (loading) return <div className="loading">Carregando...</div>;
    if (!isAdmin) return null;

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>🔐 Painel Administrativo</h1>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', color: 'white' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>UNIDADE</label>
                        <select value={unidadeFiltro} onChange={(e) => setUnidadeFiltro(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: 'none', minWidth: '160px' }}>
                            <option value="Todas">🌍 Todas as Unidades</option>
                            <option value="Hospital conde">Hospital Conde</option>
                            <option value="upa de Santa rita">UPA de Santa Rita</option>
                            <option value="upa de inoã">UPA de Inoã</option>
                            <option value="samu do barroco">SAMU do Barroco</option>
                            <option value="samu de ponta negra">SAMU de Ponta Negra</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', color: 'white' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>STATUS</label>
                        <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: 'none' }}>
                            <option value="Ativo">Apenas Ativos</option>
                            <option value="Baixado">Apenas Baixados</option>
                            <option value="Todos">Todos</option>
                        </select>
                    </div>

                    <button type="button" onClick={carregarDados} style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                        {buscando ? "..." : "🔍 Consultar"}
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', color: 'white' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold' }}>BUSCAR</label>
                        <input
                            type="text"
                            placeholder="Nº Patrimônio"
                            value={buscaPatrimonio}
                            onChange={(e) => setBuscaPatrimonio(e.target.value)}
                            style={{ padding: '8px', borderRadius: '6px', border: 'none', width: '130px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" onClick={exportarExcelCompleto} style={{ backgroundColor: '#059669', color: 'white', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>📊 Excel</button>
                        <Link to="/" className="back-link">Sair</Link>
                    </div>
                </div>
            </header>

            <div className="tabela-container" style={{ background: 'white', borderRadius: '12px', padding: '20px', marginTop: '20px', overflowX: 'auto' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '15px' }}>Patrimônio</th>
                            <th style={{ padding: '15px' }}>Equipamento</th>
                            <th style={{ padding: '15px' }}>Unidade/Setor</th>
                            <th style={{ padding: '15px' }}>Status</th>
                            <th style={{ padding: '15px', textAlign: 'center' }}>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itensFiltradosParaExibir.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '15px' }}><strong>{item.patrimonio}</strong></td>
                                <td style={{ padding: '15px' }}>{item.nome}</td>
                                <td style={{ padding: '15px' }}>{item.unidade} - {item.setor}</td>
                                <td style={{ padding: '15px' }}>
                                    <span style={{
                                        fontWeight: 'bold',
                                        color: item.status === 'Ativo' ? '#2563eb' : '#dc2626' // AZUL para ativo, VERMELHO para baixado
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    {item.status === 'Ativo' && (
                                        <button
                                            type="button"
                                            onClick={() => confirmarBaixa(item.id, item.nome)}
                                            style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
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
        </div>
    );
};

export default Inventario;