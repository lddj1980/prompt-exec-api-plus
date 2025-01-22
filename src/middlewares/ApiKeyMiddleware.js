const pool = require('../config/database');////

module.exports = async (req, res, next) => {//
  const apiKey = req.headers['x-api-key'] ? req.headers['x-api-key'] : req.headers['api_key'];

  if (!apiKey) {
    return res.status(400).json({ error: 'API Key is missing.' });
  }

  const [rows] = await pool.query('SELECT * FROM api_keys WHERE api_key = ? and ativo = 1', [apiKey]);
  if (!rows.length) {
    return res.status(403).json({ error: 'Invalid API Key.' });
  }

  next();
};
