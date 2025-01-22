const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'faceSwapResult';

    try {
      modelParameters = modelParameters ? modelParameters : {};

      // Obtenção da API Key
      const apiKey = modelParameters.api_key || process.env.FACESWAP_API_KEY;

      if (!apiKey) {
        throw new Error('A chave de API (api_key) é obrigatória e deve ser passada ou configurada como variável de ambiente FACESWAP_API_KEY.');
      }

      // Definição da URL da API
      const endpoint = 'https://api.segmind.com/v1/faceswap-v3';

      // Montagem do payload
      const payload = {
        source_img: modelParameters.source_img,
        target_img: modelParameters.target_img,
        input_faces_index: modelParameters.input_faces_index || 0,
        source_faces_index: modelParameters.source_faces_index || 0,
        face_restore: modelParameters.face_restore || 'codeformer-v0.1.0.pth',
        interpolation: modelParameters.interpolation || 'Bilinear',
        detection_face_order: modelParameters.detection_face_order || 'large-small',
        facedetection: modelParameters.facedetection || 'retinaface_resnet50',
        detect_gender_input: modelParameters.detect_gender_input || 'no',
        detect_gender_source: modelParameters.detect_gender_source || 'no',
        face_restore_weight: modelParameters.face_restore_weight || 0.75,
        image_format: modelParameters.image_format || 'jpeg',
        image_quality: modelParameters.image_quality || 95,
        base64: true, // Força a API a retornar a imagem em Base64
      };

      // Headers
      const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      };

      console.log('Enviando requisição para FaceSwap v3...');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Chamada à API
      const response = await axios.post(endpoint, payload, { headers });

      // Verifica o status da resposta
      if (response.status === 200 && response.data && response.data.image) {
        console.log('Requisição concluída com sucesso. Enviando imagem para o ImageRepo...');

        // Instancia o repositório de imagens
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);

        // Salva a imagem no FTP
        console.log('Enviando imagem gerada para o FTP...');
        
        const savedImage = await ftpRepoService.createImage(
          response.data.image, // Conteúdo em Base64
          {
            description: 'Imagem gerada pela FaceSwap V3 API',
            tags: ['faceswap', 'AI', 'FaceSwapV3'],
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
        throw new Error('A API FaceSwap V3 não retornou uma imagem válida.');
      }
    } catch (error) {
      console.error('Erro na integração com FaceSwap V3:', error);

      // Retorno da resposta de erro com a chave de resposta (responseKey)
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
