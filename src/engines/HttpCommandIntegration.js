const axios = require('axios');

function isValidJSON(str) {
      try {
          JSON.parse(str); // Tenta converter a string em um objeto JSON
          return true; // Se não houver erro, é um JSON válido
      } catch (e) {
          return false; // Se ocorrer um erro, não é um JSON válido
      }
}

module.exports = {
  
  /**
   * Processa uma requisição para a API genérica.
   * @param {string} prompt - Dados ou informações principais para a requisição.
   * @param {string} model - Modelo utilizado para a requisição.
   * @param {Object} modelParameters - Parâmetros para configurar a requisição.
   * @returns {Promise<Object>} - Resposta da API no formato definido por responseKey.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    
    try {
      console.log(`Iniciando requisição com o modelo ${model}...`);

      const baseURL = modelParameters.base_url || null;
      const endpoint = modelParameters.endpoint || null;
      const method = modelParameters.method || null;
      const requestId = modelParameters.request_id || `req-${Date.now()}`;
      const responseKey = modelParameters.responseKey || 'response';

      if (!baseURL || !endpoint || !method) {
        throw new Error('Os parâmetros "base_url", "endpoint" e "method" são obrigatórios.');//
      }

      // Configuração da requisição
      const url = `${baseURL}${endpoint}`;
      const headers = modelParameters.headers || {};
      const timeout = modelParameters.timeout || 30000; // Timeout padrão de 5 segundos
      const params = modelParameters.params || {}; // Parâmetros de query opcionais
      const data = isValidJSON(modelParameters.body) ? JSON.parse(modelParameters.body) : modelParameters.body || {}; // Corpo da requisição

      console.log(data);
      // Executa a requisição diretamente com axios
      const response = await axios({
        method: method.toLowerCase(),
        url: url,
        headers: headers,
        timeout: timeout,
        params: params,
        data:data,
      });

      console.log('Resposta recebida com sucesso:', response.data);
      return {
        [responseKey]: {
          success: true,
          request_id: requestId,
          data: response.data,
        },
      };
    } catch (error) {
      console.error('Erro durante a requisição:', error.message);

      if (error.response) {
        console.error('Detalhes do erro na resposta:', error.response.data);
        return {
          [modelParameters.responseKey || 'response']: {
            success: false,
            request_id: modelParameters.request_id || `req-${Date.now()}`,
            error: error.response.data.message || 'Erro na API.',
          },
        };
      } else if (error.request) {
        console.error('Erro durante o envio da requisição:', error.request);
        return {
          [modelParameters.responseKey || 'response']: {
            success: false,
            request_id: modelParameters.request_id || `req-${Date.now()}`,
            error: 'Erro na comunicação com a API.',
          },
        };
      } else {
        console.error('Erro inesperado:', error.message);
        return {
          [modelParameters.responseKey || 'response']: {
            success: false,
            request_id: modelParameters.request_id || `req-${Date.now()}`,
            error: error.message,
          },
        };
      }
    }
  },
};