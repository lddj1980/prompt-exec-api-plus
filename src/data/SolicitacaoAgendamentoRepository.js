const pool = require('../config/database');

class SolicitacaoAgendamentoRepository {
  /**
   * Insere um novo agendamento no banco de dados.
   * @param {number} solicitacaoId - ID da solicitação associada.
   * @param {string} cronExpression - Expressão cron do agendamento.
   * @param {Date|null} dataInicioValidade - Data de início da validade (opcional).
   * @param {Date|null} dataFimValidade - Data de fim da validade (opcional).
   * @returns {number} - ID do agendamento inserido.
   */
  static async insertAgendamento(solicitacaoId, cronExpression, dataInicioValidade = null, dataFimValidade = null) {
    const sql = `
      INSERT INTO solicitacao_agendamentos (solicitacao_id, cron_expression, data_inicio_validade, data_fim_validade)
      VALUES (?, ?, ?, ?)
    `;
    const values = [solicitacaoId, cronExpression, dataInicioValidade, dataFimValidade];
    const [result] = await pool.query(sql, values);
    return result.insertId;
  }

  /**
   * Obtém os agendamentos associados a uma solicitação.
   * @param {number} solicitacaoId - ID da solicitação.
   * @returns {Array<object>} - Lista de agendamentos associados.
   */
  static async getAgendamentosBySolicitacao(solicitacaoId) {
    const sql = `
      SELECT * FROM solicitacao_agendamentos
      WHERE solicitacao_id = ?
      ORDER BY data_criacao ASC
    `;
    const [rows] = await pool.query(sql, [solicitacaoId]);
    return rows;
  }

  /**
   * Atualiza um agendamento existente.
   * @param {number} id - ID do agendamento.
   * @param {string} cronExpression - Nova expressão cron.
   * @param {Date|null} dataInicioValidade - Nova data de início da validade (opcional).
   * @param {Date|null} dataFimValidade - Nova data de fim da validade (opcional).
   * @returns {boolean} - Indica se a atualização foi bem-sucedida.
   */
  static async updateAgendamento(id, cronExpression, dataInicioValidade = null, dataFimValidade = null) {
    const sql = `
      UPDATE solicitacao_agendamentos
      SET cron_expression = ?, data_inicio_validade = ?, data_fim_validade = ?
      WHERE id = ?
    `;
    const values = [cronExpression, dataInicioValidade, dataFimValidade, id];
    const [result] = await pool.query(sql, values);
    return result.affectedRows > 0;
  }

  /**
   * Remove um agendamento do banco de dados.
   * @param {number} id - ID do agendamento.
   * @returns {boolean} - Indica se a remoção foi bem-sucedida.
   */
  static async deleteAgendamento(id) {
    const sql = `
      DELETE FROM solicitacao_agendamentos
      WHERE id = ?
    `;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }

  static async deleteAgendamentosBySolicitacao(solicitacaoId) {
    const sql = `DELETE FROM solicitacao_agendamentos WHERE solicitacao_id = ?`;
    const [result] = await pool.query(sql, [solicitacaoId]);
    return result.affectedRows > 0;
  }

  
}

module.exports = SolicitacaoAgendamentoRepository;
