const express = require('express');
const router = express.Router();
const dbConnection = require('../database');

/**
 * 🔹 CRIAR ROTINA COMPLETA
 * POST /api/rotinas
 */
router.post('/', async (req, res) => {
  const { userId, nome, etapas } = req.body;

  console.log('📥 Dados recebidos:', req.body);

  if (!userId || !nome || !etapas) {
    return res.status(400).json({
      message: 'userId, nome e etapas são obrigatórios'
    });
  }

  const conn = await dbConnection.getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Cria a rotina
    const [rotinaResult] = await conn.execute(
      'INSERT INTO rotinas (user_id, nome) VALUES (?, ?)',
      [userId, nome]
    );

    const rotinaId = rotinaResult.insertId;

    // 2️⃣ Cria as etapas
    for (const etapaNome of Object.keys(etapas)) {
      const [etapaResult] = await conn.execute(
        'INSERT INTO rotina_etapas (rotina_id, etapa) VALUES (?, ?)',
        [rotinaId, etapaNome]
      );

      const rotinaEtapaId = etapaResult.insertId;

      // 3️⃣ Vincula os ativos (asset_id)
      for (const assetId of etapas[etapaNome]) {
        await conn.execute(
          'INSERT INTO rotina_etapa_ativos (etapa_id, asset_id) VALUES (?, ?)',
          [rotinaEtapaId, assetId]
        );
      }
    }

    await conn.commit();

    res.status(201).json({
      message: 'Rotina criada com sucesso',
      id: rotinaId
    });

  } catch (error) {
    await conn.rollback();
    console.error('❌ ERRO AO SALVAR ROTINA:', error);

    res.status(500).json({
      message: 'Erro ao salvar rotina',
      error: error.message
    });
  } finally {
    conn.release();
  }
});

/**
 * 🔹 LISTAR ROTINAS POR USUÁRIO (COM ETAPAS E ATIVOS)
 * GET /api/rotinas/:userId
 */
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rotinas] = await dbConnection.execute(
      'SELECT * FROM rotinas WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );

    for (const rotina of rotinas) {
      const [etapas] = await dbConnection.execute(
        'SELECT * FROM rotina_etapas WHERE rotina_id = ?',
        [rotina.id]
      );

      for (const etapa of etapas) {
        const [ativos] = await dbConnection.execute(
          `
          SELECT a.id, a.nome
          FROM rotina_etapa_ativos rea
          JOIN ativos a ON a.id = rea.asset_id
          WHERE rea.etapa_id = ?
          `,
          [etapa.id]
        );

        etapa.ativos = ativos;
      }

      rotina.etapas = etapas;
    }
    res.status(200).json(rotinas);

  } catch (error) {
    console.error('Erro ao buscar rotinas:', error);
    res.status(500).json({ message: 'Erro ao buscar rotinas' });
  }
});

/**
 * 🔹 REMOVER ROTINA
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await dbConnection.execute(
      'DELETE FROM rotinas WHERE id = ?',
      [id]
    );

    res.status(200).json({ message: 'Rotina removida com sucesso' });

  } catch (error) {
    console.error('Erro ao remover rotina:', error);
    res.status(500).json({ message: 'Erro ao remover rotina' });
  }
});

module.exports = router;
