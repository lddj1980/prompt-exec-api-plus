const mysql = require('mysql2/promise');

// Configuração do pool de conexões
const pool = mysql.createPool({
  host: '108.181.92.76',       // Endereço do servidor MySQL
  user: 'promptexecusr',       // Usuário do banco de dados
  password: '@5G5l9c1',        // Senha do banco de dados
  database: 'promptexec',      // Nome do banco de dados
  waitForConnections: true,    // Esperar por conexões disponíveis se o limite for atingido
  connectionLimit: 10,         // Número máximo de conexões no pool
  queueLimit: 0,               // Número máximo de solicitações na fila (0 = ilimitado)
  enableKeepAlive: true,       // Manter a conexão viva
  keepAliveInitialDelay: 10000 // Tempo inicial para enviar pacotes keep-alive (10 segundos)
});

// Evento disparado quando uma nova conexão é criada no pool
pool.on('connection', (connection) => {
  console.log('Nova conexão estabelecida no pool');
});

// Evento disparado quando ocorre um erro no pool
pool.on('error', (err) => {
  console.error('Erro no pool de conexões:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Reconectando ao banco de dados...');
    // Aqui você pode adicionar lógica para reconectar ou recriar o pool, se necessário
  }
});

// Função para testar a conexão com o banco de dados
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping(); // Testa a conexão
    connection.release();    // Libera a conexão de volta para o pool
    console.log('Conexão com o banco de dados está ativa.');
  } catch (error) {
    console.error('Erro ao testar a conexão:', error);
  }
};

// Testar a conexão periodicamente (opcional)
setInterval(testConnection, 60000); // Testa a conexão a cada 60 segundos

// Exportar o pool para ser usado em outros módulos
module.exports = pool;