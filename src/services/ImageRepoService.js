const axios = require('axios');

class ImageRepoAPI {
  /**
   * Inicializa a integração com o serviço de criação de imagens.
   * @param {string} baseURL - A URL base da API do Image Repo.
   */
  constructor(baseURL = 'https://image-repo-iota.vercel.app/api/images') {
    this.baseURL = baseURL;
  }

  /**
   * Cria uma imagem no serviço de repositório de imagens.
   * @param {string} imageUrl - URL da imagem a ser armazenada.
   * @param {object} metadata - Metadados da imagem.
   * @param {string} metadata.description - Descrição da imagem.
   * @param {Array<string>} metadata.tags - Tags associadas à imagem.
   * @param {string} extension - Extensão do arquivo da imagem (e.g., '.jpg', '.png').
   * @returns {Promise<object>} - Resposta da API com os detalhes da imagem criada.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async createImage(imageUrl, metadata, extension, apiKey, ftpConfigId,base64=false) {
    if (!imageUrl || !metadata || !extension || !apiKey || !ftpConfigId) {
      throw new Error('imageUrl, metadata, extension, apiKey and ftpConfigId are required.');
    }

    const payload = {
      imageUrl,
      metadata,
      extension,
      ftpConfigId,
      base64
    };

    console.log('Creating image with payload:', payload);

    try {
      const response = await axios.post(this.baseURL, payload, {
        headers: { 'Content-Type': 'application/json', 'x-api-key':apiKey },
      });

      console.log('Image created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during Image Repo API call:', error.message);
      throw new Error(`Image Repo API call failed: ${error.message}`);
    }
  }
}

module.exports = ImageRepoAPI;