const axios = require('axios');

class WritterAIService {
  /**
   * Inicializa a integração com a API Writter-IA.
   * @param {string} baseURL - A URL base do serviço Writter-IA.
   */
  constructor(baseURL = 'https://writter-ia.glitch.me') {
    this.baseURL = baseURL;
  }

  /**
   * Chama o endpoint do Writter-IA para gerar conteúdo baseado no título mais antigo não utilizado.
   * @param {number} writerId - ID do redator.
   * @param {string} apiKey - API Key do redator.
   * @returns {Promise<object>} - Resultado da publicação gerada.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async generateContent(writerId, apiKey) {
    const url = `${this.baseURL}/${writerId}`;
    console.log(`Calling Writter-IA API at: ${url}`);

    try {
      const response = await axios.post(
        url,
        {}, // Corpo vazio, pois os parâmetros estão no cabeçalho e na rota
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('Writter-IA result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during Writter-IA API call:', error.message);
      throw new Error(`Writter-IA API call failed: ${error.message}`);
    }
  }
  
  /**
   * Obtém o título mais antigo não utilizado para um redator.
   * @param {number} writerId - ID do redator.
   * @param {string} apiKey - API Key do redator.
   * @returns {Promise<object>} - Título mais antigo não utilizado.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async getOldestUnusedTitle(writerId, apiKey) {
    const url = `${this.baseURL}/redator/${writerId}/titulo-mais-antigo`;
    console.log(`Fetching oldest unused title from: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      console.log('Oldest unused title result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching oldest unused title:', error.message);
      throw new Error(`Failed to fetch oldest unused title: ${error.message}`);
    }
  }

  /**
   * Salva uma publicação associada a um título e a um conteúdo para um redator.
   * @param {number} writerId - ID do redator.
   * @param {string} apiKey - API Key do redator.
   * @param {number} tituloId - ID do título a ser associado.
   * @param {string} conteudo - Conteúdo a ser salvo.
   * @returns {Promise<object>} - Resultado da publicação salva.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async savePublication(writerId, apiKey, tituloId, conteudo) {
    const url = `${this.baseURL}/redator/${writerId}/publicacao`;
    console.log(`Saving publication to: ${url}`);

    try {
      const response = await axios.post(
        url,
        { titulo_id: tituloId, conteudo }, // Corpo da requisição
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('Publication saved result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error saving publication:', error.message);
      throw new Error(`Failed to save publication: ${error.message}`);
    }
  }
  
  
}

module.exports = WritterAIService;