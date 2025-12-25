import React, { useState, useEffect } from 'react';
import { db, auth } from '../api/firebase';
import { collection, getDocs, doc, updateDoc, query, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowLeft, FiShield, FiUser, FiUserPlus, FiCheck, FiX, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import '../styles/Admin.css';

const AdminUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Estados para Modais
    const [mostrarModalCadastro, setMostrarModalCadastro] = useState(false);
    const [mostrarModalExcluir, setMostrarModalExcluir] = useState(false);
    const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

    // Estados para Novo Analista
    const [novoNome, setNovoNome] = useState('');
    const [novoEmail, setNovoEmail] = useState('');
    const [novaSenha, setNovaSenha] = useState('');

    const requisitos = {
        nome: novoNome.trim().includes(" ") && novoNome.trim().split(" ").length >= 2,
        minimo: novaSenha.length >= 6,
        maiuscula: /[A-Z]/.test(novaSenha),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(novaSenha)
    };

    const podeCadastrar = Object.values(requisitos).every(Boolean) && novoEmail.includes("@");

    const buscarUsuarios = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "usuarios"), orderBy("name", "asc"));
            const querySnapshot = await getDocs(q);
            const lista = [];
            querySnapshot.forEach((doc) => {
                lista.push({ id: doc.id, ...doc.data() });
            });
            setUsuarios(lista);
        } catch (error) {
            toast.error("Erro ao buscar usuários");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        buscarUsuarios();
    }, []);

    // ✅ FUNÇÃO QUE EXECUTA A EXCLUSÃO REAL
    const confirmarExclusao = async () => {
        if (!usuarioParaExcluir) return;

        try {
            await deleteDoc(doc(db, "usuarios", usuarioParaExcluir.id));
            toast.success(`Acesso de ${usuarioParaExcluir.name} removido!`);
            setMostrarModalExcluir(false);
            setUsuarioParaExcluir(null);
            buscarUsuarios();
        } catch (error) {
            toast.error("Erro ao remover usuário");
        }
    };

    // Abre o modal de exclusão
    const handleAbrirExclusao = (user) => {
        setUsuarioParaExcluir(user);
        setMostrarModalExcluir(true);
    };

    // ... (suas outras funções de criar analista e alterar cargo permanecem iguais)
    const handleCriarAnalista = async (e) => {
        e.preventDefault();
        if (!podeCadastrar) return;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, novoEmail, novaSenha);
            const user = userCredential.user;
            await setDoc(doc(db, "usuarios", user.uid), {
                name: novoNome, email: novoEmail, role: 'analista', createdAt: new Date()
            });
            toast.success("Analista cadastrado!");
            setMostrarModalCadastro(false);
            limparCampos();
            buscarUsuarios();
        } catch (error) { toast.error("Erro ao cadastrar"); }
    };

    const alterarCargo = async (userId, novoCargo) => {
        try {
            await updateDoc(doc(db, "usuarios", userId), { role: novoCargo });
            toast.success("Cargo atualizado!");
            buscarUsuarios();
        } catch (error) { toast.error("Erro"); }
    };

    const limparCampos = () => { setNovoNome(''); setNovoEmail(''); setNovaSenha(''); };

    const usuariosFiltrados = usuarios.filter(u =>
        u.email?.toLowerCase().includes(busca.toLowerCase()) ||
        u.name?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="admin-container">
            <header className="page-header">
                <div className="header-navigation">
                    <Link to="/" className="btn-back-modern"><FiArrowLeft /> Voltar</Link>
                    <h1>Permissões do Sistema</h1>
                </div>
                <button onClick={() => setMostrarModalCadastro(true)} className="btn-abrir">
                    <FiUserPlus /> Novo Analista
                </button>
            </header>

            {/* ✅ MODAL DE CADASTRO */}
            {mostrarModalCadastro && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Novo Analista</h2>
                        <form onSubmit={handleCriarAnalista} className="admin-form">
                            <div className="input-group">
                                <label>Nome Completo</label>
                                <input type="text" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="form-input" required />
                            </div>
                            <div className="input-group">
                                <label>E-mail</label>
                                <input type="email" value={novoEmail} onChange={(e) => setNovoEmail(e.target.value)} className="form-input" required />
                            </div>
                            <div className="input-group">
                                <label>Senha</label>
                                <input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} className="form-input" required />
                            </div>

                            <ul className="password-checker-modern">
                                <li className={requisitos.nome ? 'met' : ''}>{requisitos.nome ? <FiCheck /> : <FiX />} Nome e Sobrenome</li>
                                <li className={requisitos.minimo ? 'met' : ''}>{requisitos.minimo ? <FiCheck /> : <FiX />} Mínimo 6 dígitos</li>
                                <li className={requisitos.maiuscula ? 'met' : ''}>{requisitos.maiuscula ? <FiCheck /> : <FiX />} 1 Letra Maiúscula</li>
                            </ul>

                            <div className="modal-actions-row">
                                <button type="button" onClick={() => setMostrarModalCadastro(false)} className="btn-cancelar">Sair</button>
                                <button type="submit" disabled={!podeCadastrar} className="btn-salvar-modern">Cadastrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ✅ NOVO MODAL DE EXCLUSÃO (SUBSTITUI O POP-UP DO NAVEGADOR) */}
            {mostrarModalExcluir && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ textAlign: 'center', borderTop: '6px solid #dc2626' }}>
                        <FiAlertTriangle style={{ fontSize: '3rem', color: '#dc2626', marginBottom: '15px' }} />
                        <h2 style={{ marginBottom: '10px' }}>Confirmar Exclusão</h2>
                        <p style={{ color: '#64748b', marginBottom: '25px' }}>
                            Deseja realmente remover o acesso de <br />
                            <strong>{usuarioParaExcluir?.name}</strong>? <br />
                            <small>(Esta ação não pode ser desfeita no banco de dados)</small>
                        </p>

                        <div className="modal-actions-row">
                            <button type="button" onClick={() => setMostrarModalExcluir(false)} className="btn-cancelar">Cancelar</button>
                            <button
                                type="button"
                                onClick={confirmarExclusao}
                                className="btn-salvar-modern"
                                style={{ background: '#dc2626' }}
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* BARRA DE BUSCA E TABELA */}
            <div className="search-bar">
                <input type="text" placeholder="Buscar usuário..." value={busca} onChange={(e) => setBusca(e.target.value)} className="form-input-modern" />
            </div>

            <div className="table-wrapper">
                <table className="modern-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>E-mail</th>
                            <th>Acesso</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map((user) => (
                            <tr key={user.id}>
                                <td><strong>{user.name}</strong></td>
                                <td>{user.email}</td>
                                <td><span className={`badge-role ${user.role || 'user'}`}>{user.role || 'user'}</span></td>
                                <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    {user.role !== 'adm' && (
                                        <>
                                            <button onClick={() => alterarCargo(user.id, user.role === 'analista' ? 'user' : 'analista')} className={user.role === 'analista' ? 'btn-action-remove' : 'btn-action-add'}>
                                                {user.role === 'analista' ? 'Remover Analista' : 'Tornar Analista'}
                                            </button>
                                            <button onClick={() => handleAbrirExclusao(user)} className="btn-action-delete">
                                                <FiTrash2 />
                                            </button>
                                        </>
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

export default AdminUsuarios;