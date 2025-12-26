import React from 'react';
import { Link } from 'react-router-dom'; // Importação essencial para navegação React
import { FiLifeBuoy, FiFileText, FiLinkedin, FiExternalLink } from 'react-icons/fi';
import '../styles/Footer.css';

const Footer = () => {
    const linkedinURL = "https://www.linkedin.com/in/rodrigo-s-hon%C3%B3rio/";

    return (
        <footer className="footer-modern">
            <div className="footer-content">
                {/* Lado Esquerdo: Marca do Software */}
                <div className="footer-brand-area">
                    <div className="brand-logo">
                        <span className="brand-name">HelpDesk Pro</span>
                        <span className="version-tag">v1.0.4</span>
                    </div>
                    <p className="copyright">© 2025 Todos os direitos reservados</p>
                </div>

                {/* Centro: Links de Suporte (Corrigidos para React Router) */}
                <nav className="footer-nav">
                    {/* Usamos 'Link to' em vez de 'a href' para links internos */}
                    <Link to="/ajuda" className="footer-link">
                        <FiLifeBuoy /> Suporte
                    </Link>
                    <Link to="/termos" className="footer-link">
                        <FiFileText /> Termos
                    </Link>
                </nav>

                {/* Lado Direito: Sua Assinatura Rodhon System */}
                <div className="developer-signature">
                    <span>Desenvolvido por</span>
                    <a
                        href={linkedinURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dev-link"
                    >
                        <FiLinkedin className="icon-linkedin" />
                        Rodhon System
                        <FiExternalLink className="icon-external" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;