import React, { useState, useEffect } from 'react';
import { db, auth } from '../api/firebase'; // Certifique-se de que o auth está exportado no seu firebase.js
import { collection, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import '../styles/CadastroEquipamento.css';

const Inventario = () => {
    const [itens, setItens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();

    // 1. VERIFICAÇÃO DE PERMISSÃO (SÓ ADM VÊ)
    useEffect(() => {
        const verificarPermissao = async () => {
            const user = auth.currentUser;

            if (!user) {
                toast.error("Acesso negado. Faça login.");
                navigate('/');
                return;
            }

            try {
                // Busca o documento do usuário na coleção 'usuarios'
                const userDoc = await getDoc(doc(db, "usuarios", user.uid));

                if (userDoc.exists() && userDoc.data().role === 'adm') {
                    setIsAdmin(true);
                    carregarDados();
                } else {
                    toast.error("Acesso restrito apenas para Administradores!");
                    navigate('/'); // Expulsa o usuário comum para a Home
                }
            } catch (error) {
                console.error("Erro ao verificar permissão:", error);
                navigate('/');
            } finally {
                setLoading(false);
            }
        };

        verificarPermissao();
    }, [navigate]);

    // 2. BUSCAR DADOS
    const carregarDados = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "ativos"));
            const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setItens(lista);
        } catch (error) {
            toast.error("Erro ao carregar dados do inventário.");
        }
    };

    // 3. FUNÇÃO DE BAIXA
    const confirmarBaixa = async (id, nome) => {
        if (window.confirm(`CONFIRMAR BAIXA: O item "${nome}" será movido para a aba de descarte/baixa. Confirmar?`)) {
            try {
                const itemRef = doc(db, "ativos", id);
                await updateDoc(itemRef, {
                    status: "Baixado",
                    dataBaixa: serverTimestamp()
                });
                toast.warning("Patrimônio baixado com sucesso.");
                carregarDados();
            } catch (error) {
                toast.error("Erro ao processar baixa.");
            }
        }
    };

    // 4. EXPORTAÇÃO EXCEL
    const exportarExcelCompleto = async () => {
        toast.info("Preparando planilha...");
        try {
            const ativosSnap = await getDocs(collection(db, "ativos"));
            const todos = ativosSnap.docs.map(d => ({
                Patrimonio: d.data().patrimonio,
                Equipamento: d.data().nome,
                Unidade: d.data().unidade,
                Setor: d.data().setor,
                Status: d.data().status
            }));

            const listaAtivos = todos.filter(i => i.Status === "Ativo");
            const listaBaixados = todos.filter(i => i.Status === "Baixado");

            const estoqueSnap = await getDocs(collection(db, "estoque"));
            const listaEstoque = estoqueSnap.docs.map(d => ({
                Item: d.data().nome,
                Quantidade: d.data().quantidade,
                Minimo: d.data().estoqueMinimo,
                Unidade: d.data().unidade
            }));

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(listaAtivos), "Itens Ativos");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(listaBaixados), "Baixa de Patrimônio");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(listaEstoque), "Estoque");

            XLSX.writeFile(wb, `RELATORIO_GERAL_${new Date().getFullYear()}.xlsx`);
        } catch (e) {
            toast.error("Erro na exportação.");
        }
    };

    if (loading) return <div className="loading">Verificando credenciais...</div>;
    if (!isAdmin) return null;

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>🔐 Painel Administrativo: Inventário</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={exportarExcelCompleto} style={{ backgroundColor: '#059669', color: 'white', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                        📊 Gerar Planilha Geral
                    </button>
                    <Link to="/" className="back-link">Sair</Link>
                </div>
            </header>

            <div className="tabela-container" style={{ overflowX: 'auto', background: 'white', borderRadius: '12px', padding: '20px' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                            <th style={{ padding: '15px' }}>Patrimônio</th>
                            <th>Equipamento</th>
                            <th>Localização</th>
                            <th>Status</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itens.map(item => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '15px' }}><strong>{item.patrimonio}</strong></td>
                                <td>{item.nome}</td>
                                <td>{item.unidade} - {item.setor}</td>
                                <td>
                                    <span style={{
                                        color: item.status === 'Ativo' ? '#10b981' : '#ef4444',
                                        fontWeight: 'bold'
                                    }}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>
                                    {item.status === 'Ativo' && (
                                        <button onClick={() => confirmarBaixa(item.id, item.nome)} style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}>
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