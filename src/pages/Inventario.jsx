import React, { useState, useEffect } from "react";
import { db, auth } from "../api/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import {
  FiSearch,
  FiLogOut,
  FiShield,
  FiAlertTriangle,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiTrash2,
  FiCloudLightning,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import "../styles/Inventario.css";

const Inventario = () => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // Estados dos Filtros
  const [unidadeFiltro, setUnidadeFiltro] = useState("Todas");
  const [statusFiltro, setStatusFiltro] = useState("Ativo");
  const [buscaPatrimonio, setBuscaPatrimonio] = useState("");

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  const [modalBaixa, setModalBaixa] = useState({
    aberto: false,
    id: null,
    nome: "",
  });
  const navigate = useNavigate();

  const WEBAPP_URL_SHEETS =
    "https://script.google.com/macros/s/AKfycbwHsFnuMc_onDTG9vloDYNW6o_eIrTTfXt6O4WuhGxEP86rl1ZH4WY6o_JsSSljZqck3g/exec";

  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "")
      .trim();
  };

  useEffect(() => {
    const verificarPermissao = async () => {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Acesso negado.");
        navigate("/");
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists() && userDoc.data().role === "adm") {
          setIsAdmin(true);
        } else {
          toast.error("Acesso restrito!");
          navigate("/");
        }
      } catch (error) {
        navigate("/");
      } finally {
        setLoading(false);
      }
    };
    verificarPermissao();
  }, [navigate]);

  const carregarDados = async (e) => {
    if (e) e.preventDefault();
    setBuscando(true);
    setPaginaAtual(1); // Volta para a primeira página ao buscar
    try {
      const querySnapshot = await getDocs(collection(db, "ativos"));
      const todosOsDados = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItens(todosOsDados);
      toast.success(`${todosOsDados.length} itens carregados.`);
    } catch (error) {
      toast.error("Erro ao carregar dados.");
    } finally {
      setBuscando(false);
    }
  };

  // BOTÃO LIMPAR CORRIGIDO
  const limparFiltros = () => {
    setBuscaPatrimonio("");
    setUnidadeFiltro("Todas");
    setStatusFiltro("Ativo");
    setItens([]); // Esvazia a lista na tela
    setPaginaAtual(1);
    toast.info("Filtros e busca zerados.");
  };

  // Lógica de Filtragem
  const itensFiltrados = itens.filter((item) => {
    const unidadeItemNorm = normalizarParaComparacao(item.unidade);
    const unidadeSelecionadaNorm = normalizarParaComparacao(unidadeFiltro);

    const matchUnidade =
      unidadeFiltro === "Todas" ||
      unidadeItemNorm.includes(unidadeSelecionadaNorm) ||
      unidadeSelecionadaNorm.includes(unidadeItemNorm);

    const matchStatus =
      statusFiltro === "Todos" || item.status === statusFiltro;

    let matchBusca = true;
    if (buscaPatrimonio.trim() !== "") {
      const termoNorm = normalizarParaComparacao(buscaPatrimonio);
      const patItemNorm = normalizarParaComparacao(item.patrimonio);
      const nomeItemNorm = normalizarParaComparacao(item.nome);

      if (termoNorm === "sp") {
        matchBusca = patItemNorm === "sp";
      } else {
        matchBusca =
          patItemNorm.includes(termoNorm) || nomeItemNorm.includes(termoNorm);
      }
    }

    return matchUnidade && matchStatus && matchBusca;
  });

  // Lógica de Paginação
  const totalPaginas = Math.ceil(itensFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const itensExibidos = itensFiltrados.slice(inicio, inicio + itensPorPagina);

  const abrirModalConfirmacao = (id, nome) =>
    setModalBaixa({ aberto: true, id, nome });
  const fecharModal = () =>
    setModalBaixa({ aberto: false, id: null, nome: "" });

  const confirmarBaixa = async () => {
    try {
      await updateDoc(doc(db, "ativos", modalBaixa.id), {
        status: "Baixado",
        dataBaixa: serverTimestamp(),
      });
      toast.warning(`Item ${modalBaixa.nome} baixado.`);
      fecharModal();
      carregarDados();
    } catch (error) {
      toast.error("Erro ao baixar.");
    }
  };

  const formatarData = (timestamp) => {
    if (!timestamp) return "---";
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const exportarExcelCompleto = async () => {
    if (itens.length === 0) return toast.error("Consulte os dados primeiro.");
    toast.info("Exportando...");
    // ... lógica de exportação mantida
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (!isAdmin) return null;

  return (
    <div className="admin-painel-layout">
      <header className="cadastro-equip-header">
        <div className="header-title-container">
          <h1>
            <FiShield /> Painel Administrativo
          </h1>
          <Link to="/" className="back-link-admin">
            <FiLogOut /> Sair
          </Link>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>UNIDADE</label>
            <select
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
            >
              <option value="Todas">🌍 Todas as Unidades</option>
              <option value="Hospital Conde">Hospital Conde</option>
              <option value="Santa Rita">UPA Santa Rita</option>
              <option value="Inoã">UPA Inoã</option>
              <option value="Barroco">SAMU Barroco</option>
              <option value="Ponta Negra">SAMU Ponta Negra</option>
            </select>
          </div>

          <div className="filter-group">
            <label>STATUS</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="Ativo">Ativos</option>
              <option value="Baixado">Inutilizados</option>
              <option value="Todos">Todos</option>
            </select>
          </div>

          <div className="filter-group">
            <label>PATRIMÔNIO / NOME</label>
            <input
              type="text"
              placeholder="Ex: 105 ou S/P"
              value={buscaPatrimonio}
              onChange={(e) => {
                setBuscaPatrimonio(e.target.value);
                setPaginaAtual(1); // Reseta página ao digitar
              }}
            />
          </div>

          <div className="actions-group">
            <button
              type="button"
              className="btn-consultar"
              onClick={carregarDados}
            >
              {buscando ? (
                "..."
              ) : (
                <>
                  <FiSearch /> Consultar
                </>
              )}
            </button>
            <button
              type="button"
              className="btn-limpar"
              onClick={limparFiltros}
            >
              <FiRefreshCw /> Limpar
            </button>
            <button
              type="button"
              className="btn-excel"
              onClick={exportarExcelCompleto}
            >
              <FiCloudLightning /> Excel
            </button>
          </div>
        </div>
      </header>

      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Patrimônio</th>
              <th>Equipamento</th>
              <th>Unidade / Setor</th>
              <th>Status</th>
              <th style={{ textAlign: "center" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {itensExibidos.map((item) => (
              <tr key={item.id} className="row-hover">
                <td className="td-patrimonio">#{item.patrimonio}</td>
                <td>{item.nome}</td>
                <td>
                  <span className="unit-tag">{item.unidade}</span> <br />
                  <small>{item.setor}</small>
                </td>
                <td>
                  <span
                    className={`status-badge ${item.status?.toLowerCase()}`}
                  >
                    {item.status === "Baixado" ? "Inutilizado" : item.status}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  {item.status === "Ativo" ? (
                    <button
                      className="btn-dar-baixa"
                      onClick={() => abrirModalConfirmacao(item.id, item.nome)}
                    >
                      Baixar
                    </button>
                  ) : (
                    <small>Baixado em {formatarData(item.dataBaixa)}</small>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* CONTROLES DE PAGINAÇÃO */}
        {itensFiltrados.length > itensPorPagina && (
          <div
            className="pagination-container"
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual(paginaAtual - 1)}
              className="pagination-btn"
            >
              <FiChevronLeft /> Anterior
            </button>
            <span className="pagination-info">
              Página <strong>{paginaAtual}</strong> de {totalPaginas}
            </span>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual(paginaAtual + 1)}
              className="pagination-btn"
            >
              Próxima <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {modalBaixa.aberto && (
        <div className="modal-baixa-overlay">
          <div className="modal-baixa-card">
            <h3>Confirmar Baixa?</h3>
            <p>
              Deseja inutilizar o item: <strong>{modalBaixa.nome}</strong>?
            </p>
            <div className="modal-baixa-actions">
              <button className="btn-modal-cancelar" onClick={fecharModal}>
                Sair
              </button>
              <button className="btn-modal-confirmar" onClick={confirmarBaixa}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
