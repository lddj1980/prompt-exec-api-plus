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
    const responseKey = modelParameters.responseKey || 'response';

    // Remove responseKey dos parâmetros para evitar conflitos
    delete modelParameters.responseKey;

    try {
      console.log('Iniciando integração com a API ElevenLabs');

      // Validação dos parâmetros obrigatórios
      if (!modelParameters.voice_id) {
        throw new Error('O parâmetro "voice_id" é obrigatório.');
      }
      if (!model) {
        throw new Error('O parâmetro "model" é obrigatório.');
      }
      if (!prompt) {
        throw new Error('O parâmetro "prompt" é obrigatório.');
      }

      // Configuração do endpoint e headers
      const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${modelParameters.voice_id}`;
      const headers = {
        'xi-api-key': modelParameters.api_key || process.env.ELEVENLABS_API_KEY, // Substitua pela sua chave de API
        'Content-Type': 'application/json',
      };

      // Corpo da requisição
      const requestBody = { text: prompt, model_id: model };

      // Faz a requisição POST usando axiosInstance
      const response = await axiosInstance.post(endpoint, requestBody, {
        headers,
        responseType: 'arraybuffer', // Para receber os dados binários do áudio
      });

      // Verifica o status da resposta
      if (response.status === 200) {
        // Converte a resposta binária para Base64
        const base64Audio = Buffer.from(response.data, 'binary').toString('base64');
        console.log('Tamanho do arquivo em Base64:', calculateBase64Size(base64Audio));

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
        throw new Error(`Erro na API ElevenLabs: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com a API ElevenLabs:', error);

      // Retorna o erro formatado com responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }

    // Função auxiliar para calcular o tamanho do Base64 em bytes
    function calculateBase64Size(base64String) {
      const base64 = base64String.split(',').pop(); // Remove prefixos, se existirem
      const padding = (base64.match(/=/g) || []).length; // Conta '='
      return (base64.length * 3) / 4 - padding; // Calcula tamanho em bytes
    }
  },
};