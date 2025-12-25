import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import '../styles/InfoPages.css';

const Termos = () => {
    const navigate = useNavigate();

    return (
        <div className="info-page-container">
            <button className="btn-voltar-info" onClick={() => navigate(-1)}>
                <FiArrowLeft /> Voltar
            </button>

            <div className="info-card">
                <h1>Termos de Uso</h1>
                <p>Última atualização: Janeiro de 2025</p>

                <h2>1. Licença de Uso</h2>
                <p>Ao adquirir o HelpDesk Pro, o cliente recebe uma licença de uso pessoal e intransferível. O código-fonte e a propriedade intelectual pertencem exclusivamente ao desenvolvedor.</p>

                <h2>2. Responsabilidade pelos Dados</h2>
                <p>O cliente é o único responsável pelas informações inseridas no sistema. O desenvolvedor não se responsabiliza por dados de terceiros inseridos indevidamente ou perda de informações por mau uso das credenciais de acesso.</p>

                <h2>3. Disponibilidade do Serviço</h2>
                <p>Esforçamo-nos para manter o sistema online 24/7. No entanto, por depender de infraestrutura de terceiros (Google Firebase), não garantimos 100% de disponibilidade em caso de falhas globais nestes servidores.</p>

                <h2>4. Privacidade (LGPD)</h2>
                <p>Os dados são encriptados e armazenados de forma segura. Não partilhamos, vendemos ou utilizamos dados dos clientes para fins publicitários.</p>

                <h2>5. Cancelamento</h2>
                <p>O não pagamento da subscrição resultará na suspensão temporária do acesso até à regularização da conta.</p>
            </div>
        </div>
    );
};

export default Termos;