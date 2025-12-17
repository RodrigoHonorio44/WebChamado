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
            // Verifica se o usuário está logado
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                // 1. Consulta apenas pelo userId (Sem orderBy para evitar erro de índice)
                const q = query(
                    collection(db, "chamados"),
                    where("userId", "==", user.uid)
                );

                const querySnapshot = await getDocs(q);
                const listaChamados = [];

                querySnapshot.forEach((doc) => {
                    listaChamados.push({ id: doc.id, ...doc.data() });
                });

                // 2. Ordenação manual via JavaScript (Mais Recentes Primeiro)
                // Isso resolve o problema de a lista aparecer vazia por falta de índice
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
                    <p>Nenhum chamado encontrado para seu usuário.</p>
                    <Link to="/abrir-chamado" className="btn-abrir">Abrir Novo Chamado</Link>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="chamados-table">
                        <thead>
                            <tr>
                                <th>Protocolo</th>
                                <th>Descrição</th>
                                <th>Setor</th>
                                <th>Status</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {chamados.map((item) => (
                                <tr key={item.id}>
                                    <td className="protocolo-cell">#{item.id.slice(0, 5).toUpperCase()}</td>
                                    <td>{item.descricao || "Sem descrição"}</td>
                                    <td>{item.setor}</td>
                                    <td>
                                        <span className={`status-badge ${item.status?.toLowerCase() || 'pendente'}`}>
                                            {item.status || 'Pendente'}
                                        </span>
                                    </td>
                                    <td>
                                        {item.criadoEm
                                            ? item.criadoEm.toDate().toLocaleDateString('pt-BR')
                                            : '--/--/----'}
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