const mysql = require('mysql2/promise');

module.exports = {
  /**
   * Processa uma requisição para um banco de dados MySQL.
   * @param {string} prompt - Informação principal da consulta (opcional).
   * @param {string} model - Nome do modelo ou banco de dados a ser utilizado.
   * @param {Object} modelParameters - Parâmetros para configurar a conexão e consulta.
   * @returns {Promise<Object>} - Resultado da consulta no formato JSON.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    const {
      host,
      user,
      password,
      database,
      port = 3306,
      query,
      values = [],
      responseKey = 'mysqlResponse',
    } = modelParameters;

    try {
      console.log('Iniciando integração com o banco de dados MySQL...');

      // Valida os parâmetros obrigatórios
      if (!host || !user || !password || !database || !query) {
        throw new Error('Os parâmetros "host", "user", "password", "database" e "query" são obrigatórios.');
      }

      // Cria a conexão com o banco de dados
      const connection = await mysql.createConnection({
        host,
        user,
        password,
        database,
        port,
      });

      console.log('Conexão estabelecida com sucesso.');

      // Divide a query em comandos individuais (separados por ;)
      const commands = query.split(';').filter(cmd => cmd.trim() !== '');

      // Array para armazenar os resultados de cada comando
      const results = [];

      // Executa cada comando individualmente
      for (const cmd of commands) {
        // Verifica se o comando é DML (permitido) ou DDL (bloqueado)
        const isDML = /^(SELECT|INSERT|UPDATE|DELETE)/i.test(cmd.trim());
        if (!isDML) {
          throw new Error(`Comando não permitido: ${cmd.trim()}. Apenas comandos DML (SELECT, INSERT, UPDATE, DELETE) são aceitos.`);
        }

        // Executa o comando
        const [rows] = await connection.execute(cmd, values);
        results.push(rows);
      }

      console.log('Comandos executados com sucesso:', results);

      // Fecha a conexão
      await connection.end();

      // Retorna o resultado da execução
      return {
        [responseKey]: {
          success: true,
          data: results,
        },
      };
    } catch (error) {
      console.error('Erro durante a integração com o banco de dados MySQL:', error.message);

      // Em caso de erro, retorna um JSON vazio referenciado pela chave responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};