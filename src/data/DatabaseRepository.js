const mysql = require('mysql2/promise');

class DatabaseRepository {
    constructor(config) {
        this.config = config;
    }

    async getConnection() {
        if (!this.connection) {
            this.connection = await mysql.createConnection(this.config);
            console.log('Conexão ao banco bem-sucedida.');
        }
        return this.connection;
    }

    async executeQuery(query, params = []) {
        try {
            const connection = await this.getConnection();
            return await connection.query(query, params);
        } catch (error) {
            console.error('Erro ao executar query:', error);
            throw error;
        }
    }

    async closeConnection() {
        if (this.connection) {
            await this.connection.end();
            console.log('Conexão com o banco encerrada.');
            this.connection = null;
        }
    }
}

module.exports = DatabaseRepository;