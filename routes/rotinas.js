const express = require('express');
const router = express.Router();
const db = require('../database');

const etapasObrigatorias = ['limpeza','tratamento','hidratacao','protecao'];

router.post('/', async (req, res) => {
    const { userId, nome, etapas } = req.body;

    // 🔒 valida etapas obrigatórias
    for (let e of etapasObrigatorias) {
        if (!etapas[e] || etapas[e].length === 0) {
            return res.status(400).json({ message: `Etapa ${e} é obrigatória.` });
        }
        if (etapas[e].length > 5) {
            return res.status(400).json({ message: `Máx. 5 ativos na etapa ${e}.` });
        }
    }

    // 🔥 valida incompatibilidades
    const ativosSelecionados = Object.values(etapas).flat();

    const [incomp] = await db.execute(
        `SELECT * FROM incompatibilidades_ativos 
         WHERE (ativo_id_1 IN (?) AND ativo_id_2 IN (?)) 
            OR (ativo_id_2 IN (?) AND ativo_id_1 IN (?))`,
        [ativosSelecionados, ativosSelecionados, ativosSelecionados, ativosSelecionados]
    );

    if (incomp.length > 0) {
        return res.status(409).json({
            message: 'Existem ativos incompatíveis na rotina.',
            detalhes: incomp
        });
    }

    try {
        const [rotina] = await db.execute(
            'INSERT INTO rotinas (user_id, nome) VALUES (?, ?)',
            [userId, nome]
        );

        const rotinaId = rotina.insertId;

        for (const etapaNome of etapasObrigatorias) {
            const [etapa] = await db.execute(
                'INSERT INTO rotina_etapas (rotina_id, etapa) VALUES (?, ?)',
                [rotinaId, etapaNome]
            );

            etapas[etapaNome].forEach(async (assetId, index) => {
                await db.execute(
                    `INSERT INTO rotina_etapa_ativos (etapa_id, asset_id, ordem)
                     VALUES (?, ?, ?)`,
                    [etapa.insertId, assetId, index + 1]
                );
            });
        }

        res.status(201).json({ message: 'Rotina salva com sucesso!' });

    } catch (err) {
        res.status(500).json({ message: 'Erro ao salvar rotina.' });
    }
});

router.get('/:userId', async (req, res) => {
    const [rotinas] = await db.execute(
        'SELECT * FROM rotinas WHERE user_id = ?',
        [req.params.userId]
    );
    res.json(rotinas);
});

router.delete('/:rotinaId', async (req, res) => {
    const [r] = await db.execute(
        'DELETE FROM rotinas WHERE id = ?',
        [req.params.rotinaId]
    );

    if (r.affectedRows === 0) {
        return res.status(404).json({ message: 'Rotina não encontrada.' });
    }

    res.json({ message: 'Rotina removida.' });
});

module.exports = router;
