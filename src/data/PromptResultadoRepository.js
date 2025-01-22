const pool = require('../config/database');

class PromptResultadoRepository {
  static async insertPromptResultado(solicitacaoId, promptId, resultado) {
    await pool.query(
      'INSERT INTO prompts_resultados (solicitacao_id, prompt_id, resultado) VALUES (?, ?, ?)',
      [solicitacaoId, promptId, resultado]
    );
  }

  static async getUltimoPromptResultado(solicitacaoId) {
    const [rows] = await pool.query(
      `
      SELECT * 
      FROM prompts_resultados 
      WHERE solicitacao_id = ? 
      ORDER BY data_execucao DESC 
      LIMIT 1
      `,
      [solicitacaoId]
    );
    return rows[0] || null;
  }

  static async getResultadosBySolicitacao(solicitacaoId) {
    const [rows] = await pool.query(
      'SELECT resultado FROM prompts_resultados WHERE solicitacao_id = ?',
      [solicitacaoId]
    );
    return rows;
  }
}

module.exports = PromptResultadoRepository;
