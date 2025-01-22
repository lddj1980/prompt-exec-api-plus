const pool = require('../config/database');

class ParametroRepository {
  static async insertParametro(promptId, nome, valor) {
    await pool.query(
      'INSERT INTO parametros (prompt_id, nome, valor) VALUES (?, ?, ?)',
      [promptId, nome, valor]
    );
  }

  static async getParametrosByPrompt(promptId) {
    const [rows] = await pool.query(
      'SELECT * FROM parametros WHERE prompt_id = ?',
      [promptId]
    );
    return rows;
  }
}

module.exports = ParametroRepository;
