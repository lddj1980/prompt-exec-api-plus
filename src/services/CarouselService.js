const axios = require('axios');

class CarouselService {
  /**
   * Inicializa a integração com a API de Carousel.
   * @param {string} baseURL - A URL base da API.
   */
  constructor(baseURL = 'https://carroselgen-ia.glitch.me/api/carousel') {
    this.baseURL = baseURL;
  }

  /**
   * Gera um carousel com os dados fornecidos.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {object} payload - Os dados do corpo da requisição.
   * @returns {Promise<object>} - Os dados retornados pela API.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async generateCarousel(apiKey, payload) {
    const url = `${this.baseURL}`;
    console.log(`Generating Carousel: ${url}`);
    console.log(apiKey);
    console.log(payload);
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      console.log('Carousel generated:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during Carousel API call:', error.message);
      throw new Error(`Carousel API call failed: ${error.message}`);
    }
  }

  /**
   * Consulta o progresso de geração do carousel.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {string} progressId - O ID de progresso da requisição.
   * @returns {Promise<object>} - Os dados retornados pela API.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async getProgress(apiKey, progressId) {
    const url = `${this.baseURL}/progress/${progressId}`;
    console.log(`Fetching Carousel Progress: ${url}`);
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      console.log('Progress fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during progress check:', error.message);
      throw new Error(`Progress API call failed: ${error.message}`);
    }
  }

  /**
   * Consulta as imagens de um carousel gerado.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {string} carouselId - O ID do carousel para consulta.
   * @returns {Promise<object[]>} - Lista de slides com URLs das imagens e datas de geração.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async getCarousel(apiKey, carouselId) {
    const url = `${this.baseURL}/${carouselId}`;
    console.log(`Fetching Carousel: ${url}`);
    try {
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      console.log('Carousel fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during carousel fetch:', error.message);
      throw new Error(`Carousel API call failed: ${error.message}`);
    }
  }
}

module.exports = CarouselService;