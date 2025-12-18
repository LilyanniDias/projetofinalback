// Onde: pelenativa-backend/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 

const app = express();
const port = 3000;
const saltRounds = 10;

const dbConnection = require('./database');

// --- 2. MIDDLEWARES ---
app.use(cors({
    origin: 'http://localhost:4200' 
})); 
app.use(express.json()); 


// --- 3. ROTA DE CADASTRO/REGISTRO (/api/auth/register) ---

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


// --- 4. ROTA DE LOGIN (/api/auth/login) ---

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


// --- 5. ROTA PARA BUSCAR ATIVOS (/api/ativos) ---

app.get('/api/ativos', async (req, res) => {
    try {
        // 🚨 CORREÇÃO APLICADA: Nome da tabela agora é 'ativos_skincare'
        const nomeDaTabela = 'ativos_skincare'; 
        
        const [rows] = await dbConnection.execute(`SELECT * FROM ${nomeDaTabela}`); 
        
        res.status(200).json(rows);

    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
             return res.status(500).json({ 
                message: `Erro: A tabela "${error.sqlMessage.match(/'(.*?)'/)?.[1] || 'desconhecida'}" não existe no banco de dados.`,
                hint: 'Verifique o nome da tabela na rota /api/ativos do server.js'
            });
        }
        console.error('Erro ao buscar ativos:', error);
        res.status(500).json({ message: 'Erro interno ao buscar ativos.' });
    }
});


// --- 6. INICIALIZA O SERVIDOR ---
app.listen(port, () => {
    console.log(`Servidor de Backend rodando em http://localhost:${port}`);
});app.use('/api/favorites', require('./routes/favorites'));
