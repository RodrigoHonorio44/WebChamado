import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import '../styles/CadastroEquipamento.css'; // Reutilizando o estilo

const SaidaEquipamento = () => {
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [itemEncontrado, setItemEncontrado] = useState(null);
    const [loading, setLoading] = useState(false);

    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        motivo: 'Transferência',
        responsavelRecebimento: ''
    });

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    // Função para buscar o equipamento antes de dar saída
    const buscarEquipamento = async () => {
        if (!patrimonioBusca) return;
        setLoading(true);
        const q = query(collection(db, "ativos"), where("patrimonio", "==", patrimonioBusca));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const docData = querySnapshot.docs[0].data();
            setItemEncontrado({ id: querySnapshot.docs[0].id, ...docData });
        } else {
            alert("Patrimônio não encontrado!");
            setItemEncontrado(null);
        }
        setLoading(false);
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Atualiza o local atual do equipamento no Inventário
            const ativoRef = doc(db, "ativos", itemEncontrado.id);
            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                ultimaMovimentacao: serverTimestamp()
            });

            // 2. Registra o histórico da saída em uma nova coleção
            await addDoc(collection(db, "movimentacoes"), {
                patrimonio: itemEncontrado.patrimonio,
                nome: itemEncontrado.nome,
                origemUnidade: itemEncontrado.unidade,
                destinoUnidade: dadosSaida.novaUnidade,
                motivo: dadosSaida.motivo,
                quemRecebeu: dadosSaida.responsavelRecebimento,
                dataSaida: serverTimestamp()
            });

            alert("Saída/Transferência registrada com sucesso!");
            setItemEncontrado(null);
            setPatrimonioBusca('');
        } catch (error) {
            console.error(error);
            alert("Erro ao registrar saída.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="cadastro-equip-container">
            <header className="cadastro-equip-header">
                <h1>📤 Saída / Transferência de Patrimônio</h1>
                <Link to="/" className="back-link">Voltar</Link>
            </header>

            {/* BUSCA */}
            <div className="form-group" style={{ marginBottom: '20px', flexDirection: 'row', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Digite o Nº do Patrimônio"
                    value={patrimonioBusca}
                    onChange={(e) => setPatrimonioBusca(e.target.value)}
                />
                <button onClick={buscarEquipamento} className="btn-registrar-patrimonio" style={{ marginTop: 0, padding: '10px 20px' }}>
                    Buscar
                </button>
            </div>

            {itemEncontrado && (
                <form onSubmit={handleSaida} className="equip-form">
                    <div className="info-box" style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p><strong>Item:</strong> {itemEncontrado.nome}</p>
                        <p><strong>Local Atual:</strong> {itemEncontrado.unidade} - {itemEncontrado.setor}</p>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Unidade de Destino:</label>
                            <select
                                required
                                onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}
                            >
                                <option value="">Selecione o Destino...</option>
                                {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Novo Setor:</label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Farmácia"
                                onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Responsável pelo Recebimento:</label>
                        <input
                            type="text"
                            required
                            placeholder="Nome de quem está recebendo"
                            onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn-registrar-patrimonio" disabled={loading} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' }}>
                        {loading ? 'Processando...' : 'Confirmar Saída'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default SaidaEquipamento;