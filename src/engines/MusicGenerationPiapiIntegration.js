const axios = require('axios');

// Criação do axiosInstance com configurações personalizadas
const axiosInstance = axios.create({
  maxBodyLength: Infinity, // Permite payloads grandes
  maxContentLength: Infinity, // Permite respostas grandes
  headers: {
    'Content-Type': 'application/json',
  },
});

module.exports = {
  /**
   * Processa uma tarefa de geração de música usando a API Piapi.
   * @param {string} prompt - Placeholder para consistência com outras integrações (não utilizado aqui).
   * @param {string} model - Placeholder para consistência com outras integrações (não utilizado aqui).
   * @param {Object} modelParameters - Parâmetros necessários para a requisição à API.
   * @returns {Promise<Object>} - Resultado da tarefa de geração de música.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    // Define a chave de resposta padrão ou usa a fornecida em modelParameters
    const responseKey = modelParameters.responseKey || 'musicGenerationResult';

    // Remove responseKey dos parâmetros para evitar conflitos
    delete modelParameters.responseKey;

    try {
      // Valida e define a chave da API
      const apiKey = modelParameters.api_key || process.env.PIAPI_API_KEY;
      if (!apiKey) {
        throw new Error('A chave da API (PIAPI_API_KEY) não está definida nas variáveis de ambiente.');
      }

      // Endpoint para criação da tarefa
      const postEndpoint = 'https://api.piapi.ai/api/v1/task';

      // Constrói o payload
      const payload = {
        model: modelParameters.model || 'music-u',
        task_type: modelParameters.task_type || 'generate_music',
        input: {
          negative_tags: modelParameters.negative_tags || 'veritatis',
          gpt_description_prompt: modelParameters.gpt_description_prompt || '',
          lyrics_type: modelParameters.lyrics_type || 'instrumental',
          seed: modelParameters.seed || 0,
        },
      };

      console.log('Enviando requisição POST para Piapi...');
      const postResponse = await axiosInstance.post(postEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
      });

      if (postResponse.status === 200 && postResponse.data?.data?.task_id) {
        const taskId = postResponse.data.data.task_id;

        console.log(`Tarefa criada com sucesso. Task ID: ${taskId}`);
        const taskResult = await this.pollTaskStatus(apiKey, taskId);

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: taskResult.success,
            data: taskResult.details? taskResult.details.data :null,
            error: taskResult.error,
            details: taskResult.details,
          },
        };
      } else {
        throw new Error('Falha ao criar a tarefa. Resposta inválida da Piapi.');
      }
    } catch (error) {
      console.error('Erro na integração com a Piapi:', error.message);

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

  /**
   * Polling do status da tarefa até que seja concluída ou o número máximo de tentativas seja atingido.
   * @param {string} apiKey - Chave da API para autenticação.
   * @param {string} taskId - ID da tarefa para verificar o status.
   * @returns {Promise<Object>} - Status final da tarefa e saída.
   */
  async pollTaskStatus(apiKey, taskId) {
    const maxAttempts = 30;
    const interval = 60000; // 1 minuto em milissegundos
    const getEndpoint = `https://api.piapi.ai/api/v1/task/${taskId}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Verificando status da tarefa (Tentativa ${attempt}/${maxAttempts})...`);
      const getResponse = await axiosInstance.get(getEndpoint, {
        headers: {
          'X-API-KEY': apiKey,
        },
      });

      if (getResponse.status === 200) {
        const taskData = getResponse.data?.data;

        if (taskData.status === 'completed') {
          console.log('Tarefa concluída com sucesso.');
          return {
            success: true,
            data: taskData.output,
          };
        } else if (taskData.status === 'failed') {
          console.log('Tarefa falhou.');
          return {
            success: false,
            error: 'Tarefa falhou.',
            details: taskData.error || null,
          };
        }
      } else {
        console.error('Erro ao verificar o status da tarefa:', getResponse.statusText);
      }

      // Aguarda antes da próxima tentativa
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    console.log('Número máximo de tentativas excedido. Tarefa não concluída.');
    return {
      success: false,
      error: 'Número máximo de tentativas excedido. Tarefa não concluída.',
    };
  },
};