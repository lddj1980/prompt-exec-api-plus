const axios = require("axios");

module.exports = {
  /**
   * Processa uma integração com a API do Pexels para buscar imagens.
   * @param {string} prompt - Palavra-chave para realizar a busca de imagens.
   * @param {string} model - Não utilizado diretamente aqui, mas mantido por padrão.
   * @param {Object} modelParameters - Parâmetros de configuração para a requisição.
   * @returns {Promise<Object>} - Resultado da busca no formato { request_id, images }.
   */
  async process(prompt, model, modelParameters = {}) {
    try {
      modelParameters = modelParameters ? modelParameters : {};
      
      console.log("Iniciando integração com a API do Pexels...");

      const { api_key, query, quantidade = 5, responseKey = "pexelsBusca" } = modelParameters;

      if (!api_key) {
        throw new Error('O parâmetro "api_key" é obrigatório para autenticação na API do Pexels.');
      }

      if (!query) {
        throw new Error('O parâmetro "query" é obrigatório para a busca de imagens.');
      }

      // Configuração da URL e headers
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${quantidade}`;
      const headers = { Authorization: api_key };

      // Faz a requisição GET para a API do Pexels
      const response = await axios.get(url, { headers });

      // Mapeia as URLs das imagens retornadas
      const images = response.data.photos.map((photo) => ({
        id: photo.id,
        src: photo.src.large,
        photographer: photo.photographer,
        url: photo.url,
      }));

      console.log("Busca concluída com sucesso:", images);

      return {
        [responseKey]: {
          success: true,
          images,
        },
      };
    } catch (error) {
      console.error("Erro durante a integração com o Pexels API:", error.message);

      // Em caso de erro, retorna um JSON indicando falha
      return {
        responseKey: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};