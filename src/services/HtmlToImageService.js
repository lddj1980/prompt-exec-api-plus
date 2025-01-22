const axios = require('axios');

class HTMLToImageService {
  /**
   * Inicializa a integração com a API HCTI.
   * @param {string} baseURL - A URL base da API HCTI (padrão: 'https://hcti.io/v1/image').
   */
  constructor(baseURL = 'https://hcti-publish.glitch.me/api/proxy/generate-image') {
    this.baseURL = baseURL;
  }

  /**
   * Gera uma imagem a partir de um código HTML.
   * @param {string} html - O código HTML a ser renderizado em imagem.
   * @param {string} username - Nome de usuário para autenticação da API HCTI.
   * @param {string} apiKey - Chave de API para autenticação da API HCTI.
   * @param {number} width - Largura da imagem gerada (em pixels).
   * @param {number} height - Altura da imagem gerada (em pixels).
   * @param {string} css - CSS adicional para estilizar o HTML (opcional, padrão: "").
   * @returns {Promise<string>} - URL da imagem gerada.
   * @throws {Error} - Caso ocorra algum erro na chamada à API.
   */
  async generateImage(html, username, apiKey, width = 1080, height = 1920, css = '') {
    console.log(`Generating image with width: ${width}, height: ${height}`);

    try {
      const response = await axios.post(
        this.baseURL,
        {
          html,
          css,
          width,
          height,
        },
        {
            headers: {
                'x-api-key': 'b27f943c709a6d1d9b9fc91db4f14c2c46a8e735b63e48d9f7b0e3f9f0cfae2b'
            }
        }
      );

      console.log('Image successfully generated:', response.data.url);
      return response.data.url; // Retorna a URL da imagem gerada
    } catch (error) {
      console.error('Error generating image:', error.message);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }
}

module.exports = HTMLToImageService;