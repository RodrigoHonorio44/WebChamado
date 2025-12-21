import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Footer = () => {
    const { userData } = useAuth();
    const anoAtual = new Date().getFullYear();

    return (
        <footer style={{
            marginTop: 'auto',
            padding: '20px 0',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            width: '100%'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto',
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    fontSize: '0.85rem',
                    color: '#64748b'
                }}>
                    <span><strong>Suporte TI</strong> v1.0.4</span>
                    <span style={{ color: '#e2e8f0' }}>|</span>
                    <span>© {anoAtual} Todos os direitos reservados</span>
                </div>

                {userData && (
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        backgroundColor: '#f8fafc',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        border: '1px solid #f1f5f9'
                    }}>
                        Logado como: <strong>{userData.nome}</strong> ({userData.role?.toUpperCase()})
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px' }}>
                    <a href="#ajuda" style={linkStyle}>Central de Ajuda</a>
                    <a href="#termos" style={linkStyle}>Termos de Uso</a>
                </div>
            </div>
        </footer>
    );
};

const linkStyle = {
    fontSize: '0.8rem',
    color: '#6366f1',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s'
};

export default Footer;