import React, { useEffect, useState } from 'react';
import { db } from '../api/firebase';
import { collection, query, getDocs, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/MeusChamados.css'; // Reaproveitando o CSS da tabela

const PainelAnalista = () => {
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);

    const buscarTodosChamados = async () => {
        setLoading(true);
        try {
            // O Analista vê TODOS os chamados do sistema, ordenados por data
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

    const finalizarChamado = async (id) => {
        if (!window.confirm("Deseja realmente finalizar este chamado?")) return;

        try {
            const chamadoRef = doc(db, "chamados", id);
            await updateDoc(chamadoRef, {
                status: 'fechado', // Ficará vermelho no CSS
                finalizadoEm: serverTimestamp()
            });
            alert("Chamado finalizado com sucesso!");
            buscarTodosChamados(); // Atualiza a lista
        } catch (error) {
            alert("Erro ao finalizar chamado.");
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
                                            <button
                                                onClick={() => finalizarChamado(item.id)}
                                                style={{
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '5px 10px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Finalizar
                                            </button>
                                        )}
                                        {item.status === 'fechado' && <small>Concluído</small>}
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