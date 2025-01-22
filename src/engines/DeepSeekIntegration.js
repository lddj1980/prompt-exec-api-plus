const axios = require('axios');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    try {
      modelParameters = modelParameters ? modelParameters : {};

      const apiKey = modelParameters.api_key ?  modelParameters.api_key : process.env.DEEPSEEK_API_KEY;

      if (!apiKey) {
        throw new Error('O parâmetro "api_key" é obrigatório em "modelParameters".');
      }

      // Extraindo a chave de resposta (responseKey)
      const responseKey = modelParameters.responseKey || 'result';

      // Endpoint da API DeepSeek
      const endpoint = 'https://api.deepseek.com/chat/completions';

      // Corpo da solicitação
      const payload = {
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
        max_tokens: modelParameters.max_tokens || 4096,
        temperature: modelParameters.temperature || 1
      };

      console.log(`Enviando solicitação para ${endpoint}...`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Chamada à API
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        const processedResponse = extrairJSON(
          response.data.choices ? response.data.choices[0].message.content.trim() : response.data
        );

        // Retorna a resposta com a chave `responseKey`
        return {
          [responseKey]: {
            success: true,
            data: processedResponse,
          },
        };
      } else {
        throw new Error(`Erro ao processar com DeepSeek: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com DeepSeek:', error);

      // Retorna um JSON com erro usando a chave `responseKey`
      return {
        [modelParameters.responseKey || 'result']: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};

/**
 * Função para extrair JSON de uma resposta.
 * @param {string} resposta - Texto da resposta.
 * @returns {object|string} - JSON extraído ou a resposta como string.
 */
function extrairJSON(resposta) {
  console.log('Resposta completa:', resposta);

  // Regex para capturar JSON entre ```json e ```
  const regex = /```json\s*([\s\S]*?)\s*```/;
  const match = resposta.match(regex);

  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (error) {
      console.error('Erro ao fazer o parse do JSON:', error);
      return null;
    }
  } else {
    try {
      return JSON.parse(resposta);
    } catch (error) {
      console.error('Resposta não é JSON, retornando como string.');
      return resposta;
    }
  }
}
