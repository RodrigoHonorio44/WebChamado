import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { FiActivity, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import '../styles/DashboardBI.css';

const DashboardBI = () => {
    const navigate = useNavigate();
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

    const LINKS = {
        CHAMADOS_GERAL: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=0")}`,
        HOSPITAL_CONDE: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=583741098")}`,
        UPA_SANTA_RITA: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=1257274751")}`,
        UPA_INOA: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=339251774")}`,
        BAIXADOS: `${PROXY}${encodeURIComponent(BASE_CSV + "&gid=416525153")}`
    };

    const normalizar = (texto = '') =>
        texto.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Função aprimorada para buscar colunas com nomes variados (Data ou Data da Baixa)
    const getVal = (obj, term) => {
        if (!obj) return "";
        const key = Object.keys(obj).find(k =>
            normalizar(k).includes(normalizar(term))
        );
        return key ? String(obj[key] || "").trim() : "";
    };

    // Converte "25/12/2025, 10:33:20" ou "2025-12-25" para Objeto Date comparável
    const parseDataComp = (dataStr) => {
        if (!dataStr) return null;
        try {
            const apenasData = dataStr.split(',')[0].trim();
            if (apenasData.includes('/')) {
                const [d, m, a] = apenasData.split('/');
                return new Date(`${a}-${m}-${d}T12:00:00`); // Meio-dia para evitar erro de fuso
            }
            return new Date(apenasData + "T12:00:00");
        } catch (e) { return null; }
    };

    const carregarDadosSheets = async () => {
        setLoading(true);
        try {
            const respostas = await Promise.all(
                Object.values(LINKS).map(url => fetch(url).then(r => r.text()))
            );

            const datasets = respostas.map(csv => Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' }).data);

            const filtrarChamadosReais = (data) => data.filter(item => {
                const os = getVal(item, 'os');
                return os && os.toLowerCase() !== 'os';
            });

            const todosChamados = [
                ...filtrarChamadosReais(datasets[0]),
                ...filtrarChamadosReais(datasets[1]),
                ...filtrarChamadosReais(datasets[2]),
                ...filtrarChamadosReais(datasets[3])
            ];

            const todasBaixas = datasets[4].filter(b => getVal(b, 'patrimonio'));

            setDadosBrutos({ chamados: todosChamados, baixas: todasBaixas });

            const unidades = ['TODAS', ...new Set(todosChamados.map(c => getVal(c, 'unidade')).filter(Boolean))];
            setUnidadesDisponiveis(unidades);

            processarDados(todosChamados, todasBaixas, filtroUnidade, dataInicio, dataFim);
        } catch (e) {
            console.error("Erro ao carregar dados:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { carregarDadosSheets(); }, []);

    const processarDados = (chamados, baixados, unidadeFiltro, inicio, fim) => {
        const dInicio = inicio ? new Date(inicio + "T00:00:00") : null;
        const dFim = fim ? new Date(fim + "T23:59:59") : null;

        const filtrarGenerico = (lista, termoData) => {
            return lista.filter(item => {
                const u = getVal(item, 'unidade');
                const matchUnidade = unidadeFiltro === 'TODAS' || normalizar(u) === normalizar(unidadeFiltro);

                const dObj = parseDataComp(getVal(item, termoData));
                let matchData = true;
                if (dInicio && dObj) matchData = matchData && dObj >= dInicio;
                if (dFim && dObj) matchData = matchData && dObj <= dFim;

                return matchUnidade && matchData;
            });
        };

        const chamadosFiltrados = filtrarGenerico(chamados, 'Data');
        const baixasFiltradas = filtrarGenerico(baixados, 'Data'); // Tenta 'Data' ou 'Data da Baixa' via getVal

        const nFechados = chamadosFiltrados.filter(c => getVal(c, 'status').toLowerCase().includes('fechado')).length;

        setStats({
            total: chamadosFiltrados.length,
            abertos: chamadosFiltrados.length - nFechados,
            fechados: nFechados,
            baixas: baixasFiltradas.length
        });

        // Gráfico por Unidade
        const porUnidade = chamadosFiltrados.reduce((acc, c) => {
            const u = getVal(c, 'unidade') || 'Outros';
            acc[u] = (acc[u] || 0) + 1;
            return acc;
        }, {});
        setDadosSetores(Object.keys(porUnidade).map(k => ({ name: k, total: porUnidade[k] })));

        // Evolução Temporal
        const porDia = chamadosFiltrados.reduce((acc, c) => {
            const dataPura = getVal(c, 'data').split(',')[0].split('/').slice(0, 2).join('/');
            acc[dataPura] = (acc[dataPura] || 0) + 1;
            return acc;
        }, {});
        setDadosEvolucao(Object.keys(porDia).map(k => ({ data: k, qtd: porDia[k] })).slice(-15));
    };

    if (loading) return <div className="loading-screen">Sincronizando todas as unidades...</div>;

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <button onClick={() => navigate(-1)} className="back-btn"><FiArrowLeft /> Voltar</button>
                    <h1><FiActivity /> Painel TI Maricá</h1>
                </div>

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
                <div className="stat-card gray"><small>Equip. Baixados</small><h2>{stats.baixas}</h2></div>
            </div>

            <div className="charts-grid">
                <div className="chart-box">
                    <h3>Chamados por Unidade</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dadosSetores}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="chart-box">
                    <h3>Evolução de Chamados (Últimos dias)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={dadosEvolucao}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="data" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardBI;