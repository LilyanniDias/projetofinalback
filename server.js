// Onde: pelenativa-backend/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 

const app = express();
const port = 3000;
const saltRounds = 10;

const dbConnection = require('./database');

// --- 1. CONFIGURAÇÕES GLOBAIS DE ERRO (NOVO) ---
process.on('uncaughtException', (err) => {
    console.error('❌ ERRO CRÍTICO NO PROCESSO NODE:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ PROMESSA NÃO TRATADA EM:', promise, 'MOTIVO:', reason);
});

// --- 2. MIDDLEWARES ---
app.use(cors({
    origin: 'http://localhost:4200' 
})); 
app.use(express.json()); 

// Middleware de Log de Requisições
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
    next();
});

// --- 3. ROTAS DE AUTENTICAÇÃO ---
// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(senha, saltRounds);
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        const [result] = await dbConnection.execute(sql, [nome, email, hashedPassword]);

        res.status(201).json({ 
            message: 'Usuário cadastrado com sucesso! Prossiga para o login.', 
            userId: result.insertId 
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este e-mail já está em uso.' });
        }
        
        console.error('Erro fatal ao inserir usuário:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao cadastrar.' });
    }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }

    try {
        const [rows] = await dbConnection.execute(
            'SELECT id, nome, email, senha FROM usuarios WHERE email = ?', 
            [email]
        );
        
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); 
        }

        const passwordMatch = await bcrypt.compare(senha, user.senha);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const userResponse = { id: user.id, nome: user.nome, email: user.email };
        
        res.status(200).json({
            user: userResponse,
            token: 'mock-token-login-sucesso-' + user.id 
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// --- 4. ROTA PARA BUSCAR ATIVOS ---
app.get('/api/ativos', async (req, res) => {
    try {
        // Exemplo mínimo, substitua pelo seu código real de ativos
        const [ativos] = await dbConnection.execute('SELECT * FROM ativos');
        res.status(200).json(ativos);
    } catch (error) {
        console.error('Erro ao buscar ativos:', error);
        res.status(500).json({ message: 'Erro interno ao buscar ativos.' });
    }
});

// --- 5. ROTAS EXTERNAS ---
app.use('/api/rotinas', require('./routes/rotinas'));
app.use('/api/favorites', require('./routes/favorites'));

// --- 6. TRATAMENTO FINAL DE ERRO ---
app.use((err, req, res, next) => {
    console.error('🔥 ERRO NO SERVIDOR:', err.stack);
    res.status(500).send({ message: 'Erro interno.', error: err.message });
});

// --- 7. INICIALIZAÇÃO DO SERVIDOR ---
app.listen(port, () => {
    console.log(`\n================================================`);
    console.log(`🚀 Servidor rodando em http://localhost:${port}`);
    console.log(`📅 Iniciado em: ${new Date().toLocaleString()}`);
    console.log(`================================================\n`);
});
