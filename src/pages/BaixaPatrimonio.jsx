// src/pages/BaixaPatrimonio.jsx
import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, addDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/CadastroEquipamento.css'; // Reutilizando o estilo padrão

const BaixaPatrimonio = () => {
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [itemEncontrado, setItemEncontrado] = useState(null);
    const [loading, setLoading] = useState(false);

    const [dadosBaixa, setDadosBaixa] = useState({
        motivo: 'Sucata/Danificado',
        observacao: '',
        autorizadoPor: ''
    });

    const buscarEquipamento = async () => {
        if (!patrimonioBusca) return;
        setLoading(true);
        try {
            const q = query(collection(db, "ativos"), where("patrimonio", "==", patrimonioBusca), where("status", "==", "Ativo"));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docData = querySnapshot.docs[0].data();
                setItemEncontrado({ id: querySnapshot.docs[0].id, ...docData });
            } else {
                alert("Património não encontrado ou já baixado!");
                setItemEncontrado(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleBaixa = async (e) => {
        e.preventDefault();
        if (!window.confirm("Tem certeza que deseja dar BAIXA definitiva neste património?")) return;

        setLoading(true);
        try {
            // 1. Atualiza o item para status 'Baixado'
            const ativoRef = doc(db, "ativos", itemEncontrado.id);
            await updateDoc(ativoRef, {
                status: 'Baixado',
                dataBaixa: serverTimestamp(),
                motivoBaixa: dadosBaixa.motivo
            });

            // 2. Regista no histórico de baixas
            await addDoc(collection(db, "historico_baixas"), {
                patrimonio: itemEncontrado.patrimonio,
                nome: itemEncontrado.nome,
                unidadeAnterior: itemEncontrado.unidade,
                motivo: dadosBaixa.motivo,
                observacao: dadosBaixa.observacao,
                autorizadoPor: dadosBaixa.autorizadoPor,
                dataMovimentacao: serverTimestamp()
            });

            alert("Baixa realizada com sucesso!");
            setItemEncontrado(null);
            setPatrimonioBusca('');
        } catch (error) {
            alert("Erro ao processar baixa.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>⚠️ Baixa de Património</h1>
                <Link to="/" className="back-link">Voltar</Link>
            </header>

            <div className="form-group" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Nº do Património para BAIXA"
                    value={patrimonioBusca}
                    onChange={(e) => setPatrimonioBusca(e.target.value)}
                />
                <button onClick={buscarEquipamento} className="btn-registrar-patrimonio" style={{ marginTop: 0, padding: '10px', background: '#4a5568' }}>
                    Buscar
                </button>
            </div>

            {itemEncontrado && (
                <form onSubmit={handleBaixa} className="equip-form">
                    <div className="info-box" style={{ background: '#fff5f5', padding: '15px', borderRadius: '8px', border: '1px solid #feb2b2' }}>
                        <p><strong>Item:</strong> {itemEncontrado.nome}</p>
                        <p><strong>Local:</strong> {itemEncontrado.unidade} - {itemEncontrado.setor}</p>
                        <p style={{ color: '#c53030', fontWeight: 'bold' }}>ESTADO ATUAL: {itemEncontrado.estado}</p>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Motivo da Baixa:</label>
                            <select required onChange={(e) => setDadosBaixa({ ...dadosBaixa, motivo: e.target.value })}>
                                <option value="Sucata/Danificado">Sucata / Danificado</option>
                                <option value="Extravio/Roubo">Extravio / Roubo</option>
                                <option value="Leilão">Leilão</option>
                                <option value="Devolução">Devolução ao Fornecedor</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Autorizado por:</label>
                            <input type="text" required placeholder="Nome do Responsável" onChange={(e) => setDadosBaixa({ ...dadosBaixa, autorizadoPor: e.target.value })} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Observações da Baixa:</label>
                        <textarea placeholder="Descreva o motivo técnico da baixa..." onChange={(e) => setDadosBaixa({ ...dadosBaixa, observacao: e.target.value })} />
                    </div>

                    <button type="submit" className="btn-registrar-patrimonio" disabled={loading} style={{ background: '#2d3748' }}>
                        {loading ? 'Processando...' : 'Confirmar Baixa Definitiva'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default BaixaPatrimonio;