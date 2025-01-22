const ImageRepoService = require('../services/ImageRepoService'); // Ajuste o caminho para a classe ImageRepoService

module.exports = {
  /**
   * Processa uma solicitação para a API do Image Repo.
   * @param {string} prompt - Descrição ou informação principal para o processamento.
   * @param {string} model - Tipo de modelo ou integração.
   * @param {Object} modelParameters - Parâmetros adicionais necessários para a ação.
   * @returns {Promise<Object>} - Resposta formatada com o `responseKey`.
   */
  async process(prompt, model, modelParameters) {
    try {
      modelParameters = modelParameters || {};
      console.log('Iniciando integração com o Image Repo API...');

      const apiKey = modelParameters.apiKey || null;
      const responseKey = modelParameters.responseKey || 'response';

      if (!apiKey) {
        throw new Error('O parâmetro "apiKey" é obrigatório.');
      }

      // Instancia o serviço ImageRepoService
      const imageRepoAPI = new ImageRepoService(modelParameters.baseURL);

      if (modelParameters.action === 'createImage') {
        console.log('Criando imagem no repositório...');

        if (
          !modelParameters.image_url ||
          !modelParameters.metadata ||
          !modelParameters.extension ||
          !modelParameters.ftp_config_id
        ) {
          throw new Error(
            'Os parâmetros "image_url", "metadata", "extension" e "ftp_config_id" são obrigatórios para criar uma imagem.'
          );
        }

        const metadata = {
          description: modelParameters.metadata.description || '',
          tags: modelParameters.metadata.tags || [],
        };

        const result = await imageRepoAPI.createImage(
          modelParameters.image_url,
          metadata,
          modelParameters.extension,
          apiKey,
          modelParameters.ftp_config_id,
          modelParameters.base64 || false
        );

        console.log('Imagem criada com sucesso:', result);
        return {
          [responseKey]: {
            success: true,
            action: 'createImage',
            data: result,
          },
        };
      } else {
        throw new Error(
          'Nenhuma ação válida foi especificada. Use "createImage" em "modelParameters.action".'
        );
      }
    } catch (error) {
      console.error('Erro durante a integração com o Image Repo API:', error.message);

      const responseKey = modelParameters?.responseKey || 'response';

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
