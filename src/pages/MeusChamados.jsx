import React, { useEffect, useState } from "react";
import { db, auth } from "../api/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import {
  FiEye,
  FiX,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
} from "react-icons/fi";
import "../styles/MeusChamados.css";

const MeusChamados = () => {
  const [chamados, setChamados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    const buscarChamados = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "chamados"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const listaChamados = [];

        querySnapshot.forEach((doc) => {
          listaChamados.push({ id: doc.id, ...doc.data() });
        });

        listaChamados.sort((a, b) => {
          const dataA = a.criadoEm?.seconds || 0;
          const dataB = b.criadoEm?.seconds || 0;
          return dataB - dataA;
        });

        setChamados(listaChamados);
      } catch (error) {
        console.error("Erro ao buscar chamados:", error);
      } finally {
        setLoading(false);
      }
    };

    buscarChamados();
  }, [user]);

  // Função auxiliar para formatar datas com segurança
  const formatarData = (timestamp) => {
    if (!timestamp) return null;
    return timestamp.toDate().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const abrirModal = (chamado) => {
    setChamadoSelecionado(chamado);
    setModalAberto(true);
  };

  return (
    <div className="meus-chamados-container">
      <header className="page-header">
        <h1>Meus Chamados</h1>
        <Link to="/" className="back-link">
          Voltar para Início
        </Link>
      </header>

      {loading ? (
        <div className="loading-container">
          <p className="loading-text">Carregando seus chamados...</p>
        </div>
      ) : chamados.length === 0 ? (
        <div className="no-data">
          <p>Nenhum chamado encontrado.</p>
          <Link to="/abrir-chamado" className="btn-abrir">
            Abrir Novo Chamado
          </Link>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="chamados-table">
            <thead>
              <tr>
                <th>Nº OS</th>
                <th>Solicitante</th>
                <th>Unidade</th>
                <th>Status</th>
                <th>Data/Hora</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {chamados.map((item) => (
                <tr key={item.id} className="linha-clicavel">
                  <td data-label="Nº OS" className="os-cell">
                    <strong>#{item.numeroOs || "S/N"}</strong>
                  </td>
                  <td data-label="Solicitante">
                    <div className="user-info-cell">
                      <span className="user-name">
                        {item.nome || "Usuário"}
                      </span>
                      <span className="user-cargo-label">
                        {item.cargo || "Funcionário"}
                      </span>
                    </div>
                  </td>
                  <td data-label="Unidade">{item.unidade || "N/A"}</td>
                  <td data-label="Status">
                    <span
                      className={`status-badge ${
                        item.status?.toLowerCase() || "aberto"
                      }`}
                    >
                      {item.status?.toUpperCase() || "PENDENTE"}
                    </span>
                  </td>
                  <td data-label="Data/Hora" className="data-hora-cell">
                    {item.criadoEm
                      ? item.criadoEm.toDate().toLocaleDateString("pt-BR")
                      : "--/--"}
                  </td>
                  <td data-label="Ação">
                    <button
                      className="btn-view-chamado"
                      onClick={() => abrirModal(item)}
                    >
                      <FiEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE DETALHES ATUALIZADO COM DATAS DE PAUSA/INÍCIO */}
      {modalAberto && chamadoSelecionado && (
        <div className="modal-overlay" onClick={() => setModalAberto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chamado #{chamadoSelecionado.numeroOs}</h2>
              <button
                className="close-btn"
                onClick={() => setModalAberto(false)}
              >
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* ALERTA DE PENDÊNCIA (MOSTRA MOTIVO + DATA DA PAUSA) */}
              {chamadoSelecionado.status?.toLowerCase() === "pendente" && (
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
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    <FiAlertCircle size={20} />
                    <strong style={{ fontSize: "1.1rem" }}>
                      SLA PAUSADO PELO TÉCNICO
                    </strong>
                  </div>
                  <p style={{ margin: "10px 0 5px 0" }}>
                    <strong>Justificativa:</strong>{" "}
                    {chamadoSelecionado.motivoPausa || "Aguardando retorno."}
                  </p>
                  {chamadoSelecionado.pausadoEm && (
                    <small
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        opacity: 0.9,
                      }}
                    >
                      <FiClock size={12} /> Pausado em:{" "}
                      {formatarData(chamadoSelecionado.pausadoEm)}
                    </small>
                  )}
                </div>
              )}

              {/* FEEDBACK DE FINALIZAÇÃO */}
              {(chamadoSelecionado.status?.toLowerCase() === "fechado" ||
                chamadoSelecionado.status?.toLowerCase() === "concluido") && (
                <div
                  className="concluido-feedback"
                  style={{
                    backgroundColor: "#d4edda",
                    borderLeft: "5px solid #28a745",
                    padding: "15px",
                    marginBottom: "20px",
                    borderRadius: "4px",
                    color: "#155724",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "5px",
                    }}
                  >
                    <FiCheckCircle size={20} />
                    <strong style={{ fontSize: "1.1rem" }}>
                      CHAMADO FINALIZADO
                    </strong>
                  </div>
                  <div style={{ marginTop: "10px" }}>
                    <strong>Parecer Técnico:</strong>
                    <p style={{ margin: "5px 0 10px 0", lineHeight: "1.4" }}>
                      {chamadoSelecionado.feedbackAnalista ||
                        "Nenhum parecer informado."}
                    </p>
                    <small style={{ opacity: 0.9 }}>
                      Finalizado em:{" "}
                      {formatarData(chamadoSelecionado.finalizadoEm)}
                    </small>
                  </div>
                </div>
              )}

              {/* GRID DE INFORMAÇÕES GERAIS COM NOVAS DATAS */}
              <div className="info-grid-user">
                <div className="info-item">
                  <strong>Status:</strong>{" "}
                  {chamadoSelecionado.status?.toUpperCase()}
                </div>
                <div className="info-item">
                  <strong>Iniciado em:</strong>{" "}
                  {formatarData(chamadoSelecionado.iniciadoEm) || "Aguardando"}
                </div>
                {chamadoSelecionado.retomadoEm && (
                  <div className="info-item">
                    <strong>Última Retomada:</strong>{" "}
                    {formatarData(chamadoSelecionado.retomadoEm)}
                  </div>
                )}
                <div className="info-item">
                  <strong>Técnico:</strong>{" "}
                  {chamadoSelecionado.tecnicoResponsavel || "Em fila"}
                </div>
                <div className="info-item">
                  <strong>Unidade:</strong> {chamadoSelecionado.unidade}
                </div>
                <div className="info-item">
                  <strong>Setor:</strong>{" "}
                  <span style={{ textTransform: "uppercase" }}>
                    {chamadoSelecionado.setor}
                  </span>
                </div>
              </div>

              {/* DESCRIÇÃO ORIGINAL */}
              <div
                className="detalhe-box"
                style={{
                  marginTop: "20px",
                  borderTop: "1px solid #eee",
                  paddingTop: "15px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    marginBottom: "10px",
                    color: "#555",
                  }}
                >
                  Descrição Original:
                </h3>
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#333",
                    backgroundColor: "#f9f9f9",
                    padding: "15px",
                    borderRadius: "8px",
                  }}
                >
                  {chamadoSelecionado.descricao}
                </p>
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                padding: "15px",
                borderTop: "1px solid #eee",
                textAlign: "right",
              }}
            >
              <button
                className="btn-voltar"
                onClick={() => setModalAberto(false)}
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeusChamados;
