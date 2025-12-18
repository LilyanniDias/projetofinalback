const express = require('express');
const router = express.Router();
const db = require('../database'); // Assumindo que você tem um arquivo database.js para conexão

// Rota para obter todos os favoritos de um usuário específico
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.execute(
            'SELECT a.* FROM ativos_skincare a JOIN favoritos f ON a.id = f.asset_id WHERE f.user_id = ?',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        res.status(500).json({ message: 'Erro interno ao buscar favoritos.' });
    }
});

// Rota para adicionar um favorito
router.post('/', async (req, res) => {
    const { userId, assetId } = req.body;
    try {
        // Verifica se o favorito já existe
        const [existing] = await db.execute(
            'SELECT * FROM favoritos WHERE user_id = ? AND asset_id = ?',
            [userId, assetId]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Este item já está nos favoritos.' });
        }

        // Insere o novo favorito
        const [result] = await db.execute(
            'INSERT INTO favoritos (user_id, asset_id) VALUES (?, ?)',
            [userId, assetId]
        );
        res.status(201).json({ message: 'Favorito adicionado com sucesso.', favoriteId: result.insertId });
    } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        res.status(500).json({ message: 'Erro interno ao adicionar favorito.' });
    }
});

// Rota para remover um favorito
router.delete('/:userId/:assetId', async (req, res) => {
    const { userId, assetId } = req.params;
    try {
        const [result] = await db.execute(
            'DELETE FROM favoritos WHERE user_id = ? AND asset_id = ?',
            [userId, assetId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Favorito não encontrado.' });
        }
        res.json({ message: 'Favorito removido com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        res.status(500).json({ message: 'Erro interno ao remover favorito.' });
    }
});

module.exports = router;
