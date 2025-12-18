import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/MeusChamados.css';

const MeusChamados = () => {
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <div className="meus-chamados-container">
            <header className="page-header">
                <h1>Meus Chamados</h1>
                <Link to="/" className="back-link">Voltar para Início</Link>
            </header>

            {loading ? (
                <p className="loading-text">Carregando seus chamados...</p>
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
                                <th>Unidade</th>
                                <th>Descrição / Parecer</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Data/Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id}>
                                    <td className="os-cell">{item.numeroOs || 'S/N'}</td>
                                    <td>{item.unidade}</td>
                                    <td className="desc-cell">
                                        <div className="original-desc">{item.descricao}</div>

                                        {/* ✅ EXIBIÇÃO DO FEEDBACK DO ANALISTA */}
                                        {item.status === 'fechado' && item.feedbackAnalista && (
                                            <div className="analista-feedback-box">
                                                <strong>Parecer Técnico:</strong>
                                                <p>{item.feedbackAnalista}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`prioridade-tag ${item.prioridade?.toLowerCase()}`}>
                                            {item.prioridade}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${item.status?.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="data-hora-cell">
                                        {item.criadoEm ? (
                                            <>
                                                <div>{item.criadoEm.toDate().toLocaleDateString('pt-BR')}</div>
                                                <div className="hora-text">
                                                    {item.criadoEm.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </>
                                        ) : '--/--'}
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

export default MeusChamados;