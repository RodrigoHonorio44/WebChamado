import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AiOutlineHome,
  AiOutlineSend,
  AiOutlineArrowLeft,
} from "react-icons/ai";
import {
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiLayers,
  FiAlertCircle,
} from "react-icons/fi";
import "../styles/AbrirChamado.css";

// --- IMPORTAÇÕES DO FIREBASE ---
import { db, auth } from "../api/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

const UNIDADES = [
  "Hospital Conde",
  "Upa Inoã",
  "Upa Santa Rita",
  "Samu Barroco",
  "Samu Ponta Negra",
  "Samu Centro",
];

const AbrirChamado = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    cargo: "",
    unidade: UNIDADES[0],
    setor: "",
    descricao: "",
    prioridade: "média",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const nomeAuth = user.displayName || "";
        try {
          const userRef = doc(db, "usuarios", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const dadosDoBanco = userSnap.data();
            setFormData((prev) => ({
              ...prev,
              nome: nomeAuth,
              cargo: dadosDoBanco.cargo || "",
            }));
          } else {
            setFormData((prev) => ({ ...prev, nome: nomeAuth }));
          }
        } catch (err) {
          console.error("Erro ao buscar cargo:", err);
          setFormData((prev) => ({ ...prev, nome: nomeAuth }));
        }
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const user = auth.currentUser;
    if (!user) {
      setError("Você precisa estar logado para abrir um chamado.");
      setIsLoading(false);
      return;
    }

    try {
      const chamadosRef = collection(db, "chamados");
      const anoAtual = new Date().getFullYear();
      const aleatorio = Math.floor(1000 + Math.random() * 9000);
      const novaOs = `${anoAtual}-${aleatorio}`;

      await addDoc(chamadosRef, {
        numeroOs: novaOs,
        userId: user.uid,
        emailSolicitante: user.email,
        nome: formData.nome,
        cargo: formData.cargo,
        unidade: formData.unidade,
        setor: formData.setor,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        status: "aberto",
        criadoEm: serverTimestamp(),
      });

      setIsSubmitted(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (err) {
      setError("Erro ao registrar chamado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chamado-page">
      {/* Barra de Navegação Superior */}
      <div className="chamado-nav">
        <button onClick={() => navigate("/")} className="btn-back-home">
          <AiOutlineArrowLeft /> Voltar ao Início
        </button>
        <div className="nav-logo">Rodhon System</div>
      </div>

      <div className="chamado-container-card">
        <header className="chamado-header">
          <div className="icon-circle">
            <AiOutlineSend size={24} color="#fff" />
          </div>
          <h2>Abrir Novo Chamado</h2>
          <p>Descreva o problema técnico para que nossa equipe possa ajudar.</p>
        </header>

        {isSubmitted && (
          <div className="alert-success animate-pop">
            ✅ Chamado registrado com sucesso! Redirecionando...
          </div>
        )}

        {error && <div className="alert-error">❌ {error}</div>}

        <form onSubmit={handleSubmit} className="chamado-form-grid">
          <div className="form-section">
            <h4>
              <FiUser /> Identificação
            </h4>
            <div className="grid-2-col">
              <div className="form-input-wrapper">
                <label>Nome do Solicitante</label>
                <input
                  type="text"
                  value={formData.nome}
                  readOnly
                  className="input-locked"
                />
              </div>
              <div className="form-input-wrapper">
                <label>Cargo</label>
                <input
                  type="text"
                  value={formData.cargo}
                  readOnly
                  className="input-locked"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>
              <FiMapPin /> Localização e Urgência
            </h4>
            <div className="grid-2-col">
              <div className="form-input-wrapper">
                <label>Unidade</label>
                <select
                  name="unidade"
                  value={formData.unidade}
                  onChange={handleChange}
                  required
                >
                  {UNIDADES.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-input-wrapper">
                <label>Prioridade</label>
                <select
                  name="prioridade"
                  value={formData.prioridade}
                  onChange={handleChange}
                  className={`select-priority ${formData.prioridade}`}
                >
                  <option value="baixa">🟢 Baixa</option>
                  <option value="média">🟡 Média</option>
                  <option value="alta">🔴 Alta</option>
                </select>
              </div>
            </div>
            <div className="form-input-wrapper full-width">
              <label>
                <FiLayers /> Setor
              </label>
              <input
                type="text"
                name="setor"
                value={formData.setor}
                onChange={handleChange}
                required
                placeholder="Ex: Farmácia, TI, Recepção..."
              />
            </div>
          </div>

          <div className="form-section">
            <h4>
              <FiAlertCircle /> Detalhes do Problema
            </h4>
            <div className="form-input-wrapper full-width">
              <label>Descrição Detalhada</label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                required
                placeholder="Descreva o que está acontecendo (Ex: Impressora não liga, erro no sistema...)"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-chamado"
            disabled={isLoading || isSubmitted}
          >
            {isLoading ? "Enviando..." : "Enviar Chamado"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AbrirChamado;
