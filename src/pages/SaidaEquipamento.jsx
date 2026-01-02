import React, { useState } from "react";
import { db } from "../api/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiTruck,
  FiSearch,
  FiArrowLeft,
  FiPackage,
  FiEdit3,
  FiX,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
} from "react-icons/fi";
import "../styles/SaidaEquipamento.css";

const SaidaEquipamento = () => {
  const [patrimonioBusca, setPatrimonioBusca] = useState("");
  const [nomeBusca, setNomeBusca] = useState("");
  const [unidadeFiltro, setUnidadeFiltro] = useState("");
  const [itensEncontrados, setItensEncontrados] = useState([]);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [novoPatrimonioParaSP, setNovoPatrimonioParaSP] = useState("");

  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 15;

  const [dadosSaida, setDadosSaida] = useState({
    novaUnidade: "",
    novoSetor: "",
    motivo: "Transferência",
    responsavelRecebimento: "",
  });

  const unidades = [
    "Hospital Conde",
    "UPA INOÃ",
    "UPA SANTA RITA",
    "SAMU BARROCO",
    "SAMU PONTA NEGRA",
    "SAMU CENTRO",
  ];

  // FUNÇÃO DE NORMALIZAÇÃO QUE RESOLVE O PROBLEMA DA BUSCA
  const normalizarParaComparacao = (texto) => {
    if (!texto) return "";
    return texto
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[/\s._-]/g, "") // Remove barras, espaços e traços para comparar
      .trim();
  };

  const limparBusca = () => {
    setPatrimonioBusca("");
    setNomeBusca("");
    setUnidadeFiltro("");
    setItensEncontrados([]);
    setPaginaAtual(1);
    toast.info("Formulário resetado");
  };

  const executarBusca = async (tipo) => {
    const termoOriginal = tipo === "patrimonio" ? patrimonioBusca : nomeBusca;

    if (!termoOriginal.trim()) {
      toast.warn(
        `Digite um ${tipo === "patrimonio" ? "patrimônio" : "nome ou setor"}.`
      );
      return;
    }

    setLoading(true);
    setPaginaAtual(1);

    try {
      const ativosRef = collection(db, "ativos");
      const q = query(ativosRef, where("status", "==", "Ativo"), limit(1000));
      const snap = await getDocs(q);

      const listaGeral = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const termoNorm = normalizarParaComparacao(termoOriginal);
      const unidadeFiltroNorm = normalizarParaComparacao(unidadeFiltro);

      const filtrados = listaGeral.filter((item) => {
        const itemUnidadeNorm = normalizarParaComparacao(item.unidade);
        const itemPatrimonioNorm = normalizarParaComparacao(item.patrimonio);
        const itemNomeNorm = normalizarParaComparacao(item.nome);
        const itemSetorNorm = normalizarParaComparacao(item.setor);

        if (unidadeFiltro && itemUnidadeNorm !== unidadeFiltroNorm)
          return false;

        const ehBuscaSP = termoNorm === "sp";

        if (tipo === "patrimonio") {
          if (ehBuscaSP) return itemPatrimonioNorm === "sp";
          return itemPatrimonioNorm === termoNorm;
        }

        if (tipo === "nome") {
          if (ehBuscaSP) return itemPatrimonioNorm === "sp";
          return (
            itemNomeNorm.includes(termoNorm) ||
            itemSetorNorm.includes(termoNorm) ||
            itemPatrimonioNorm === termoNorm
          );
        }
        return false;
      });

      setItensEncontrados(filtrados);
      if (filtrados.length === 0) toast.error("Nenhum item encontrado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.ceil(itensEncontrados.length / itensPorPagina);
  const itensExibidos = itensEncontrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const handleSaida = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ativoRef = doc(db, "ativos", itemSelecionado.id);
      const patNorm = normalizarParaComparacao(itemSelecionado.patrimonio);

      const patrimonioFinal =
        patNorm === "sp" && novoPatrimonioParaSP
          ? novoPatrimonioParaSP.toUpperCase()
          : itemSelecionado.patrimonio;

      await updateDoc(ativoRef, {
        unidade: dadosSaida.novaUnidade,
        setor: dadosSaida.novoSetor,
        patrimonio: patrimonioFinal,
        ultimaMovimentacao: serverTimestamp(),
      });

      await addDoc(collection(db, "saidaEquipamento"), {
        ...dadosSaida,
        ativoId: itemSelecionado.id,
        patrimonio: patrimonioFinal,
        nomeEquipamento: itemSelecionado.nome,
        unidadeOrigem: itemSelecionado.unidade,
        setorOrigem: itemSelecionado.setor,
        dataSaida: serverTimestamp(),
      });

      toast.success("Transferência realizada!");
      setShowModal(false);
      setItensEncontrados([]);
      setPatrimonioBusca("");
      setNomeBusca("");
      setNovoPatrimonioParaSP("");
    } catch (error) {
      toast.error("Erro ao salvar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`saida-page-wrapper ${showModal ? "modal-open" : ""}`}>
      <div className="saida-container">
        <header className="saida-header">
          <div className="saida-header-content">
            <h1>
              <FiTruck /> Saída / Transferência
            </h1>
            <Link to="/" className="saida-back-link">
              <FiArrowLeft /> Voltar
            </Link>
          </div>
        </header>

        <section className="saida-search-section">
          <div className="saida-field-group">
            <label>
              <FiFilter /> Unidade Atual
            </label>
            <select
              className="saida-select-filter"
              value={unidadeFiltro}
              onChange={(e) => setUnidadeFiltro(e.target.value)}
            >
              <option value="">Todas as Unidades</option>
              {unidades.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="saida-field-group">
            <label>Nº Patrimônio</label>
            <div className="saida-input-wrapper">
              <input
                type="text"
                placeholder="Ex: HMC-001"
                value={patrimonioBusca}
                onChange={(e) => setPatrimonioBusca(e.target.value)}
              />
              <button
                className="saida-btn-search"
                onClick={() => executarBusca("patrimonio")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          <div className="saida-field-group">
            <label>Nome ou Setor</label>
            <div className="saida-input-wrapper">
              <input
                type="text"
                placeholder="Ex: Monitor"
                value={nomeBusca}
                onChange={(e) => setNomeBusca(e.target.value)}
              />
              <button
                className="saida-btn-search"
                style={{ backgroundColor: "#4f46e5" }}
                onClick={() => executarBusca("nome")}
              >
                <FiSearch />
              </button>
            </div>
          </div>

          {/* BOTÃO LIMPAR COM ESTILO ORIGINAL RESTAURADO */}
          <div
            className="saida-field-group"
            style={{ display: "flex", alignItems: "flex-end" }}
          >
            <button
              className="saida-btn-clear-modern"
              onClick={limparBusca}
              title="Limpar formulário"
              style={{
                height: "42px",
                padding: "0 20px",
                backgroundColor: "#fff1f2",
                color: "#e11d48",
                border: "1.5px solid #fecdd3",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                transition: "all 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ffe4e6";
                e.currentTarget.style.borderColor = "#fb7185";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#fff1f2";
                e.currentTarget.style.borderColor = "#fecdd3";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <FiRotateCcw size={16} /> Limpar
            </button>
          </div>
        </section>

        <div className="saida-results-grid">
          {itensExibidos.map((item) => (
            <div
              key={item.id}
              className="saida-item-card"
              onClick={() => {
                setItemSelecionado(item);
                setShowModal(true);
              }}
            >
              <div className="item-main-info">
                <FiPackage color="#2563eb" size={20} />
                <div className="text-details">
                  <strong>{item.nome}</strong>
                  <span className="badge-patrimonio">{item.patrimonio}</span>
                </div>
              </div>
              <div className="item-location-tag">
                <small>Local:</small>
                <span>
                  {item.unidade} - <strong>{item.setor}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>

        {itensEncontrados.length > itensPorPagina && (
          <div className="pagination-container">
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

      {showModal && itemSelecionado && (
        <div className="saida-modal-overlay">
          <div className="saida-modal-content">
            <div className="modal-header">
              <h3>Confirmar Saída</h3>
              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-item-summary">
              <p>
                Item: <strong>{itemSelecionado.nome}</strong>
              </p>
              <p>
                Origem:{" "}
                <strong>
                  {itemSelecionado.unidade} ({itemSelecionado.setor})
                </strong>
              </p>
            </div>
            <form onSubmit={handleSaida} className="saida-modal-form">
              {normalizarParaComparacao(itemSelecionado.patrimonio) ===
                "sp" && (
                <div className="saida-alert-sp">
                  <label>
                    <FiEdit3 /> Atribuir patrimônio?
                  </label>
                  <input
                    type="text"
                    placeholder="Novo número"
                    value={novoPatrimonioParaSP}
                    onChange={(e) => setNovoPatrimonioParaSP(e.target.value)}
                  />
                </div>
              )}
              <div className="form-group">
                <label>Unidade de Destino</label>
                <select
                  required
                  onChange={(e) =>
                    setDadosSaida({
                      ...dadosSaida,
                      novaUnidade: e.target.value,
                    })
                  }
                >
                  <option value="">Selecione...</option>
                  {unidades.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Novo Setor</label>
                <input
                  type="text"
                  required
                  onChange={(e) =>
                    setDadosSaida({ ...dadosSaida, novoSetor: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Responsável</label>
                <input
                  type="text"
                  required
                  onChange={(e) =>
                    setDadosSaida({
                      ...dadosSaida,
                      responsavelRecebimento: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="saida-btn-submit"
                disabled={loading}
              >
                {loading ? "Gravando..." : "Finalizar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaidaEquipamento;
