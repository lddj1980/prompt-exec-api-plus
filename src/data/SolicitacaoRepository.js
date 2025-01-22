const pool = require('../config/database');

class SolicitacaoRepository {
  static async createSolicitacao(protocoloUid) {
    const [result] = await pool.query(
      'INSERT INTO solicitacoes_base (protocolo_uid, status) VALUES (?, ?)',
      [protocoloUid, 'pendente']
    );
    return result.insertId;
  }

  static async updateSolicitacaoStatus(protocoloUid, status, resultadoDados = null) {
    await pool.query(
      'UPDATE solicitacoes_base SET status = ?, resultado_dados = ? WHERE protocolo_uid = ?',
      [status, resultadoDados, protocoloUid]
    );
  }

  static async getSolicitacaoByProtocolo(protocoloUid) {
    const [rows] = await pool.query(
      'SELECT * FROM solicitacoes_base WHERE protocolo_uid = ?',
      [protocoloUid]
    );
    return rows[0];
  }
  
  static async deleteSolicitacao(id) {
    const sql = `DELETE FROM solicitacoes_base WHERE id = ?`;
    const [result] = await pool.query(sql, [id]);
    return result.affectedRows > 0;
  }

  
}

module.exports = SolicitacaoRepository;
