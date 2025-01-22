const axios = require('axios');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    
     modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com o Threads API via ThreadsController...');

      const apiKey = modelParameters.api_key;

      if (!apiKey) {
        throw new Error('O parâmetro "apiKey" é obrigatório em "modelParameters".');
      }

      // Montar o corpo da requisição para o ThreadsController
      const requestBody = {
        modelParameters: {
          prompt,
          model,
          ...modelParameters,
        },
      };

      // Fazer a requisição ao ThreadsController
      const response = await axios.post(
        'https://threads-publish.glitch.me/api/threads/', // URL do ThreadsController
        requestBody,
        {
          headers: {
            apiKey, // Cabeçalho com a API Key
          },
        }
      );

      console.log('Integração concluída com sucesso:', response.data);

      // Retorna a resposta encapsulada com o responseKey
      return {
        [responseKey]: {
          success: true,
          data: response.data,
        },
      };
    } catch (error) {
      console.error('Erro durante a integração com o Threads API via ThreadsController:', error.message);

      // Retorna o erro encapsulado com o responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }
  },
};
