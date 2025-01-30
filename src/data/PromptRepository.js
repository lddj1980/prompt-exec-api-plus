const pool = require('../config/database');

class PromptRepository {
  /**
   * Insere um novo prompt no banco de dados.
   * @param {number} solicitacaoId - ID da solicitação associada.
   * @param {string} prompt - Conteúdo do prompt.
   * @param {string} engine - Engine associada ao prompt.
   * @param {string} modelo - Modelo associado ao prompt.
   * @param {number} ordem - Ordem do prompt.
   * @param {object|null} parametrosModelo - Parâmetros do modelo em formato JSON (opcional).
   * @returns {number} - ID do prompt inserido.
   */
  static async insertPrompt(solicitacaoId, prompt, engine, model, ordem, model_parameters, ignorePlaceholders) {
    // Definir a consulta SQL dependendo da presença de `parametrosModelo`
    const sql = model_parameters
      ? 'INSERT INTO prompts (solicitacao_id, prompt, engine, modelo, ordem, parametros_modelo,ignorePlaceholders) VALUES (?, ?, ?, ?, ?, ?,?)'
      : 'INSERT INTO prompts (solicitacao_id, prompt, engine, modelo, ordem, ignorePlaceholders) VALUES (?, ?, ?, ?, ?,?)';

    // Definir os valores a serem usados na consulta
    const values = model_parameters
      ? [solicitacaoId, prompt, engine, model, ordem, JSON.stringify(model_parameters),JSON.stringify(ignorePlaceholders)]
      : [solicitacaoId, prompt, engine, model, ordem,JSON.stringify(ignorePlaceholders)];

    // Executar a consulta
    const [result] = await pool.query(sql, values);
    return result.insertId;
  }

  /**
   * Obtém os prompts associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de prompts associados.
   */
  static async getPromptsBySolicitacaoNoResult(solicitacaoId) {
    const [rows] = await pool.query(
      `SELECT p.*,pr.resultado FROM prompts p LEFT JOIN prompts_resultados pr ON p.id = pr.prompt_id WHERE p.solicitacao_id = ? and pr.prompt_id is null ORDER BY ordem ASC`,
      [solicitacaoId]
    );
    return rows;
  }

  /**
   * Obtém os prompts associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de prompts associados.
   */
  static async getPromptsBySolicitacaoNoResultOrFailure(solicitacaoId) {
    const [rows] = await pool.query(
      `SELECT p.ordem, MIN(p.id) as id, MIN(p.solicitacao_id) as solicitacao_id, MIN(p.prompt) as prompt, MIN(p.engine) as engine, MIN(p.modelo) as modelo, MIN(p.data_criacao) as data_criacao, MIN(p.parametros_modelo) as parametros_modelo, MIN(pr.resultado) as t FROM prompts p LEFT JOIN prompts_resultados pr ON p.id = pr.prompt_id WHERE p.solicitacao_id = ? AND (pr.resultado IS NULL OR (pr.resultado LIKE '%"success": false%' AND NOT EXISTS (SELECT 1 FROM prompts_resultados pr2 WHERE pr2.prompt_id = p.id AND pr2.resultado LIKE '%"success": true%'))) GROUP BY p.ordem ORDER BY p.ordem ASC;`,
      [solicitacaoId]
    );
    return rows;
  }
  
  /**
   * Obtém os prompts associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de prompts associados.
   */
  static async getPromptsBySolicitacaoSuccess(solicitacaoId) {
    const [rows] = await pool.query(
      `SELECT p.*, pr.resultado FROM prompts p LEFT JOIN prompts_resultados pr ON p.id = pr.prompt_id WHERE p.solicitacao_id = ? AND (pr.resultado LIKE '%"success": true%') ORDER BY p.ordem ASC;`,
      [solicitacaoId]
    );
    return rows;
  }

  /**
   * Obtém os prompts associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de prompts associados.
   */
  static async getPromptsBySolicitacao(solicitacaoId) {
    const [rows] = await pool.query(
      'SELECT p.* FROM prompts p WHERE p.solicitacao_id = ? ORDER BY ordem ASC',
      [solicitacaoId]
    );
    return rows;
  }
  
   /**
   * Obtém os prompts associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de prompts associados.
   */
  static async getPromptsBySolicitacaoWithResult(solicitacaoId) {
    const [rows] = await pool.query(
      'SELECT p.*,pr.resultado FROM prompts p LEFT JOIN prompts_resultados pr ON p.id = pr.prompt_id WHERE p.solicitacao_id = ? and pr.prompt_id is not null ORDER BY ordem ASC',
      [solicitacaoId]
    );
    return rows;
  }
  
}

module.exports = PromptRepository;
