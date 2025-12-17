// src/api/firebase.js

// 1. Importa a função de inicialização do SDK principal
import { initializeApp } from "firebase/app";

// 2. Importa os SDKs dos serviços que você vai usar
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage'; // Exemplo para Storage

// Sua configuração (mantida aqui para referência, mas idealmente em .env)
const firebaseConfig = {
    apiKey: "AIzaSyBRQCGj_7KHKyW5zjJOgSCAnlNqj93GVw0",
    authDomain: "webchamados-d3d49.firebaseapp.com",
    projectId: "webchamados-d3d49",
    storageBucket: "webchamados-d3d49.firebasestorage.app",
    messagingSenderId: "134652632772",
    appId: "1:134652632772:web:54e21787e49269ec8c7391"
};

// 3. Inicializa o Firebase App
const app = initializeApp(firebaseConfig);

// 4. Inicializa e Exporta as Instâncias dos Serviços
// Use a instância 'app' para obter a instância de cada serviço
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); 

// Opcional: exporta o app
export default app;