import React, { useEffect, useState } from 'react';
import { db } from '../api/firebase';
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
            alert("Por favor, descreva o que foi feito no chamado.");
            return;
        }

        try {
            const chamadoRef = doc(db, "chamados", chamadoParaFinalizar);
            await updateDoc(chamadoRef, {
                status: 'fechado',
                feedbackAnalista: parecerTecnico,
                finalizadoEm: serverTimestamp()
            });

            alert("Chamado concluído com sucesso!");
            setChamadoParaFinalizar(null);
            setParecerTecnico("");
            buscarTodosChamados();
        } catch (error) {
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
                                    <td>{item.nome} <br /> <small>{item.setor}</small></td>
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
                                    <td>
                                        {item.status === 'aberto' && (
                                            <div className="analista-actions-cell">
                                                {chamadoParaFinalizar === item.id ? (
                                                    <div className="feedback-form-container">
                                                        <textarea
                                                            placeholder="Descreva detalhadamente o que foi feito para solucionar o problema..."
                                                            value={parecerTecnico}
                                                            onChange={(e) => setParecerTecnico(e.target.value)}
                                                            className="feedback-textarea-large"
                                                        />
                                                        <div className="feedback-buttons-group">
                                                            <button onClick={confirmarFinalizacao} className="btn-save">Finalizar Chamado</button>
                                                            <button onClick={() => setChamadoParaFinalizar(null)} className="btn-cancel">Cancelar</button>
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
                                            </div>
                                        )}
                                        {item.status === 'fechado' && (
                                            <div className="feedback-view">
                                                <strong>Resolvido:</strong>
                                                <p>{item.feedbackAnalista}</p>
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