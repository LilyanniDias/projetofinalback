router.get('/', async (req, res) => {
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
});
