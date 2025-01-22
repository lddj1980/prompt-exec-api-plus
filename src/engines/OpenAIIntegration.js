const axios = require('axios');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    try {
      modelParameters = modelParameters ? modelParameters : {};

      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error('A variável de ambiente OPENAI_API_KEY não está definida.');
      }

      // Extraindo a chave de resposta (responseKey)
      const responseKey = modelParameters.responseKey || 'result';

      // Endpoint da API
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      // Mensagens de entrada
      const messages = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Se uma URL de imagem for fornecida, adiciona ao conteúdo
      if (modelParameters.image_url) {
        messages.push({
          role: 'user',
          content: `Imagem relacionada: ${modelParameters.image_url}`,
        });
      }

      // Corpo da solicitação
      const payload = {
        model: model,
        messages: messages,
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
        const processedResponse = extrairJSON(response.data.choices[0].message.content.trim());

        // Retorna a resposta com a chave `responseKey`
        return {
          [responseKey]: {
            success: true,
            data: processedResponse,
          },
        };
      } else {
        throw new Error(`Erro ao processar com OpenAI: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com OpenAI:', error);

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

function extrairJSON(resposta) {
  console.log('Resposta completa:', resposta);

  // Regex para capturar JSON entre ```json e ```
  const regex = /```json\s*([\s\S]*?)\s*```/;//
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