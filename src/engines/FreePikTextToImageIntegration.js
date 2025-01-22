const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

// Criação do axiosInstance com configurações personalizadas
const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'x-freepik-api-key': process.env.FREEPIK_API_KEY, // Token de API do Freepik
  },
});

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    try {
      console.log('Iniciando geração de imagem com o Freepik...');

      const responseKey = modelParameters.responseKey || 'response';

      // Monta o payload da requisição
      const payload = {
        prompt: prompt,
        negative_prompt: modelParameters.negative_prompt || {},
        guidance_scale: modelParameters.guidance_scale || 1,
        seed: modelParameters.seed || 0,
        num_images: modelParameters.num_images || 1,
        image: modelParameters.image || { size: 'square_1_1' }, // Tamanho padrão
        styling: modelParameters.styling || {},
      };

      // Endpoint da API do Freepik
      const endpoint = 'https://api.freepik.com/v1/ai/text-to-image';

      // Faz a requisição para a API
      const response = await axiosInstance.post(endpoint, payload);

      if (response.status === 200 && response.data.data) {
        console.log('Imagens geradas com sucesso!');

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        const savedImages = [];

        // Itera sobre as imagens retornadas
        for (let index = 0; index < response.data.data.length; index++) {
          const image = response.data.data[index];

          // Valida se a imagem possui conteúdo NSFW
          if (image.has_nsfw) {
            console.warn(`Imagem ${index + 1} foi identificada como NSFW e será ignorada.`);
            continue;
          }

          // Converte a imagem Base64 para o formato esperado pelo repositório
          const base64Image = image.base64;
          console.log(
            `Imagem ${index + 1} processada (tamanho Base64: ${this.calculateBase64Size(base64Image)} bytes)`
          );

          // Salva a imagem no repositório
          console.log(`Enviando imagem ${index + 1} para o repositório de imagens...`);
          
          const savedImage = await ftpRepoService.createImage(
          base64Image, // Conteúdo em Base64
          {targetFolder:'imagerepo'}, // Metadados da imagem
          `.jpg`, // Extensão do arquivo
          null, 
          null, 
          true // Define que o conteúdo está em Base64
          );

          savedImages.push(savedImage);
        }

        console.log('Todas as imagens válidas foram salvas com sucesso!');
        return {
          [responseKey]: {
            success: true,
            data: savedImages,
          },
        };
      } else {
        throw new Error('Resposta inválida ou mal formatada da API Freepik.');
      }
    } catch (error) {
      console.error('Erro ao integrar com a API Freepik:', error.message);

      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
      }

      return {
        [modelParameters.responseKey || 'response']: {
          success: false,
          error: error.message,
        },
      };
    }
  },

  // Função auxiliar para calcular o tamanho do Base64 em bytes
  calculateBase64Size(base64String) {
    const base64 = base64String.split(',').pop(); // Remove cabeçalho, se houver
    const padding = (base64.match(/=/g) || []).length;
    return (base64.length * 3) / 4 - padding;
  },
};