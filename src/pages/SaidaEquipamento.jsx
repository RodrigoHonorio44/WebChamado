import React, { useState } from 'react';
import { db } from '../api/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiTruck, FiSearch, FiArrowLeft, FiPackage, FiEdit3, FiX } from 'react-icons/fi';
import '../styles/SaidaEquipamento.css';

const SaidaEquipamento = () => {
    const [patrimonioBusca, setPatrimonioBusca] = useState('');
    const [nomeBusca, setNomeBusca] = useState('');
    const [itensEncontrados, setItensEncontrados] = useState([]);
    const [itemSelecionado, setItemSelecionado] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState('');

    const [dadosSaida, setDadosSaida] = useState({
        novaUnidade: '',
        novoSetor: '',
        motivo: 'Transferência',
        responsavelRecebimento: ''
    });

    const unidades = ["Hospital Conde", "Upa de Inoã", "Upa de Santa Rita", "Samu Barroco", "Samu Ponta Negra"];

    const executarBusca = async (tipo) => {
        setLoading(true);
        setItensEncontrados([]);

        try {
            const ativosRef = collection(db, "ativos");
            let lista = [];

            if (tipo === 'patrimonio') {
                const termo = patrimonioBusca.toUpperCase().trim();
                if (termo === 'S/P' || termo === 'SP') {
                    toast.info("Para itens S/P, use a busca por NOME.");
                    setLoading(false);
                    return;
                }
                const q = query(ativosRef, where("patrimonio", "==", termo), where("status", "==", "Ativo"));
                const snap = await getDocs(q);
                lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                const termoOriginal = nomeBusca.toLowerCase().trim();
                if (!termoOriginal) { toast.warn("Digite o nome."); setLoading(false); return; }
                const qGeral = query(ativosRef, where("status", "==", "Ativo"), limit(100));
                const snapGeral = await getDocs(qGeral);
                lista = snapGeral.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(item =>
                        item.nome.toLowerCase().includes(termoOriginal) ||
                        item.patrimonio.toLowerCase() === termoOriginal
                    );
            }

            if (lista.length > 0) {
                setItensEncontrados(lista);
            } else {
                toast.error("Nenhum item ativo encontrado.");
            }
        } catch (error) {
            toast.error("Erro ao buscar.");
        } finally {
            setLoading(false);
        }
    };

    const selecionarItemParaSaida = (item) => {
        setItemSelecionado(item);
        setShowModal(true);
    };

    const fecharModal = () => {
        setShowModal(false);
        setItemSelecionado(null);
        setNovoPatrimonioParaSP('');
    };

    const handleSaida = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const ativoRef = doc(db, "ativos", itemSelecionado.id);
            const patrimonioFinal = (itemSelecionado.patrimonio === 'S/P' && novoPatrimonioParaSP)
                ? novoPatrimonioParaSP.toUpperCase()
                : itemSelecionado.patrimonio;

            await updateDoc(ativoRef, {
                unidade: dadosSaida.novaUnidade,
                setor: dadosSaida.novoSetor,
                patrimonio: patrimonioFinal,
                ultimaMovimentacao: serverTimestamp()
            });

            await addDoc(collection(db, "saidaEquipamento"), {
                ativoId: itemSelecionado.id,
                patrimonio: patrimonioFinal,
                nomeEquipamento: itemSelecionado.nome,
                unidadeOrigem: itemSelecionado.unidade,
                setorOrigem: itemSelecionado.setor,
                unidadeDestino: dadosSaida.novaUnidade,
                setorDestino: dadosSaida.novoSetor,
                responsavelRecebimento: dadosSaida.responsavelRecebimento,
                motivo: dadosSaida.motivo,
                dataSaida: serverTimestamp()
            });

            toast.success("Transferência realizada com sucesso!");
            fecharModal();
            setItensEncontrados([]);
            setPatrimonioBusca('');
            setNomeBusca('');
        } catch (error) {
            toast.error("Erro ao processar transferência.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`saida-page-wrapper ${showModal ? 'modal-open' : ''}`}>
            <div className="saida-container">
                <header className="saida-header">
                    <div className="saida-header-content">
                        <h1><FiTruck /> Saída / Transferência</h1>
                        <Link to="/" className="saida-back-link"><FiArrowLeft /> Voltar ao Início</Link>
                    </div>
                </header>

                <section className="saida-search-section">
                    <div className="saida-field-group">
                        <label>Nº Patrimônio</label>
                        <div className="saida-input-wrapper">
                            <input
                                type="text"
                                placeholder="Ex: HMC-001"
                                value={patrimonioBusca}
                                onChange={(e) => setPatrimonioBusca(e.target.value)}
                            />
                            <button className="saida-btn-search" onClick={() => executarBusca('patrimonio')}>
                                <FiSearch />
                            </button>
                        </div>
                    </div>

                    <div className="saida-field-group">
                        <label>Busca por Nome ou S/P</label>
                        <div className="saida-input-wrapper">
                            <input
                                type="text"
                                placeholder="Ex: Monitor, Maca, SP..."
                                value={nomeBusca}
                                onChange={(e) => setNomeBusca(e.target.value)}
                            />
                            <button className="saida-btn-search" style={{ backgroundColor: '#4f46e5' }} onClick={() => executarBusca('nome')}>
                                <FiSearch />
                            </button>
                        </div>
                    </div>
                </section>

                <div className="saida-results-grid">
                    {itensEncontrados.map(item => (
                        <div key={item.id} className="saida-item-card" onClick={() => selecionarItemParaSaida(item)}>
                            <div className="item-main-info">
                                <FiPackage color="#2563eb" size={20} />
                                <div className="text-details">
                                    <strong>{item.nome}</strong>
                                    <span className="badge-patrimonio">{item.patrimonio}</span>
                                </div>
                            </div>
                            <div className="item-location-tag">
                                <small>Local Atual:</small>
                                <span>{item.unidade}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL DE TRANSFERÊNCIA */}
            {showModal && (
                <div className="saida-modal-overlay">
                    <div className="saida-modal-content">
                        <div className="modal-header">
                            <h3>Confirmar Saída</h3>
                            <button className="close-modal" onClick={fecharModal}><FiX /></button>
                        </div>

                        <div className="modal-item-summary">
                            <p>Equipamento: <strong>{itemSelecionado.nome}</strong></p>
                            <p>Origem: <strong>{itemSelecionado.unidade} ({itemSelecionado.setor})</strong></p>
                        </div>

                        <form onSubmit={handleSaida} className="saida-modal-form">
                            {itemSelecionado.patrimonio === 'S/P' && (
                                <div className="saida-alert-sp">
                                    <label><FiEdit3 /> Atribuir número de patrimônio?</label>
                                    <input
                                        type="text"
                                        placeholder="Digite o novo número (opcional)"
                                        value={novoPatrimonioParaSP}
                                        onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Unidade de Destino</label>
                                <select required onChange={(e) => setDadosSaida({ ...dadosSaida, novaUnidade: e.target.value })}>
                                    <option value="">Selecione o destino...</option>
                                    {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Novo Setor</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Sala 04, UTI, Financeiro..."
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Responsável pelo Recebimento</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Nome de quem recebeu"
                                    onChange={(e) => setDadosSaida({ ...dadosSaida, responsavelRecebimento: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="saida-btn-submit" disabled={loading}>
                                {loading ? 'Gravando no Banco...' : 'Finalizar Transferência'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaidaEquipamento;