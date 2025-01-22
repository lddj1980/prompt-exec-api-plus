const axios = require('axios');

class WordpressService {
  /**
   * Inicializa a integração com o webhook para publicar no WordPress.
   * @param {string} webhookURL - A URL padrão do webhook.
   */
  constructor(webhookURL = 'https://hook.us1.make.com/fy97mitmrsnsy43kaa8x9ousrcy6b2am') {
    this.webhookURL = webhookURL;
  }

  /**
   * Publica um post no WordPress usando o webhook.
   * @param {object} postDetails - Detalhes do post a ser publicado.
   * @param {string} postDetails.title - O título do artigo (obrigatório).
   * @param {string} postDetails.content - O conteúdo do artigo (obrigatório).
   * @param {string} [postDetails.author] - O autor do artigo (opcional).
   * @param {string} [postDetails.slug] - O slug do artigo (opcional).
   * @param {string} [postDetails.excerpt] - O resumo/excerpt do artigo (opcional).
   * @param {number} [postDetails.featureMediaId] - O ID da mídia destacada (opcional).
   * @param {number} [postDetails.parentObjectId] - O ID do objeto pai (opcional).
   * @returns {Promise<object>} - Resposta do webhook.
   * @throws {Error} - Caso ocorra algum erro na chamada ao webhook.
   */
  async publishPost({
    title,
    content,
    author,
    slug,
    excerpt,
    featureMediaId,
    parentObjectId,
  }) {
    if (!title || !content) {
      throw new Error('Both title and content are required to publish a post.');
    }

    const payload = {
      title,
      content,
      ...(author && { author }),
      ...(slug && { slug }),
      ...(excerpt && { excerpt }),
      ...(featureMediaId && { featureMediaId }),
      ...(parentObjectId && { parentObjectId }),
    };

    console.log('Publishing post to WordPress Webhook:', this.webhookURL);
    console.log('Payload:', payload);

    try {
      const response = await axios.post(this.webhookURL, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('WordPress Webhook Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during WordPress Webhook call:', error.message);
      throw new Error(`WordPress Webhook call failed: ${error.message}`);
    }
  }
}

module.exports = WordpressService;
