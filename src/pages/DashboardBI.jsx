import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiActivity, FiRefreshCw } from 'react-icons/fi';
import '../styles/DashboardBI.css';

const DashboardBI = () => {
    const [stats, setStats] = useState({ total: 0, abertos: 0, fechados: 0, baixas: 0 });
    const [dadosSetores, setDadosSetores] = useState([]);
    const [dadosEvolucao, setDadosEvolucao] = useState([]);
    const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
    const [filtroUnidade, setFiltroUnidade] = useState('TODAS');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [loading, setLoading] = useState(true);
    const [dadosBrutos, setDadosBrutos] = useState({ chamados: [], baixas: [] });

    const ID_DOC = "1L-TNSA0e-YAjzK_HU_vWGAJFZVqk6t2L3lIQeEDPcMI";
    const PROXY = "https://api.allorigins.win/raw?url=";
    const BASE_CSV = `https://docs.google.com/spreadsheets/d/${ID_DOC}/export?format=csv`;

    // Mapeamento de todas as abas que você quer incluir
    const LINKS = {
        CHAMADOS_GERAL: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=0")}`,
        HOSPITAL_CONDE: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=583741098")}`,
        UPA_SANTA_RITA: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=1257274751")}`,
        UPA_INOA: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=339251774")}`,
        BAIXADOS: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=416525153")}`
    };

    const normalizar = (texto = '') =>
        texto.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    const getVal = (obj, term) => {
        if (!obj) return "";
        const key = Object.keys(obj).find(k => k.toLowerCase().includes(term.toLowerCase()));
        return key ? String(obj[key] || "").trim() : "";
    };

    const carregarDadosSheets = async () => {
        setLoading(true);
        try {
            const respostas = await Promise.all(Object.values(LINKS).map(url => fetch(url).then(r => r.text())));

            // Processa as 4 abas de chamados e a de baixas
            const datasets = respostas.map(csv => Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' }).data);

            // Filtro para garantir que só pegamos linhas com OS real (ignora cabeçalhos extras)
            const filtrarChamadosReais = (data) => data.filter(item => {
                const os = getVal(item, 'os');
                return os && os.includes('-') && os.toLowerCase() !== 'os';
            });

            const todosChamados = [
                ...filtrarChamadosReais(datasets[0]),
                ...filtrarChamadosReais(datasets[1]),
                ...filtrarChamadosReais(datasets[2]),
                ...filtrarChamadosReais(datasets[3])
            ];

            const todasBaixas = datasets[4];

            setDadosBrutos({ chamados: todosChamados, baixas: todasBaixas });

            const unidades = ['TODAS', ...new Set(todosChamados.map(c => getVal(c, 'unidade')).filter(Boolean))];
            setUnidadesDisponiveis(unidades);

            processarDados(todosChamados, todasBaixas, 'TODAS', '', '');
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDadosSheets(); }, []);

    const processarDados = (chamados, baixados, unidadeFiltro, inicio, fim) => {
        let filtrados = [...chamados];

        if (unidadeFiltro !== 'TODAS') {
            filtrados = filtrados.filter(c => normalizar(getVal(c, 'unidade')) === normalizar(unidadeFiltro));
        }

        const filtrarPorData = (lista) => {
            return lista.filter(item => {
                const dataStr = getVal(item, 'data');
                if (!dataStr) return true;
                const d = new Date(dataStr.split('/').reverse().join('-'));
                let ok = true;
                if (inicio) ok = ok && d >= new Date(inicio);
                if (fim) ok = ok && d <= new Date(fim);
                return ok;
            });
        };

        filtrados = filtrarPorData(filtrados);
        const baixasFiltradas = filtrarPorData(baixados).filter(b =>
            unidadeFiltro === 'TODAS' || normalizar(getVal(b, 'unidade')) === normalizar(unidadeFiltro)
        );

        const fechados = filtrados.filter(c => getVal(c, 'status').toLowerCase().includes('fechado')).length;

        setStats({
            total: filtrados.length,
            abertos: filtrados.length - fechados,
            fechados,
            baixas: baixasFiltradas.length
        });

        const porUnidade = filtrados.reduce((acc, c) => {
            const u = getVal(c, 'unidade') || 'Outros';
            acc[u] = (acc[u] || 0) + 1;
            return acc;
        }, {});

        setDadosSetores(Object.keys(porUnidade).map(k => ({ name: k, total: porUnidade[k] })));

        const porDia = filtrados.reduce((acc, c) => {
            const d = getVal(c, 'data')?.split('/').slice(0, 2).join('/') || 'S/D';
            acc[d] = (acc[d] || 0) + 1;
            return acc;
        }, {});

        setDadosEvolucao(Object.keys(porDia).map(k => ({ data: k, qtd: porDia[k] })).slice(-10));
    };

    if (loading) return <div className="loading-screen">Sincronizando todas as unidades...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1><FiActivity /> Painel TI Maricá</h1>
                <div className="filters">
                    <select value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)}>
                        {unidadesDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                    <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                    <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                    <button className="filter-btn" onClick={() => processarDados(dadosBrutos.chamados, dadosBrutos.baixas, filtroUnidade, dataInicio, dataFim)}>
                        Filtrar
                    </button>
                    <button onClick={carregarDadosSheets} className="refresh-btn"><FiRefreshCw /> Atualizar</button>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card blue"><small>Total OS</small><h2>{stats.total}</h2></div>
                <div className="stat-card orange"><small>Abertos</small><h2>{stats.abertos}</h2></div>
                <div className="stat-card green"><small>Fechados</small><h2>{stats.fechados}</h2></div>
                <div className="stat-card gray"><small>Baixas</small><h2>{stats.baixas}</h2></div>
            </div>

            <div className="charts-grid">
                <div className="chart-box">
                    <h3>Chamados por Unidade</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dadosSetores}>
                            <XAxis dataKey="name" fontSize={10} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" fill="#3b82f6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-box">
                    <h3>Evolução</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dadosEvolucao}>
                            <XAxis dataKey="data" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardBI;                         