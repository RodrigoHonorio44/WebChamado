import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FiEye, FiX } from 'react-icons/fi'; // Ícones de Olho e Fechar
import '../styles/MeusChamados.css';

const MeusChamados = () => {
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chamadoSelecionado, setChamadoSelecionado] = useState(null); // Estado para o modal
    const [modalAberto, setModalAberto] = useState(false);
    const user = auth.currentUser;

    useEffect(() => {
        const buscarChamados = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const q = query(
                    collection(db, "chamados"),
                    where("userId", "==", user.uid)
                );

                const querySnapshot = await getDocs(q);
                const listaChamados = [];

                querySnapshot.forEach((doc) => {
                    listaChamados.push({ id: doc.id, ...doc.data() });
                });

                listaChamados.sort((a, b) => {
                    const dataA = a.criadoEm?.seconds || 0;
                    const dataB = b.criadoEm?.seconds || 0;
                    return dataB - dataA;
                });

                setChamados(listaChamados);
            } catch (error) {
                console.error("Erro ao buscar chamados:", error);
            } finally {
                setLoading(false);
            }
        };

        buscarChamados();
    }, [user]);

    // Função para abrir o modal
    const abrirModal = (chamado) => {
        setChamadoSelecionado(chamado);
        setModalAberto(true);
    };

    return (
        <div className="meus-chamados-container">
            <header className="page-header">
                <h1>Meus Chamados</h1>
                <Link to="/" className="back-link">Voltar para Início</Link>
            </header>

            {loading ? (
                <div className="loading-container">
                    <p className="loading-text">Carregando seus chamados...</p>
                </div>
            ) : chamados.length === 0 ? (
                <div className="no-data">
                    <p>Nenhum chamado encontrado.</p>
                    <Link to="/abrir-chamado" className="btn-abrir">Abrir Novo Chamado</Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="chamados-table">
                        <thead>
                            <tr>
                                <th>Nº OS</th>
                                <th>Solicitante</th>
                                <th>Unidade</th>
                                <th>Status</th>
                                <th>Data/Hora</th>
                                <th>Visualizar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id} className="linha-clicavel">
                                    <td data-label="Nº OS" className="os-cell">
                                        <strong>#{item.numeroOs || 'S/N'}</strong>
                                    </td>
                                    <td data-label="Solicitante">
                                        <div className="user-info-cell">
                                            <span className="user-name">{item.nome || 'Usuário'}</span>
                                            <span className="user-cargo-label">{item.cargo || 'Funcionário'}</span>
                                        </div>
                                    </td>
                                    <td data-label="Unidade">{item.unidade || 'N/A'}</td>
                                    <td data-label="Status">
                                        <span className={`status-badge ${item.status?.toLowerCase() || 'aberto'}`}>
                                            {item.status || 'Pendente'}
                                        </span>
                                    </td>
                                    <td data-label="Data/Hora" className="data-hora-cell">
                                        {item.criadoEm ? item.criadoEm.toDate().toLocaleDateString('pt-BR') : '--/--'}
                                    </td>
                                    <td data-label="Ação">
                                        <button className="btn-view-chamado" onClick={() => abrirModal(item)}>
                                            <FiEye />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* MODAL DE DETALHES DO CHAMADO */}
            {modalAberto && chamadoSelecionado && (
                <div className="modal-overlay" onClick={() => setModalAberto(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chamado #{chamadoSelecionado.numeroOs}</h2>
                            <button className="close-btn" onClick={() => setModalAberto(false)}>
                                <FiX />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="info-grid-user">
                                <div className="info-item"><strong>Status:</strong> {chamadoSelecionado.status}</div>
                                <div className="info-item"><strong>Prioridade:</strong> {chamadoSelecionado.prioridade}</div>
                                <div className="info-item"><strong>Técnico:</strong> {chamadoSelecionado.tecnicoResponsavel || 'Aguardando Analista'}</div>
                            </div>
                            
                            <div className="detalhe-box">
                                <h3>Descrição Original:</h3>
                                <p>{chamadoSelecionado.descricao}</p>
                            </div>

                            {chamadoSelecionado.feedbackAnalista && (
                                <div className="detalhe-box feedback">
                                    <h3>Parecer do Técnico:</h3>
                                    <p>{chamadoSelecionado.feedbackAnalista}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeusChamados;