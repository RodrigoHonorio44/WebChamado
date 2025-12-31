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
  FiArrowLeftCircle, // Novo ícone para devolver
} from "react-icons/fi";
import "../styles/PainelAnalista.css";

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

  const formatarDataHora = (timestamp) => {
    if (!timestamp) return "---";
    const date = timestamp.toDate();
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
    const encontrado = chamados.find((c) => {
      const osNoBancoLimpa = String(c.numeroOs).replace(/[-\s]/g, "").trim();
      return osNoBancoLimpa === termoLimpo;
    });

    if (encontrado) {
      setMostrarBuscaImpressao(false);
      setNumeroOsBusca("");
      navigate(`/imprimir-os/${encontrado.id}`);
    } else {
      toast.error(`OS ${numeroOsBusca} não encontrada!`);
    }
  };

  // --- TRAVA DE SEGURANÇA ---
  const podeAlterarChamado = (chamado) => {
    if (ehAdmin) return true;
    if (!chamado.tecnicoResponsavel) return true;
    if (chamado.tecnicoResponsavel === analistaNome) return true;

    toast.error(
      `Acesso negado! Este chamado pertence a: ${chamado.tecnicoResponsavel}`
    );
    return false;
  };

  const handleAssumirChamado = async (chamado) => {
    if (
      chamado.tecnicoResponsavel &&
      chamado.tecnicoResponsavel !== analistaNome &&
      !ehAdmin
    ) {
      toast.error(
        `Este chamado já está sendo atendido por ${chamado.tecnicoResponsavel}`
      );
      return;
    }

    try {
      const chamadoRef = doc(db, "chamados", chamado.id);
      await updateDoc(chamadoRef, {
        status: "em atendimento",
        tecnicoResponsavel: analistaNome,
        iniciadoEm: serverTimestamp(),
      });
      toast.info("Você assumiu o atendimento.");
      setMostrarDetalhes(false);
    } catch (error) {
      toast.error("Erro ao assumir chamado.");
    }
  };

  // --- NOVA FUNÇÃO: DEVOLVER CHAMADO ---
  const handleDevolverChamado = async (chamado) => {
    // Regra: Somente o analista que está com o chamado ou o ADM podem devolver
    const ehDono = chamado.tecnicoResponsavel === analistaNome;

    if (!ehDono && !ehAdmin) {
      toast.error(
        "Somente o técnico responsável ou ADM podem devolver este chamado!"
      );
      return;
    }

    if (
      window.confirm(
        `Deseja devolver o chamado #${chamado.numeroOs} para a fila?`
      )
    ) {
      try {
        const chamadoRef = doc(db, "chamados", chamado.id);
        await updateDoc(chamadoRef, {
          status: "aberto",
          tecnicoResponsavel: null,
          iniciadoEm: null,
          pausadoEm: null,
          motivoPausa: null,
        });
        toast.success("Chamado devolvido para a fila geral.");
        setMostrarDetalhes(false);
      } catch (error) {
        toast.error("Erro ao devolver chamado.");
      }
    }
  };

  const handleColocarPendente = async (e) => {
    e.preventDefault();
    if (!podeAlterarChamado(chamadoParaPendente)) return;

    try {
      const chamadoRef = doc(db, "chamados", chamadoParaPendente.id);
      await updateDoc(chamadoRef, {
        status: "pendente",
        motivoPausa: motivoPendencia,
        pausadoEm: serverTimestamp(),
      });
      toast.warning("SLA Pausado.");
      setMostrarModalPendencia(false);
      setMotivoPendencia("");
      setMostrarDetalhes(false);
    } catch (error) {
      toast.error("Erro ao pausar chamado.");
    }
  };

  const handleRetomarChamado = async (chamado) => {
    if (!podeAlterarChamado(chamado)) return;

    try {
      const chamadoRef = doc(db, "chamados", chamado.id);
      await updateDoc(chamadoRef, {
        status: "em atendimento",
        retomadoEm: serverTimestamp(),
      });
      toast.success("Atendimento retomado!");
      setMostrarDetalhes(false);
    } catch (error) {
      toast.error("Erro ao retomar.");
    }
  };

  const handleFinalizarChamado = async (e) => {
    e.preventDefault();
    if (!podeAlterarChamado(chamadoParaFinalizar)) return;

    try {
      const chamadoRef = doc(db, "chamados", chamadoParaFinalizar.id);
      await updateDoc(chamadoRef, {
        status: "fechado",
        feedbackAnalista: parecerTecnico,
        patrimonio: patrimonio.toUpperCase(),
        tecnicoResponsavel: analistaNome,
        finalizadoEm: serverTimestamp(),
      });
      toast.success("Chamado finalizado!");
      setMostrarModal(false);
      setParecerTecnico("");
      setPatrimonio("");
    } catch (error) {
      toast.error("Erro ao finalizar.");
    }
  };

  const handleExportarELimpar = async () => {
    try {
      const chamadosFechados = chamados.filter((c) => c.status === "fechado");
      if (chamadosFechados.length === 0) {
        toast.warning("Sem chamados fechados.");
        setAguardandoConfirmacao(false);
        return;
      }

      const dados = chamadosFechados.map((c) => ({
        OS: c.numeroOs,
        Solicitante: c.nome,
        Unidade: c.unidade,
        Setor: c.setor || "N/A",
        Status: c.status,
        Patrimonio: c.patrimonio || "N/A",
        Analista: c.tecnicoResponsavel || "",
      }));

      await fetch(WEB_APP_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ tipo: "CHAMADOS_POWERBI", dados }),
      });
      const ws = XLSX.utils.json_to_sheet(dados);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Chamados");
      XLSX.writeFile(wb, `Relatorio.xlsx`);

      const batch = writeBatch(db);
      chamadosFechados.forEach((c) => batch.delete(doc(db, "chamados", c.id)));
      await batch.commit();
      setAguardandoConfirmacao(false);
      toast.success("Exportado e limpo com sucesso!");
    } catch (error) {
      toast.error("Erro na exportação.");
      setAguardandoConfirmacao(false);
    }
  };

  return (
    <div className="meus-chamados-container">
      <header className="page-header">
        <div>
          <h1>Fila de Chamados</h1>
          <Link to="/" className="back-link">
            ← Voltar
          </Link>
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
                <span>Excluir fechados?</span>
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

      <div className="table-wrapper">
        <table className="modern-table">
          <thead>
            <tr>
              <th>OS</th>
              <th>Aberto em</th>
              <th>Solicitante / Setor</th>
              <th>Relato (Resumo)</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? [...Array(5)].map((_, i) => (
                  <tr key={i} className="skeleton-row">
                    <td colSpan="6">
                      <div className="skeleton-line"></div>
                    </td>
                  </tr>
                ))
              : chamados.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setChamadoSelecionado(item);
                      setMostrarDetalhes(true);
                    }}
                    className="row-hover-effect"
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>#{item.numeroOs}</strong>
                    </td>
                    <td>{formatarDataHora(item.criadoEm)}</td>
                    <td>
                      <strong>{item.nome}</strong>
                      <br />
                      <small
                        style={{
                          color: "#007bff",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                        }}
                      >
                        {item.setor || "Geral"}
                      </small>
                    </td>
                    <td style={{ fontSize: "0.85rem", color: "#666" }}>
                      {truncarTexto(item.descricao)}
                    </td>
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
                            {/* Botão Devolver na Tabela (Só aparece para o dono ou ADM) */}
                            {(item.tecnicoResponsavel === analistaNome ||
                              ehAdmin) && (
                              <button
                                onClick={() => handleDevolverChamado(item)}
                                className="btn-devolver"
                                title="Devolver para Fila"
                                style={{
                                  backgroundColor: "#6c757d",
                                  color: "white",
                                  border: "none",
                                  padding: "6px",
                                  borderRadius: "4px",
                                }}
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
                                  title="Pausar"
                                >
                                  <FiPauseCircle />
                                </button>
                                <button
                                  onClick={() => {
                                    setChamadoParaFinalizar(item);
                                    setMostrarModal(true);
                                  }}
                                  className="btn-finalizar-small"
                                  title="Finalizar"
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
                ))}
          </tbody>
        </table>
      </div>

      {/* MODAL BUSCA IMPRESSÃO */}
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
              <label>Número da OS (Ex: 2025-9218)</label>
              <input
                type="text"
                className="form-input"
                value={numeroOsBusca}
                onChange={(e) => setNumeroOsBusca(e.target.value)}
                required
                placeholder="Digite a OS..."
                autoFocus
              />
              <button
                type="submit"
                className="btn-salvar-modern"
                style={{ width: "100%" }}
              >
                <FiSearch style={{ marginRight: "8px" }} /> Buscar e Abrir
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
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
              {chamadoSelecionado?.status === "pendente" && (
                <div
                  className="alerta-pausa"
                  style={{
                    backgroundColor: "#fff3cd",
                    borderLeft: "5px solid #ffc107",
                    padding: "15px",
                    marginBottom: "20px",
                    borderRadius: "4px",
                    color: "#856404",
                  }}
                >
                  <strong style={{ display: "block", marginBottom: "5px" }}>
                    ⚠️ MOTIVO DA PENDÊNCIA:
                  </strong>
                  <p style={{ margin: 0, fontWeight: "500" }}>
                    {chamadoSelecionado?.motivoPausa ||
                      "Nenhum motivo detalhado."}
                  </p>
                  <small>
                    Pausado em:{" "}
                    {formatarDataHora(chamadoSelecionado?.pausadoEm)}
                  </small>
                </div>
              )}

              <div className="info-grid">
                <p>
                  <strong>Solicitante:</strong> {chamadoSelecionado?.nome}
                </p>
                <p>
                  <strong>Unidade:</strong> {chamadoSelecionado?.unidade}
                </p>
                <p>
                  <strong>Setor:</strong>{" "}
                  <span
                    style={{
                      textTransform: "uppercase",
                      color: "#007bff",
                      fontWeight: "bold",
                    }}
                  >
                    {chamadoSelecionado?.setor || "Não informado"}
                  </span>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={`status-badge ${chamadoSelecionado?.status}`}
                  >
                    {chamadoSelecionado?.status?.toUpperCase()}
                  </span>
                </p>
                <p>
                  <strong>Técnico:</strong>{" "}
                  {chamadoSelecionado?.tecnicoResponsavel || "Aguardando"}
                </p>
              </div>
              <hr />
              <h3>Descrição do Usuário</h3>
              <div
                className="descricao-box-full"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {chamadoSelecionado?.descricao}
              </div>
            </div>
            <div className="modal-footer-actions">
              <button
                onClick={() => setMostrarDetalhes(false)}
                className="btn-voltar"
              >
                Fechar
              </button>

              {/* Botão Devolver dentro do Modal (Só para dono ou ADM) */}
              {(chamadoSelecionado?.status === "em atendimento" ||
                chamadoSelecionado?.status === "pendente") &&
                (chamadoSelecionado?.tecnicoResponsavel === analistaNome ||
                  ehAdmin) && (
                  <button
                    onClick={() => handleDevolverChamado(chamadoSelecionado)}
                    className="btn-devolver-modal"
                    style={{
                      backgroundColor: "#6c757d",
                      color: "white",
                      border: "none",
                      padding: "10px 15px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FiArrowLeftCircle /> Devolver para Fila
                  </button>
                )}

              {chamadoSelecionado?.status === "pendente" && (
                <button
                  onClick={() => handleRetomarChamado(chamadoSelecionado)}
                  className="btn-retomar"
                >
                  <FiPlayCircle /> Retomar Agora
                </button>
              )}
              {chamadoSelecionado?.status === "em atendimento" && (
                <button
                  onClick={() => {
                    setMostrarDetalhes(false);
                    setChamadoParaFinalizar(chamadoSelecionado);
                    setMostrarModal(true);
                  }}
                  className="btn-finalizar-detalhe"
                >
                  Finalizar Agora
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENDÊNCIA */}
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
                placeholder="Descreva o motivo da pendência..."
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

      {/* MODAL FINALIZAR */}
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
