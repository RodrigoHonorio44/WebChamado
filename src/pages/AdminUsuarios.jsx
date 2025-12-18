import React, { useState, useEffect } from 'react';
import { db } from '../api/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/Admin.css';

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    const buscarUsuarios = async () => {
        setLoading(true);
        try {
            // Busca todos os usuários cadastrados
            const q = query(collection(db, "usuarios"), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            const lista = [];
            querySnapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            setUsuarios(lista);
        } catch (error) {
            console.error("Erro ao buscar usuários:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarUsuarios();
    }, []);

    const alterarCargo = async (userId, novoCargo) => {
        const confirmacao = window.confirm(`Deseja alterar o cargo para ${novoCargo}?`);
        if (!confirmacao) return;

        try {
            const userRef = doc(db, "usuarios", userId);
            await updateDoc(userRef, { role: novoCargo });
            alert("Cargo atualizado com sucesso!");
            buscarUsuarios(); // Recarrega a lista
        } catch (error) {
            alert("Erro ao atualizar cargo: " + error.message);
        }
    };

    const usuariosFiltrados = usuarios.filter(u =>
        u.email?.toLowerCase().includes(busca.toLowerCase()) ||
        u.name?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="admin-container">
            <header className="page-header">
                <h1>Gerenciar Permissões</h1>
                <Link to="/" className="back-link">Voltar</Link>
            </header>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Buscar por nome ou e-mail..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="form-input"
                />
            </div>

            {loading ? (
                <p>Carregando usuários...</p>
            ) : (
                <div className="table-responsive">
                    <table className="chamados-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Cargo Atual</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map((user) => (
                                <tr key={user.id}>
                                    <td><strong>{user.name}</strong></td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role || 'user'}
                                        </span>
                                    </td>
                                    <td>
                                        {user.role === 'adm' ? (
                                            <small>Administrador</small>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => alterarCargo(user.id, user.role === 'analista' ? 'user' : 'analista')}
                                                    className={user.role === 'analista' ? 'btn-remover' : 'btn-abrir'}
                                                    style={{ padding: '5px 10px', fontSize: '0.8rem' }}
                                                >
                                                    {user.role === 'analista' ? 'Remover Analista' : 'Tornar Analista'}
                                                </button>
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

export default AdminUsuarios;