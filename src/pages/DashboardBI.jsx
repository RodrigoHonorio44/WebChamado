import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    LineChart, Line, CartesianGrid, Cell
} from 'recharts';
import {
    FiActivity, FiRefreshCw, FiArrowLeft, FiLayers, FiFilter,
    FiCalendar, FiTrash2, FiTrendingUp, FiClock, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import '../styles/DashboardBI.css';

const DashboardBI = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 0, abertos: 0, fechados: 0, baixas: 0, slaMedio: "00h 00m" });
    const [dadosSetores, setDadosSetores] = useState([]);
    const [dadosEvolucao, setDadosEvolucao] = useState([]);
    const [listaBaixas, setListaBaixas] = useState([]);
    const [top10Baixas, setTop10Baixas] = useState([]);
    const [unidadesDisponiveis, setUnidadesDisponiveis] = useState([]);
    const [filtroUnidade, setFiltroUnidade] = useState('TODAS');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [loading, setLoading] = useState(true);
    const [dadosBrutos, setDadosBrutos] = useState({ chamados: [], baixas: [] });

    const [showTop10, setShowTop10] = useState(false);
    const [showDetalhes, setShowDetalhes] = useState(false);

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
        texto?.toString().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';

    const getVal = (obj, term) => {
        if (!obj) return "";
        const key = Object.keys(obj).find(k => normalizar(k).includes(normalizar(term)));
        return key ? String(obj[key] || "").trim() : "";
    };

    const parseFullDateTime = (str) => {
        if (!str || str === "N/A" || str.length < 10) return null;
        try {
            // Suporta "27/12/2025 20:27:39" ou "27/12/2025, 20:27:39"
            const partes = str.trim().split(/[\s,]+/);
            const data = partes[0];
            const hora = partes[1] || "00:00:00";
            const [d, m, a] = data.split('/');
            return new Date(`${a}-${m}-${d}T${hora}`);
        } catch (e) { return null; }
    };

    // ✅ CORREÇÃO: Tratamento para o formato "27/12/2025 20:27:39"
    const parseDataComp = (dataStr) => {
        if (!dataStr || dataStr === "N/A") return null;
        try {
            // Pega apenas a data antes do espaço ou vírgula
            const apenasData = dataStr.trim().split(/[\s,]+/)[0];
            if (apenasData.includes('/')) {
                const [d, m, a] = apenasData.split('/');
                const anoFull = a.length === 2 ? `20${a}` : a;
                // Definimos meio-dia (T12:00:00) para evitar problemas de fuso horário no filtro por dia
                return new Date(`${anoFull}-${m}-${d}T12:00:00`);
            }
            return new Date(apenasData + "T12:00:00");
        } catch (e) { return null; }
    };

    const processarDados = useCallback((chamados, baixados, unidadeFiltro, inicio, fim) => {
        const dInicio = inicio ? new Date(inicio + "T00:00:00") : null;
        const dFim = fim ? new Date(fim + "T23:59:59") : null;

        // 1. Filtrar Chamados
        const chamadosFiltrados = chamados.filter(item => {
            const u = getVal(item, 'unidade');
            const matchUnidade = unidadeFiltro === 'TODAS' || normalizar(u) === normalizar(unidadeFiltro);
            const dObj = parseDataComp(getVal(item, 'Data'));
            let matchData = true;
            if (dInicio && dObj) matchData = matchData && dObj >= dInicio;
            if (dFim && dObj) matchData = matchData && dObj <= dFim;
            return matchUnidade && matchData;
        });

        // 2. Filtrar Baixas (Corrigido para usar "Data da Baixa")
        const baixasFiltradas = baixados.filter(item => {
            const u = getVal(item, 'unidade');
            const matchUnidade = unidadeFiltro === 'TODAS' || normalizar(u) === normalizar(unidadeFiltro);

            const valorData = getVal(item, 'Data da Baixa') || getVal(item, 'Data');
            const dObj = parseDataComp(valorData);

            let matchData = true;
            if (dInicio && dObj) matchData = matchData && dObj >= dInicio;
            if (dFim && dObj) matchData = matchData && dObj <= dFim;

            // Se houver filtro ativo mas o item não tem data válida, remove
            if ((dInicio || dFim) && !dObj) matchData = false;

            return matchUnidade && matchData;
        });

        // Cálculos de Estatísticas
        let somaMinutos = 0;
        let totalFinalizados = 0;
        chamadosFiltrados.forEach(c => {
            const dtInicio = parseFullDateTime(getVal(c, 'Data'));
            const dtFim = parseFullDateTime(getVal(c, 'Finalizado_Em'));
            if (dtInicio && dtFim && dtFim > dtInicio) {
                somaMinutos += (dtFim - dtInicio) / 60000;
                totalFinalizados++;
            }
        });

        const mediaSla = totalFinalizados > 0 ? somaMinutos / totalFinalizados : 0;
        const slaFormatado = `${String(Math.floor(mediaSla / 60)).padStart(2, '0')}h ${String(Math.round(mediaSla % 60)).padStart(2, '0')}m`;
        const nFechados = chamadosFiltrados.filter(c => normalizar(getVal(c, 'status')).includes('FECHADO')).length;

        setStats({
            total: chamadosFiltrados.length,
            abertos: chamadosFiltrados.length - nFechados,
            fechados: nFechados,
            baixas: baixasFiltradas.length,
            slaMedio: slaFormatado
        });

        setListaBaixas(baixasFiltradas.map(b => ({
            equipamento: getVal(b, 'equipamento') || getVal(b, 'descricao') || 'N/A',
            unidade: getVal(b, 'unidade') || 'N/A',
            setor: getVal(b, 'setor') || 'N/A',
            data: getVal(b, 'Data da Baixa') || getVal(b, 'Data') || 'N/A'
        })));

        const contagemRanking = baixasFiltradas.reduce((acc, b) => {
            const eq = getVal(b, 'equipamento') || getVal(b, 'descricao') || 'N/A';
            const un = getVal(b, 'unidade') || 'N/A';
            const st = getVal(b, 'setor') || 'N/A';
            const chave = `${eq}|${un}|${st}`;
            if (!acc[chave]) acc[chave] = { nome: eq, unidade: un, setor: st, total: 0 };
            acc[chave].total += 1;
            return acc;
        }, {});

        setTop10Baixas(Object.values(contagemRanking).sort((a, b) => b.total - a.total).slice(0, 10));

        const porUnidade = chamadosFiltrados.reduce((acc, c) => {
            const u = getVal(c, 'unidade') || 'N/A';
            acc[u] = (acc[u] || 0) + 1;
            return acc;
        }, {});
        setDadosSetores(Object.keys(porUnidade).map(k => ({ name: k, total: porUnidade[k] })).sort((a, b) => b.total - a.total));

        const porDia = chamadosFiltrados.reduce((acc, c) => {
            const dStr = getVal(c, 'Data').split(/[\s,]+/)[0];
            if (dStr) acc[dStr] = (acc[dStr] || 0) + 1;
            return acc;
        }, {});
        setDadosEvolucao(Object.keys(porDia).map(k => ({ data: k, dataObj: parseDataComp(k), qtd: porDia[k] })).sort((a, b) => a.dataObj - b.dataObj).slice(-15));
    }, [normalizar, getVal]);

    const carregarDadosSheets = async () => {
        setLoading(true);
        try {
            const respostas = await Promise.all(Object.values(LINKS).map(url => fetch(url).then(r => r.text())));
            const datasets = respostas.map(csv => Papa.parse(csv, { header: true, skipEmptyLines: 'greedy' }).data);
            const filtrarValidos = (data) => data.filter(item => getVal(item, 'os'));
            const todosChamados = [...filtrarValidos(datasets[0]), ...filtrarValidos(datasets[1]), ...filtrarValidos(datasets[2]), ...filtrarValidos(datasets[3])];
            const todasBaixas = datasets[4].filter(b => getVal(b, 'patrimonio') || getVal(b, 'equipamento') || getVal(b, 'Data da Baixa'));

            setDadosBrutos({ chamados: todosChamados, baixas: todasBaixas });
            const unidades = ['TODAS', ...new Set(todosChamados.map(c => getVal(c, 'unidade')).filter(Boolean))];
            setUnidadesDisponiveis(unidades);
            processarDados(todosChamados, todasBaixas, filtroUnidade, dataInicio, dataFim);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { carregarDadosSheets(); }, []);

    if (loading) return (
        <div className="loading-screen"><FiRefreshCw className="spin" /><p>Sincronizando Banco de Dados...</p></div>
    );

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-top">
                    <div className="header-brand">
                        <button onClick={() => navigate(-1)} className="back-btn"><FiArrowLeft /> Voltar</button>
                        <h1><FiActivity /> Painel Power BI Patrimonial</h1>
                    </div>
                    <button onClick={carregarDadosSheets} className="refresh-btn-top"><FiRefreshCw /> Sincronizar</button>
                </div>
                <div className="filters-bar">
                    <div className="filter-item">
                        <label><FiFilter /> Unidade</label>
                        <select value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)}>
                            {unidadesDisponiveis.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                    <div className="filter-item">
                        <label><FiCalendar /> Período</label>
                        <div className="date-group">
                            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
                            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
                        </div>
                    </div>
                    <div className="filter-actions">
                        <button className="apply-btn" onClick={() => processarDados(dadosBrutos.chamados, dadosBrutos.baixas, filtroUnidade, dataInicio, dataFim)}>Filtrar</button>
                    </div>
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card blue"><small>Total O.S</small><h2>{stats.total}</h2></div>
                <div className="stat-card green"><small>Fechados</small><h2>{stats.fechados}</h2></div>
                <div className="stat-card orange"><small><FiClock /> Média SLA</small><h2>{stats.slaMedio}</h2></div>
                <div className="stat-card gray"><small>Inutilizados</small><h2>{stats.baixas}</h2></div>
            </div>

            <div className="charts-main">
                <div className="chart-item">
                    <h3><FiLayers /> Chamados por Unidade</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dadosSetores} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={11} interval={0} angle={-35} textAnchor="end" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                {dadosSetores.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-item">
                    <h3><FiActivity /> Evolução Diária</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dadosEvolucao}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="data" fontSize={11} />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="qtd" stroke="#f59e0b" strokeWidth={4} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="details-section" style={{ marginTop: '20px' }}>
                <div className="chart-item full-width" style={{ marginBottom: '20px', borderLeft: '5px solid #f59e0b' }}>
                    <div className="panel-header-clickable" onClick={() => setShowTop10(!showTop10)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <h3 style={{ color: '#f59e0b', margin: 0 }}><FiTrendingUp /> Ranking: Top 10 Recorrência de Baixas</h3>
                        {showTop10 ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                    </div>
                    {showTop10 && (
                        <div className="table-wrapper animate-slide-down" style={{ marginTop: '15px' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr><th>Pos.</th><th>Equipamento</th><th>Unidade</th><th>Setor</th><th>Quantidade</th></tr>
                                </thead>
                                <tbody>
                                    {top10Baixas.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{index + 1}º</td>
                                            <td style={{ fontWeight: 'bold' }}>{item.nome}</td>
                                            <td>{item.unidade}</td>
                                            <td><span className="badge-sector">{item.setor}</span></td>
                                            <td><span style={{ fontWeight: 'bold', color: '#b45309' }}>{item.total} un.</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="chart-item full-width">
                    <div className="panel-header-clickable" onClick={() => setShowDetalhes(!showDetalhes)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <h3 style={{ margin: 0 }}><FiTrash2 /> Detalhamento Individual de Baixas</h3>
                        {showDetalhes ? <FiChevronUp size={24} /> : <FiChevronDown size={24} />}
                    </div>
                    {showDetalhes && (
                        <div className="table-wrapper animate-slide-down" style={{ marginTop: '15px' }}>
                            <table className="modern-table">
                                <thead>
                                    <tr><th>Equipamento</th><th>Unidade</th><th>Setor</th><th>Data da Baixa</th></tr>
                                </thead>
                                <tbody>
                                    {listaBaixas.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 'bold' }}>{item.equipamento}</td>
                                            <td>{item.unidade}</td>
                                            <td><span className="badge-sector">{item.setor}</span></td>
                                            <td>{item.data}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardBI;