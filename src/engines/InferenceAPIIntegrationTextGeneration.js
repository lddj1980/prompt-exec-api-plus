const axios = require('axios');
const fs = require('fs');
const ImageRepoAPI = require('../services/ImageRepoService'); // Certifique-se de ajustar o caminho para o arquivo da classe ImageRepoAPI
const sharp = require('sharp');

module.exports = {
  /**
   * Processa uma solicitação usando a Inference API do Hugging Face.
   * @param {string} prompt - O prompt ou entrada para o modelo.
   * @param {string} model - O modelo a ser utilizado.
   * @param {Object} modelParameters - Parâmetros adicionais para a integração.
   * @returns {Promise<Object>} - Resposta formatada com o `responseKey`.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'response';
    delete modelParameters.responseKey;
    try {
      console.log('Iniciando integração com a Inference API do Hugging Face...');

      // Validação de entrada
      if (!model) {
        throw new Error('O parâmetro "model" é obrigatório.');
      }

      const apiKey =
        modelParameters.api_key || process.env.HUGGINGFACE_API_KEY;

      if (!apiKey) {
        throw new Error('A chave da API é obrigatória.');
      }

      // Monta o endpoint da API
      const endpoint = `https://api-inference.huggingface.co/models/${model}`;
      // Configurações para retry
      const maxRetries = 5;
      let retryCount = 0;
      let response;

      while (retryCount < maxRetries) {
        try {
          // Faz a requisição para a API
          response = await axios.post(
            endpoint,
            { inputs: prompt },
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-type': 'application/json',
                'x-wait-for-model': 'true',
              },
            }
          );

          // Se a requisição for bem-sucedida, sai do loop
          if (response.status === 200) {
            break;
          }
        } catch (error) {
          retryCount++;
          console.error(`Tentativa ${retryCount} falhou. Tentando novamente...`, error.message);
          if (retryCount >= maxRetries) {
            throw error; // Se todas as tentativas falharem, lança o erro
          }
          // Aguarda um pequeno delay antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Verifica se a resposta foi bem-sucedida
      if (response.status === 200) {
        console.log('Resposta recebida com sucesso:', response.data);

        // Retorna a resposta formatada com responseKey
        return {
          [responseKey]: {
            success: true,
            data: response.data,
          },
        };
      } else {
        throw new Error(`Erro ao processar com Inference API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com a Inference API:', error);

      // Retorna o erro formatado com responseKey
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