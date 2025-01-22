const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

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
   * Processa uma tarefa de geração de áudio usando a SunoAPI.
   * @param {string} prompt - Texto descritivo para gerar o áudio.
   * @param {string} model - Placeholder para consistência com outras integrações (não utilizado aqui).
   * @param {Object} modelParameters - Parâmetros necessários para a requisição à API.
   * @returns {Promise<Object>} - Resultado da tarefa de geração de áudio.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    // Define a chave de resposta padrão ou usa a fornecida em modelParameters
    const responseKey = modelParameters.responseKey || 'sunoAudioResult';

    // Remove responseKey dos parâmetros para evitar conflitos
    delete modelParameters.responseKey;

    try {
      // Valida e define a chave da API
      const apiKey = modelParameters.api_key || process.env.SUNO_API_KEY;
      if (!apiKey) {
        throw new Error('A chave da API (SUNO_API_KEY) não está definida nas variáveis de ambiente.');
      }

      // Endpoint para geração de áudio
      const generateEndpoint = 'https://apibox.erweima.ai/api/v1/generate';

      // Constrói o payload para a geração de áudio
      const generatePayload = {
        customMode: modelParameters.customMode || true, // Modo customizado (true/false)
        instrumental: modelParameters.instrumental, // Música instrumental (true/false)
        prompt: prompt || 'Uma música animada e feliz', // Texto descritivo
        style: modelParameters.style || 'pop', // Estilo da música
        title: modelParameters.title || 'Nova Música', // Título da música
        model: modelParameters.model ?  (modelParameters.model == 'none' ? 'V3_5' : modelParameters.model): 'V3_5', // Modelo de geração
        callBackUrl: modelParameters.callBackUrl || 'https://example.com/callback', // URL de callback
      };
      console.log(generatePayload);
      console.log('Enviando requisição POST para gerar áudio...');
      const generateResponse = await axiosInstance.post(generateEndpoint, generatePayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,//
        },
      });

      if (generateResponse.status === 200 && generateResponse.data?.data?.taskId) {
        const taskId = generateResponse.data.data.taskId;

        console.log(`Tarefa de geração de áudio criada com sucesso. Task ID: ${taskId}`);
        const recordInfo = await this.pollRecordInfo(apiKey, taskId);

        // Verifica se a gravação foi concluída com sucesso
        if (recordInfo.success && recordInfo.data?.length > 0) {
          const streamAudioUrl = recordInfo.data[0].streamAudioUrl; // Obtém a URL de stream de áudio//

          if (!streamAudioUrl) {
            throw new Error('URL de stream de áudio não encontrada.');
          }

          // Faz o download do áudio a partir da URL
          const audioResponse = await axiosInstance.get(streamAudioUrl, {
            responseType: 'arraybuffer', // Para receber os dados binários do áudio
          });
          console.log('audio response');
          console.log(audioResponse);
          if (audioResponse.status === 200) {
            // Converte a resposta binária para Base64
            const base64Audio = Buffer.from(audioResponse.data, 'binary').toString('base64');

            // Configuração do FTP
            const config = {
              ftpHost: 'ftp.travelzviagensturismo.com',
              ftpPort: 21,
              ftpUser: 'pddidg3z',
              ftpPassword: 'q9VB0fdr28',
              baseDomain: 'https://travelzviagensturismo.com',
              rootDir: '/public_html/',
            };

            // Instancia o serviço de FTP
            const ftpRepoService = new FtpRepoService(config);

            // Salva o áudio no repositório
            console.log('Enviando áudio gerado para o repositório...');
            const savedAudio = await ftpRepoService.createImage(
              base64Audio, // Conteúdo em Base64
              { targetFolder: 'audiorepo' }, // Metadados do áudio
              '.mp3', // Extensão do arquivo
              null,
              null,
              true // Define que o conteúdo está em Base64
            );

            // Retorna a resposta formatada com o responseKey
            return {
              [responseKey]: {
                success: true,
                data: savedAudio,
              },
            };
          } else {
            throw new Error('Falha ao baixar o áudio a partir da URL de stream.');
          }
        } else {
          throw new Error('Gravação não concluída ou dados de áudio não encontrados.');
        }
      } else {
        throw new Error('Falha ao criar tarefa de geração de áudio. Resposta inválida da SunoAPI.');
      }
    } catch (error) {
      console.error('Erro na integração com a SunoAPI:', error.message);

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
   * Polling das informações da gravação até que esteja pronta ou o número máximo de tentativas seja atingido.
   * @param {string} apiKey - Chave da API para autenticação.
   * @param {string} taskId - ID da tarefa para verificar o status.
   * @returns {Promise<Object>} - Status final da gravação e saída.
   */
  async pollRecordInfo(apiKey, taskId) {
    const maxAttempts = 30;
    const interval = 60000; // 1 minuto em milissegundos
    const recordInfoEndpoint = `https://apibox.erweima.ai/api/v1/generate/record-info?taskId=${taskId}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Verificando status da gravação (Tentativa ${attempt}/${maxAttempts})...`);
      const recordInfoResponse = await axiosInstance.get(recordInfoEndpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (recordInfoResponse.status === 200 && recordInfoResponse.data) {
        const recordData = recordInfoResponse.data.data;

        if (recordData.status === 'SUCCESS') {
          console.log('Gravação concluída com sucesso.');
          return {
            success: true,//
            data: recordData.response.sunoData, // Dados da gravação
          };
        } else if (
          recordData.status === 'GENERATE_AUDIO_FAILED' ||
          recordData.status === 'CREATE_TASK_FAILED' ||
          recordData.status === 'CALLBACK_EXCEPTION' ||
          recordData.status === 'SENSITIVE_WORD_ERROR'
        ) {
          console.log('Gravação falhou.');
          return {
            success: false,
            error: 'Gravação falhou.',
            details: recordData.response.errorMessage || null,
          };
        }
      } else {
        console.error('Erro ao verificar o status da gravação:', recordInfoResponse.statusText);
      }

      // Aguarda antes da próxima tentativa
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    console.log('Número máximo de tentativas excedido. Gravação não concluída.');
    return {
      success: false,
      error: 'Número máximo de tentativas excedido. Gravação não concluída.',
    };
  },
};