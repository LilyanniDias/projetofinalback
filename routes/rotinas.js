const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/', async (req, res) => {
    console.log("--- DADOS RECEBIDOS DO FRONT ---");
    console.log(JSON.stringify(req.body, null, 2));

    const { userId, nome, etapas } = req.body;

    // Proteção 1: Verifica se os dados básicos existem
    if (!userId || !nome || !etapas) {
        return res.status(400).json({ message: "Dados incompletos (userId, nome ou etapas ausentes)." });
    }

    try {
        // 1. Inserir na tabela 'rotinas'
        const [resRotina] = await db.execute(
            'INSERT INTO rotinas (user_id, nome) VALUES (?, ?)',
            [userId, nome]
        );
        const rotinaId = resRotina.insertId;

        // 2. Percorrer as etapas (limpeza, tratamento, etc.)
        for (const nomeEtapa in etapas) {
            const ativosIds = etapas[nomeEtapa];

            // Proteção 2: Só insere se a etapa tiver ativos selecionados e o nome da etapa for válido
            if (Array.isArray(ativosIds) && ativosIds.length > 0 && nomeEtapa) {
                
                const [resEtapa] = await db.execute(
                    'INSERT INTO rotina_etapas (rotina_id, etapa) VALUES (?, ?)',
                    [rotinaId, String(nomeEtapa)] // Forçamos ser String para o MySQL não reclamar
                );
                const etapaId = resEtapa.insertId;

                // 3. Inserir os ativos
                for (const ativoId of ativosIds) {
                    if (ativoId) { // Só insere se o ID do ativo não for nulo
                        await db.execute(
                            'INSERT INTO rotina_etapa_ativos (etapa_id, asset_id) VALUES (?, ?)',
                            [etapaId, ativoId]
                        );
                    }
                }
            }
        }

        res.status(201).json({ message: '✨ Rotina salva com sucesso!' });

    } catch (err) {
        console.error('❌ ERRO NO BANCO:', err.sqlMessage || err.message);
        res.status(500).json({ message: 'Erro interno ao salvar.', detalhe: err.message });
    }
});

module.exports = router;