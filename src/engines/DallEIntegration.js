const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  async process(prompt, model, modelParameters) {
    try {
      modelParameters = modelParameters || {};
      const responseKey = modelParameters.responseKey || 'response';

      console.log('Iniciando integração com DALL-E e ImageRepo...');

      // Configuração do request para DALL-E
      const response = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt: prompt,
          n: modelParameters.n || 1,
          model: model || 'dall-e-3',
          size: modelParameters.size || '1024x1024',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.DALLE_API_KEY}`,
          },
        }
      );

      // Verifica a resposta de DALL-E
      if (response.status === 200 && response.data.data) {
        console.log('Imagens geradas com sucesso!');
        
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        const savedImages = [];

        // Itera sobre as imagens retornadas
        for (let index = 0; index < response.data.data.length; index++) {
          const imageUrl = response.data.data[index].url;

          // Salva a imagem no repositório
          console.log(`Enviando imagem ${index + 1} para o repositório de imagens...`);

          const savedImage = await ftpRepoService.createImage(
          imageUrl, // Conteúdo em Base64
          {targetFolder:'imagerepo'}, // Metadados da imagem
          `.jpg`, // Extensão do arquivo
          null, 
          null, 
          false // Define que o conteúdo está em Base64
          );
          savedImages.push(savedImage);
        }

        console.log('Todas as imagens válidas foram salvas com sucesso!');

        // Retorna a resposta formatada com `responseKey`
        return {
          [responseKey]: {
            success: true,
            data: savedImages,
          },
        };
      } else {
        throw new Error(`Erro ao processar com DALL-E: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com DALL-E e ImageRepo:', error.message);

      // Retorna erro formatado com `responseKey`
      return {
        [modelParameters.responseKey || 'response']: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};