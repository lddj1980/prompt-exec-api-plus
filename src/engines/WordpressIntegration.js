const axios = require('axios');
const WordpressService = require('../services/WordpressService'); // Ajuste o caminho para a classe WordpressService

module.exports = {
  async process(prompt, model, modelParameters = {}) {

    modelParameters = modelParameters || {};

    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com o WordPress...');

      const webhookURL = modelParameters.webhook_url || 'https://hook.us1.make.com/fy97mitmrsnsy43kaa8x9ousrcy6b2am';

      // Instancia o serviço WordpressService
      const wordpressService = new WordpressService(webhookURL);

      // Valida os parâmetros obrigatórios
      if (!modelParameters.title || !modelParameters.content) {
        throw new Error('Os parâmetros "title" e "content" são obrigatórios para publicar um post.');
      }

      // Monta os detalhes do post a partir de modelParameters
      const postDetails = {
        title: modelParameters.title,
        content: modelParameters.content,
        author: modelParameters.author || undefined,
        slug: modelParameters.slug || undefined,
        excerpt: modelParameters.excerpt || undefined,
        featureMediaId: modelParameters.feature_media_id || undefined,
        parentObjectId: modelParameters.parent_object_id || undefined,
      };

      console.log('Detalhes do post:', postDetails);

      // Publica o post usando o serviço WordpressService
      const result = await wordpressService.publishPost(postDetails);

      console.log('Post publicado com sucesso:', result);
      return {
        [responseKey]: {
          success: true,
          data: result,
        },
      }; // Retorna o resultado da publicação

    } catch (error) {
      console.error('Erro durante a integração com o WordPress:', error.message);

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
