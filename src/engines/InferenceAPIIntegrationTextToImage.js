const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

// Criação do axiosInstance com configurações personalizadas
const axiosInstance = axios.create({
  maxBodyLength: Infinity, // Permite payloads grandes
  maxContentLength: Infinity, // Permite respostas grandes
  headers: {
    Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, // Token de API do Hugging Face
    'Content-Type': 'application/json',
    'x-wait-for-model': 'true',
  },
});

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'response';

    delete modelParameters.responseKey;
    try {
      console.log('Iniciando integração com a Inference API do Hugging Face...');

      // Validação dos parâmetros obrigatórios
      if (!prompt) {
        throw new Error("O parâmetro 'prompt' é obrigatório.");
      }
      if (!model) {
        throw new Error("O parâmetro 'model' é obrigatório.");
      }

      // Monta o endpoint da Inference API com o modelo fornecido
      const endpoint = `https://api-inference.huggingface.co/models/${model}`;
      const request = modelParameters ? { inputs: prompt, parameters: modelParameters } : { inputs: prompt };

      // Configurações para retry
      const maxRetries = 5;
      let retryCount = 0;
      let response;

      while (retryCount < maxRetries) {
        try {
          // Faz a requisição para a Inference API usando axiosInstance
          response = await axiosInstance.post(endpoint, request, {
            responseType: 'arraybuffer', // Necessário para lidar com binários como imagens
          });

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

      // Verifica o status da resposta
      if (response.status === 200) {
        // Converte a resposta para Base64
        const base64Image = Buffer.from(response.data, 'binary').toString('base64');
        console.log('Tamanho do arquivo Base64:', calculateBase64Size(base64Image));

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        
        // Salva a imagem no repositório de imagens
        console.log('Enviando imagem gerada para o Image Repo...');

        const savedImage = await ftpRepoService.createImage(
          base64Image, // Conteúdo em Base64
          {targetFolder:'imagerepo'}, // Metadados da imagem
          `.jpg`, // Extensão do arquivo
          null, 
          null, 
          true // Define que o conteúdo está em Base64
          );
        
        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Erro ao processar com Inference API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com Inference API:', error);

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
      const base64 = base64String.split(',').pop(); // Remove cabeçalho, se houver
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};
