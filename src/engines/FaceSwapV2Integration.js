const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com a FaceSwap API...');

      // Validação dos parâmetros obrigatórios
      const apiKey = modelParameters.api_key || process.env.FACESWAP_API_KEY;
      if (!apiKey) {
        throw new Error("O parâmetro 'api_key' é obrigatório ou deve ser definido como variável de ambiente.");
      }

      const { source_img, target_img, input_faces_index, source_faces_index, face_restore, image_format } = modelParameters;

      if (!source_img || !target_img || input_faces_index === undefined || source_faces_index === undefined || !face_restore) {
        throw new Error(
          "Os parâmetros 'source_img', 'target_img', 'input_faces_index', 'source_faces_index' e 'face_restore' são obrigatórios."
        );
      }

      // Monta o payload para a FaceSwap API
      const payload = {
        source_img,
        target_img,
        input_faces_index,
        source_faces_index,
        face_restore,
        base64: true,
        image_format
      };

      const endpoint = 'https://api.segmind.com/v1/faceswap-v2';

      // Faz a requisição para a FaceSwap API
      console.log('Enviando requisição para FaceSwap API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data) {
        console.log('Requisição concluída com sucesso.');

        // Converte a resposta para Base64
        const base64Image = response.data.image;
        console.log('Tamanho do arquivo Base64:', calculateBase64Size(base64Image));

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);

        // Salva a imagem no FTP
        console.log('Enviando imagem gerada para o FTP...');
        
        const savedImage = await ftpRepoService.createImage(
          response.data.image, // Conteúdo em Base64
          {
            description: 'Imagem gerada pela FaceSwap V2 API',
            tags: ['faceswap', 'AI', 'FaceSwapV2'],
            targetFolder:'imagerepo'
          }, // Metadados da imagem
          `.${payload.image_format}`, // Extensão do arquivo
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
        throw new Error(`Erro ao processar com FaceSwap API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com a FaceSwap API:', error);

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
