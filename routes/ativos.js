const express = require('express');
const router = express.Router();
const db = require('../database'); // <--- ADICIONE ESTA LINHA QUE ESTAVA FALTANDO

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        a.id,
        a.nome,
        f.nome AS funcao
      FROM ativos a
      JOIN funcoes_cosmeticas f ON f.id = a.funcao_cosmetica_id
      ORDER BY f.nome
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao listar ativos:", error);
    res.status(500).send("Erro no banco.");
  }
});

module.exports = router;