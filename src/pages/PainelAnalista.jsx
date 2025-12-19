import React, { useEffect, useState } from 'react';
import { db, auth } from '../api/firebase';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/MeusChamados.css';

const PainelAnalista = () => {
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);

    const [chamadoParaFinalizar, setChamadoParaFinalizar] = useState(null);
    const [parecerTecnico, setParecerTecnico] = useState("");

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
            console.error("Erro ao buscar chamados:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarTodosChamados();
    }, []);

    const confirmarFinalizacao = async () => {
        if (!parecerTecnico.trim()) {
            alert("Por favor, descreva detalhadamente o que foi feito no chamado.");
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

            alert("Chamado concluído com sucesso!");
            setChamadoParaFinalizar(null);
            setParecerTecnico("");
            buscarTodosChamados();
        } catch (error) {
            console.error(error);
            alert("Erro ao concluir chamado.");
        }
    };

    return (
        <div className="meus-chamados-container">
            <header className="page-header">
                <h1>Fila Geral de Chamados (Analista)</h1>
                <Link to="/" className="back-link">Sair do Painel</Link>
            </header>

            {loading ? (
                <p>Carregando fila...</p>
            ) : (
                <div className="table-responsive">
                    <table className="chamados-table">
                        <thead>
                            <tr>
                                <th>OS</th>
                                <th>Solicitante</th>
                                <th>Setor</th>
                                <th>Descrição / Parecer</th> {/* ✅ Nova coluna centralizada */}
                                <th>Unidade</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id}>
                                    <td className="os-cell">{item.numeroOs || 'S/N'}</td>

                                    <td>
                                        <div className="user-info-cell">
                                            <strong>{item.nome}</strong>
                                            <small className="user-cargo-label">{item.cargo}</small>
                                        </div>
                                    </td>

                                    <td>{item.setor}</td>

                                    {/* COLUNA DESCRIÇÃO / PARECER */}
                                    <td style={{ maxWidth: '300px' }}>
                                        {item.status === 'fechado' ? (
                                            <div className="parecer-finalizado">
                                                <small><strong>Parecer Técnico:</strong></small>
                                                <p style={{ fontSize: '0.85rem', color: '#065f46', whiteSpace: 'pre-wrap' }}>
                                                    {item.feedbackAnalista}
                                                </p>
                                                <small style={{ fontSize: '0.7rem', color: '#666' }}>
                                                    Ref: {item.tecnicoResponsavel}
                                                </small>
                                            </div>
                                        ) : (
                                            <div className="descricao-aberto">
                                                <small><strong>Problema relatado:</strong></small>
                                                <p style={{ fontSize: '0.85rem', color: '#444' }}>
                                                    {item.descricao || "Sem descrição informada."}
                                                </p>
                                            </div>
                                        )}
                                    </td>

                                    <td>{item.unidade}</td>

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

                                    {/* COLUNA DE AÇÕES COM O FORMULÁRIO GRANDE */}
                                    <td className="analista-actions-cell">
                                        {item.status === 'aberto' && (
                                            <>
                                                {chamadoParaFinalizar === item.id ? (
                                                    <div className="feedback-form-container" style={{ minWidth: '400px' }}>
                                                        <h4 style={{ marginBottom: '10px' }}>Finalizar OS: {item.numeroOs}</h4>
                                                        <textarea
                                                            placeholder="Descreva aqui o parecer técnico detalhado..."
                                                            value={parecerTecnico}
                                                            onChange={(e) => setParecerTecnico(e.target.value)}
                                                            className="feedback-textarea-large"
                                                            style={{ minHeight: '250px', width: '100%' }}
                                                            autoFocus
                                                        />
                                                        <div className="feedback-buttons-group" style={{ marginTop: '10px' }}>
                                                            <button onClick={confirmarFinalizacao} className="btn-save">Salvar e Concluir</button>
                                                            <button onClick={() => setChamadoParaFinalizar(null)} className="btn-cancel">Voltar</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setChamadoParaFinalizar(item.id)}
                                                        className="btn-concluir-main"
                                                    >
                                                        Concluir
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {item.status === 'fechado' && (
                                            <span style={{ color: '#059669', fontWeight: 'bold' }}>✓ Finalizado</span>
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