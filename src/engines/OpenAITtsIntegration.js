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
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    // Define a chave de resposta padrão ou usa a fornecida em modelParameters
    const responseKey = modelParameters.responseKey || 'openaiTtsResult';

    // Remove responseKey dos parâmetros para evitar conflitos
    delete modelParameters.responseKey;

    try {
      // Valida e define a chave da API
      const apiKey = modelParameters.api_key || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('A chave da API (OPENAI_API_KEY) não está definida nas variáveis de ambiente.');
      }

      // Endpoint da API da OpenAI para TTS
      const ttsEndpoint = 'https://api.openai.com/v1/audio/speech';

      // Constrói o payload para a geração de áudio
      const ttsPayload = {
        model: model || 'tts-1', // Modelo de TTS
        input: prompt || 'Today is a wonderful day to build something people love!', // Texto de entrada
        voice: modelParameters.voice || 'alloy', // Voz a ser utilizada
        response_format : modelParameters.response_format || 'mp3'
      };

      console.log('Enviando requisição POST para gerar áudio...');
      const ttsResponse = await axiosInstance.post(ttsEndpoint, ttsPayload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        responseType: 'arraybuffer', // Baixa o arquivo como um buffer binário
      });

      if (ttsResponse.status === 200) {
        // Converte a resposta binária para Base64
        const base64Audio = Buffer.from(ttsResponse.data, 'binary').toString('base64');

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
        throw new Error('Falha ao gerar áudio a partir da API da OpenAI.');
      }
    } catch (error) {
      console.error('Erro na integração com a OpenAI TTS:', error.message);

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