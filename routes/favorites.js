const express = require('express');
const router = express.Router();
const dbConnection = require('../database');

/**
 * ⭐ ADICIONAR FAVORITO
 * POST /api/favorites
 */
router.post('/', async (req, res) => {
  const { userId, assetId } = req.body;

  if (!userId || !assetId) {
    return res.status(400).json({
      message: 'userId e assetId são obrigatórios'
    });
  }

  try {
    await dbConnection.execute(
      'INSERT INTO favoritos (user_id, asset_id) VALUES (?, ?)',
      [userId, assetId]
    );

    res.status(201).json({ message: 'Favorito adicionado com sucesso' });

  } catch (error) {
    console.error('Erro ao favoritar:', error);
    res.status(500).json({ message: 'Erro ao favoritar' });
  }
});

/**
 * ⭐ LISTAR FAVORITOS DO USUÁRIO
 * GET /api/favorites/:userId
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [favoritos] = await dbConnection.execute(
      `
      SELECT a.*
      FROM ativos a
      JOIN favoritos f ON a.id = f.asset_id
      WHERE f.user_id = ?
      `,
      [userId]
    );

    res.status(200).json(favoritos);

  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({ message: 'Erro ao buscar favoritos' });
  }
});

/**
 * ⭐ REMOVER FAVORITO
 * DELETE /api/favorites/:userId/:assetId
 */
router.delete('/:userId/:assetId', async (req, res) => {
  const { userId, assetId } = req.params;

  try {
    await dbConnection.execute(
      'DELETE FROM favoritos WHERE user_id = ? AND asset_id = ?',
      [userId, assetId]
    );

    res.status(200).json({ message: 'Favorito removido com sucesso' });

  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ message: 'Erro ao remover favorito' });
  }
});

module.exports = router;
