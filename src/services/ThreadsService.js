const axios = require('axios');

const THREADS_API_BASE_URL = 'https://graph.threads.net/v1.0';

/**
 * Cria um media container para um post no Threads.
 * @param {string} accessToken - Token de acesso da API.
 * @param {string} userId - ID do usuário no Threads.
 * @param {Object} options - Opções para o media container (media_type, text, image_url, video_url, is_carousel_item).
 * @returns {Promise<string>} - Retorna o ID do media container criado.
 */
async function createMediaContainer(accessToken, userId, options) {
  const { media_type, text, image_url, video_url, is_carousel_item } = options;

  // Verifica se o post é apenas texto
  const isTextOnly = !media_type && !image_url && !video_url;

  if (!text) {
    throw new Error('O parâmetro "text" é obrigatório para criar um post.');
  }

  // Define o payload com base no tipo de post
  const payload = isTextOnly
    ? { text } // Apenas texto
    : { media_type, text, image_url, video_url, is_carousel_item }; // Post com mídia

  try {
    const response = await axios.post(`${THREADS_API_BASE_URL}/${userId}/threads`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.id; // Retorna o ID do container
  } catch (error) {
    console.error('Erro ao criar media container no Threads:', error.response?.data || error.message);
    throw new Error('Não foi possível criar o media container.');
  }
}

/**
 * Publica um media container no Threads.
 * @param {string} accessToken - Token de acesso da API.
 * @param {string} userId - ID do usuário no Threads.
 * @param {string} creationId - ID do media container criado.
 * @returns {Promise<string>} - Retorna o ID da postagem publicada.
 */
async function publishMediaContainer(accessToken, userId, creationId) {
  if (!creationId) {
    throw new Error('O parâmetro "creationId" é obrigatório.');
  }

  try {
    const response = await axios.post(
      `${THREADS_API_BASE_URL}/${userId}/threads_publish`,
      { creation_id: creationId },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.id; // Retorna o ID da postagem publicada
  } catch (error) {
    console.error('Erro ao publicar media container no Threads:', error.response?.data || error.message);
    throw new Error('Não foi possível publicar o media container.');
  }
}

/**
 * Cria um media container para um carrossel.
 * @param {string} accessToken - Token de acesso da API.
 * @param {string} userId - ID do usuário no Threads.
 * @param {Array<string>} children - IDs dos media containers que compõem o carrossel.
 * @param {string} text - Texto opcional associado ao carrossel.
 * @returns {Promise<string>} - Retorna o ID do media container do carrossel.
 */
async function createCarouselContainer(accessToken, userId, children, text = '') {
  if (!children || children.length < 2) {
    throw new Error('O parâmetro "children" deve conter pelo menos dois IDs de media containers.');
  }

  const payload = { media_type: 'CAROUSEL', children: children.join(','), text };

  try {
    const response = await axios.post(`${THREADS_API_BASE_URL}/${userId}/threads`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    return response.data.id; // Retorna o ID do container do carrossel
  } catch (error) {
    console.error('Erro ao criar carrossel container no Threads:', error.response?.data || error.message);
    throw new Error('Não foi possível criar o carrossel container.');
  }
}

module.exports = {
  createMediaContainer,
  publishMediaContainer,
  createCarouselContainer,
};
