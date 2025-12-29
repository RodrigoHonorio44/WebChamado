import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../api/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import '../styles/ImprimirOS.css';

const ImprimirOS = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const carregarDados = async () => {
            try {
                const docRef = doc(db, "chamados", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setDados(docSnap.data());
                } else {
                    toast.error("OS não encontrada!");
                    navigate('/painel-analista');
                }
            } catch (error) {
                toast.error("Erro ao carregar dados da OS.");
            } finally {
                setLoading(false);
            }
        };

        carregarDados();
    }, [id, navigate]);

    if (loading) return <div className="loading">Carregando dados para impressão...</div>;

    return (
        <div className="impressao-container">
            <div className="btn-print-actions" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Confirmar Impressão
                </button>
                <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                    Voltar
                </button>
            </div>

            <header className="impressao-header">
                <div>
                    <h2>ORDEM DE SERVIÇO</h2>
                    <p>Nº OS: <strong>#{dados?.numeroOs}</strong></p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p>Data: {dados?.criadoEm?.toDate().toLocaleDateString('pt-BR')}</p>
                    <p>Status: {dados?.status?.toUpperCase()}</p>
                </div>
            </header>

            <div className="impressao-corpo">
                <section>
                    <h3>Informações do Solicitante</h3>
                    <div className="info-grid">
                        <div className="campo"><label>Nome:</label> <span>{dados?.nome}</span></div>
                        <div className="campo"><label>Unidade:</label> <span>{dados?.unidade}</span></div>
                        <div className="campo"><label>Setor/Departamento:</label> <span>{dados?.setor || 'Não informado'}</span></div>
                        <div className="campo"><label>Patrimônio:</label> <span>{dados?.patrimonio || '---'}</span></div>
                    </div>
                </section>

                <section>
                    <h3>Descrição do Problema</h3>
                    <div className="descricao-box">
                        {dados?.descricao}
                    </div>
                </section>

                <section>
                    <h3>Parecer Técnico / Resolução</h3>
                    <div className="descricao-box">
                        {dados?.feedbackAnalista || "Aguardando conclusão do serviço."}
                    </div>
                </section>

                <div className="assinaturas">
                    <div className="assinatura-box">
                        <div className="assinatura-linha"></div>
                        <p>Assinatura do Técnico</p>
                        <small>{dados?.tecnicoResponsavel || "____________________"}</small>
                    </div>
                    <div className="assinatura-box">
                        <div className="assinatura-linha"></div>
                        <p>Assinatura do Solicitante</p>
                        <small>{dados?.nome}</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImprimirOS;