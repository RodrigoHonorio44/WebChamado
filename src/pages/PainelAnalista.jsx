import React, { useEffect, useState } from "react";
import { db, auth } from "../api/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import {
  FiX,
  FiDownload,
  FiPrinter,
  FiPauseCircle,
  FiPlayCircle,
  FiCheck,
  FiSearch,
  FiArrowLeftCircle,
} from "react-icons/fi";
import "../styles/PainelAnalista.css";

import logoMarca from "../assets/logoo1.png";

const PainelAnalista = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false);

  // Modais
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [mostrarModalPendencia, setMostrarModalPendencia] = useState(false);
  const [mostrarBuscaImpressao, setMostrarBuscaImpressao] = useState(false);

  const [chamadoParaFinalizar, setChamadoParaFinalizar] = useState(null);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [chamadoParaPendente, setChamadoParaPendente] = useState(null);

  const [numeroOsBusca, setNumeroOsBusca] = useState("");
  const [parecerTecnico, setParecerTecnico] = useState("");
  const [patrimonio, setPatrimonio] = useState("");
  const [motivoPendencia, setMotivoPendencia] = useState("");

  const WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbyGgcYmM7oXjpx0li898F2RCy5M4a6os5Ti9s9t5J6h9BbgO0W8PpOfrQ3TxqIOCNNVpg/exec";

  const analistaNome =
    auth.currentUser?.displayName || userData?.name || "Analista";
  const ehAdmin = userData?.role === "adm";

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "chamados"), orderBy("criadoEm", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const lista = [];
      querySnapshot.forEach((doc) => {
        lista.push({ id: doc.id, ...doc.data() });
      });
      setChamados(lista);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const stats = {
    total: chamados.length,
    abertos: chamados.filter((c) => c.status === "aberto").length,
    atendimento: chamados.filter((c) => c.status === "em atendimento").length,
    pendentes: chamados.filter((c) => c.status === "pendente").length,
    fechados: chamados.filter((c) => c.status === "fechado").length,
  };

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return "---";
    // Verifica se é um timestamp do Firebase ou uma Date comum
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncarTexto = (texto, limite = 50) => {
    if (!texto) return "";
    return texto.length > limite ? texto.substring(0, limite) + "..." : texto;
  };

  const handleBuscarEImprimir = (e) => {
    e.preventDefault();
    const termoLimpo = numeroOsBusca.replace(/[-\s]/g, "").trim();
    const encontrado = chamados.find(
      (c) => String(c.numeroOs).replace(/[-\s]/g, "").trim() === termoLimpo
    );

    if (encontrado) {
      setMostrarBuscaImpressao(false);
      setNumeroOsBusca("");
      navigate(`/imprimir-os/${encontrado.id}`);
    } else {
      toast.error(`OS ${numeroOsBusca} não encontrada!`);
    }
  };

  const podeAlterarChamado = (chamado) => {
    if (ehAdmin) return true;
    if (
      !chamado.tecnicoResponsavel ||
      chamado.tecnicoResponsavel === analistaNome
    )
      return true;
    toast.error(`Acesso negado! Técnico: ${chamado.tecnicoResponsavel}`);
    return false;
  };

  const handleAssumirChamado = async (chamado) => {
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        iniciadoEm: serverTimestamp(),
      });
      toast.info("Você assumiu o atendimento.");
    } catch {
      toast.error("Erro ao assumir chamado.");
    }
  };

  const handleDevolverChamado = async (chamado) => {
    if (!podeAlterarChamado(chamado)) return;
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "aberto",
        tecnicoResponsavel: null,
        iniciadoEm: null,
      });
      toast.success("Chamado devolvido para a fila.");
      setMostrarDetalhes(false);
    } catch {
      toast.error("Erro ao devolver.");
    }
  };

  const handleColocarPendente = async (e) => {
    e.preventDefault();
    if (!podeAlterarChamado(chamadoParaPendente)) return;
    try {
      await updateDoc(doc(db, "chamados", chamadoParaPendente.id), {
        status: "pendente",
        motivoPausa: motivoPendencia,
        pausadoEm: serverTimestamp(),
      });
      toast.warning("SLA Pausado.");
      setMostrarModalPendencia(false);
      setMotivoPendencia("");
    } catch {
      toast.error("Erro ao pausar.");
    }
  };

  const handleRetomarChamado = async (chamado) => {
    if (!podeAlterarChamado(chamado)) return;
    try {
      await updateDoc(doc(db, "chamados", chamado.id), {
        status: "em atendimento",
        retomadoEm: serverTimestamp(),
      });
      toast.success("Atendimento retomado!");
    } catch {
      toast.error("Erro ao retomar.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "chamados", chamadoParaFinalizar.id), {
        status: "fechado",
        feedbackAnalista: parecerTecnico,
        patrimonio: patrimonio.toUpperCase(),
        finalizadoEm: serverTimestamp(),
      });
      toast.success("Chamado finalizado!");
      setMostrarModal(false);
      setParecerTecnico("");
      setPatrimonio("");
    } catch {
      toast.error("Erro ao finalizar.");
    }
  };

  const handleExportarELimpar = async () => {
    const fechados = chamados.filter((c) => c.status === "fechado");
    if (fechados.length === 0) {
      toast.warning("Sem chamados fechados para exportar.");
      setAguardandoConfirmacao(false);
      return;
    }

    try {
      // MAPEAMENTO CORRIGIDO COM TODOS OS CAMPOS SOLICITADOS
      const dadosExportacao = fechados.map((c) => ({
        OS: c.numeroOs || "N/A",
        Data: formatarDataHora(c.criadoEm),
        Solicitante: c.nome || "N/A",
        Unidade: c.unidade || "N/A",
        Descricao: c.descricao || "N/A", // Puxa a descrição do relato
        Status: "FECHADO",
        Patrimonio: c.patrimonio || "N/A",
        Parecer_Tecnico: c.feedbackAnalista || "N/A", // Puxa o parecer preenchido no fechamento
        Finalizado_Por: c.tecnicoResponsavel || "N/A", // Nome do analista
        Finalizado_Em: formatarDataHora(c.finalizadoEm), // Data do fechamento
      }));

      // 1. Enviar para o Google Sheets (Sheets)
      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        header: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "CHAMADOS_POWERBI",
          dados: dadosExportacao,
        }),
      });

      // 2. Gerar o Excel (Aba CHAMADOS)
      const ws = XLSX.utils.json_to_sheet(dadosExportacao);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CHAMADOS");
      XLSX.writeFile(
        wb,
        `Relatorio_Finalizados_${new Date().toLocaleDateString()}.xlsx`
      );

      // 3. Limpar do Firebase após sucesso
      const batch = writeBatch(db);
      fechados.forEach((c) => batch.delete(doc(db, "chamados", c.id)));
      await batch.commit();

      setAguardandoConfirmacao(false);
      toast.success("Dados exportados e banco de dados limpo!");
    } catch (error) {
      console.error(error);
      toast.error("Erro na exportação. Verifique o console.");
    }
  };

  return (
    <div className="meus-chamados-container">
      <header className="page-header">
        <div className="header-brand-box">
          <img src={logoMarca} alt="Logo" className="logo-header" />
          <div className="header-title-divider"></div>
          <div>
            <h1 className="header-title-text">Fila de Chamados</h1>
            <Link to="/" className="back-link-modern">
              <FiArrowLeftCircle /> Painel Inicial
            </Link>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setMostrarBuscaImpressao(true)}
            className="btn-print-top"
          >
            <FiPrinter /> Imprimir OS
          </button>
          {ehAdmin &&
            (!aguardandoConfirmacao ? (
              <button
                onClick={() => setAguardandoConfirmacao(true)}
                className="btn-action-remove"
              >
                <FiDownload /> Exportar e Limpar
              </button>
            ) : (
              <div className="confirm-action-box">
                <span>Excluir?</span>
                <button
                  onClick={handleExportarELimpar}
                  className="btn-confirm-yes"
                >
                  Sim
                </button>
                <button
                  onClick={() => setAguardandoConfirmacao(false)}
                  className="btn-confirm-no"
                >
                  Não
                </button>
              </div>
            ))}
        </div>
      </header>

      <div className="painel-cards-resumo">
        {Object.entries(stats).map(([label, valor]) => (
          <div key={label} className={`card-estatistica ${label}`}>
            <h3>{label.charAt(0).toUpperCase() + label.slice(1)}</h3>
            <span className="valor">{valor}</span>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>OS</th>
              <th>Aberto em</th>
              <th>Solicitante / Setor</th>
              <th>Relato</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6">Carregando...</td>
              </tr>
            ) : (
              chamados.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => {
                    setChamadoSelecionado(item);
                    setMostrarDetalhes(true);
                  }}
                  className="row-hover-effect"
                >
                  <td>
                    <strong>#{item.numeroOs}</strong>
                  </td>
                  <td>{formatarDataHora(item.criadoEm)}</td>
                  <td>
                    <strong>{item.nome}</strong>
                    <br />
                    <small style={{ color: "#007bff", fontWeight: "bold" }}>
                      {item.setor || "Geral"}
                    </small>
                  </td>
                  <td>{truncarTexto(item.descricao)}</td>
                  <td>
                    <span className={`status-badge ${item.status}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: "5px" }}>
                      {item.status === "aberto" && (
                        <button
                          onClick={() => handleAssumirChamado(item)}
                          className="btn-assumir"
                        >
                          Assumir
                        </button>
                      )}
                      {(item.status === "em atendimento" ||
                        item.status === "pendente") && (
                        <>
                          {(item.tecnicoResponsavel === analistaNome ||
                            ehAdmin) && (
                            <button
                              onClick={() => handleDevolverChamado(item)}
                              className="btn-devolver"
                              title="Devolver"
                            >
                              <FiArrowLeftCircle />
                            </button>
                          )}
                          {item.status === "em atendimento" && (
                            <>
                              <button
                                onClick={() => {
                                  setChamadoParaPendente(item);
                                  setMostrarModalPendencia(true);
                                }}
                                className="btn-pausar"
                              >
                                <FiPauseCircle />
                              </button>
                              <button
                                onClick={() => {
                                  setChamadoParaFinalizar(item);
                                  setMostrarModal(true);
                                }}
                                className="btn-finalizar-small"
                              >
                                <FiCheck />
                              </button>
                            </>
                          )}
                          {item.status === "pendente" && (
                            <button
                              onClick={() => handleRetomarChamado(item)}
                              className="btn-retomar"
                            >
                              <FiPlayCircle /> Retomar
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAIS --- */}

      {mostrarBuscaImpressao && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2>Imprimir Chamado</h2>
              <button
                onClick={() => setMostrarBuscaImpressao(false)}
                className="btn-close-modal"
              >
                <FiX />
              </button>
            </div>
            <form onSubmit={handleBuscarEImprimir}>
              <label>Número da OS</label>
              <input
                type="text"
                className="form-input"
                value={numeroOsBusca}
                onChange={(e) => setNumeroOsBusca(e.target.value)}
                required
                placeholder="Ex: 2025-9218"
              />
              <button
                type="submit"
                className="btn-salvar-modern"
                style={{ width: "100%" }}
              >
                <FiSearch /> Buscar
              </button>
            </form>
          </div>
        </div>
      )}

      {mostrarDetalhes && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chamado #{chamadoSelecionado?.numeroOs}</h2>
              <button
                onClick={() => setMostrarDetalhes(false)}
                className="btn-close-modal"
              >
                <FiX />
              </button>
            </div>
            <div className="detalhes-body">
              <div className="info-grid">
                <p>
                  <strong>Solicitante:</strong> {chamadoSelecionado?.nome}
                </p>
                <p>
                  <strong>Unidade:</strong> {chamadoSelecionado?.unidade}
                </p>
                <p>
                  <strong>Setor:</strong>{" "}
                  <span className="text-blue-bold">
                    {chamadoSelecionado?.setor || "Geral"}
                  </span>
                </p>
                <p>
                  <strong>Técnico:</strong>{" "}
                  {chamadoSelecionado?.tecnicoResponsavel || "Aguardando"}
                </p>
              </div>
              <hr />
              <h3>Descrição do Usuário</h3>
              <div className="descricao-box-full">
                {chamadoSelecionado?.descricao}
              </div>
            </div>
            <button
              onClick={() => setMostrarDetalhes(false)}
              className="btn-voltar"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {mostrarModalPendencia && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Pausar SLA</h2>
            <form onSubmit={handleColocarPendente}>
              <textarea
                className="form-input"
                value={motivoPendencia}
                onChange={(e) => setMotivoPendencia(e.target.value)}
                required
                placeholder="Motivo da pendência..."
              />
              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setMostrarModalPendencia(false)}
                  className="btn-voltar"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar-modern">
                  Confirmar Pausa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Finalizar OS #{chamadoParaFinalizar?.numeroOs}</h2>
            <form onSubmit={handleFinalizarChamado}>
              <label>Patrimônio</label>
              <input
                type="text"
                className="form-input"
                value={patrimonio}
                onChange={(e) => setPatrimonio(e.target.value)}
                required
              />
              <label>Parecer Técnico</label>
              <textarea
                className="form-input"
                value={parecerTecnico}
                onChange={(e) => setParecerTecnico(e.target.value)}
                required
              />
              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="btn-voltar"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar-modern">
                  Encerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelAnalista;
