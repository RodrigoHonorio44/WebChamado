import React, { useEffect, useState } from 'react';
import { db } from '../api/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/Admin.css';

const DashboardAdm = () => {
    const [stats, setStats] = useState({ aberto: 0, fechado: 0, total: 0 });

    useEffect(() => {
        const pegarDados = async () => {
            const querySnapshot = await getDocs(collection(db, "chamados"));
            let aberto = 0;
            let fechado = 0;

            querySnapshot.forEach((doc) => {
                const status = doc.data().status;
                if (status === 'aberto') aberto++;
                if (status === 'fechado') fechado++;
            });

            setStats({ aberto, fechado, total: querySnapshot.size });
        };
        pegarDados();
    }, []);

    return (
        <div className="dashboard-container">
            <h1>Dashboard Administrativo</h1>
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
        </div>
    );
};

export default DashboardAdm;