import React, { useEffect, useState } from 'react';
import { db } from '../api/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Importado para navegação
import '../styles/Admin.css';

const DashboardAdm = () => {
    const [stats, setStats] = useState({
        aberto: 0,
        fechado: 0,
        total: 0,
        porUnidade: {} // Novo estado para contagem por local
    });

    useEffect(() => {
        const pegarDados = async () => {
            const querySnapshot = await getDocs(collection(db, "chamados"));
            let aberto = 0;
            let fechado = 0;
            let unidades = {}; // Objeto temporário para contar as unidades

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const status = data.status;
                const local = data.unidade || "Não Informado";

                // Contagem de Status
                if (status === 'aberto') aberto++;
                if (status === 'fechado') fechado++;

                // Contagem por Unidade (Ex: Conde, Upa)
                unidades[local] = (unidades[local] || 0) + 1;
            });

            setStats({
                aberto,
                fechado,
                total: querySnapshot.size,
                porUnidade: unidades
            });
        };
        pegarDados();
    }, []);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div>
                    <h1>Dashboard Administrativo</h1>
                    <p>Visão geral do sistema de chamados</p>
                </div>
                <Link to="/" className="btn-voltar">Voltar para Home</Link>
            </header>

            {/* Grid de Estatísticas Gerais */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total de Chamados</h3>
                    <p className="number">{stats.total}</p>
                </div>
                <div className="stat-card aberto">
                    <h3>Em Aberto</h3>
                    <p className="number">{stats.aberto}</p>
                </div>
                <div className="stat-card fechado">
                    <h3>Finalizados</h3>
                    <p className="number">{stats.fechado}</p>
                </div>
            </div>

            <hr className="divider" />

            {/* Seção de Chamados por Unidade */}
            <section className="unidades-section">
                <h2>Chamados por Unidade</h2>
                <div className="unidades-grid">
                    {Object.entries(stats.porUnidade).map(([nome, quantidade]) => (
                        <div key={nome} className="unidade-item">
                            <span className="unidade-nome">{nome}</span>
                            <span className="unidade-badge">{quantidade}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default DashboardAdm;