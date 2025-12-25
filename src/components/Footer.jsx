import React from 'react';
import { FiLifeBuoy, FiFileText, FiLinkedin, FiExternalLink } from 'react-icons/fi';
import '../styles/Footer.css';

const Footer = () => {
    // Substitua pelo seu link de perfil público
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

                {/* Centro: Links de Suporte */}
                <nav className="footer-nav">
                    <a href="/ajuda" className="footer-link"><FiLifeBuoy /> Suporte</a>
                    <a href="/termos" className="footer-link"><FiFileText /> Termos</a>
                </nav>

                {/* Lado Direito: Sua Assinatura com link para LinkedIn */}
                <div className="developer-signature">
                    <span>Desenvolvido por</span>
                    <a
                        href={linkedinURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="dev-link"
                    >
                        <FiLinkedin className="icon-linkedin" />
                        Rodhon Systems
                        <FiExternalLink className="icon-external" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;