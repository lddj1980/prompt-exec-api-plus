const axios = require('axios');

class BrainstormAIService {
  /**
   * Inicializa a integração com a API Brainstorm.
   * @param {string} baseURL - A URL base da API.
   */
  constructor(baseURL = 'https://brainstorm-ia.glitch.me') {
    this.baseURL = baseURL;
  }

  /**
   * Executa o script Brainstorm com os parâmetros fornecidos.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {string} pathParameter - O parâmetro de caminho específico para a chamada.
   * @returns {Promise<object>} - Os dados retornados pela API.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async execute(apiKey, pathParameter) {
    const url = `${this.baseURL}/brainstorm/${pathParameter}`;
    console.log(`Executing Brainstorm Script: ${url}`);

    try {
      const response = await axios.post(
        url,
        {}, // Corpo vazio para a requisição POST
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('Brainstorm result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during Brainstorm API call:', error.message);
      throw new Error(`Brainstorm API call failed: ${error.message}`);
    }
  }
  
/**
   * Obtém os últimos 10 títulos de um redator.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {string} writerId - O ID do redator.
   * @returns {Promise<object>} - Os títulos retornados pela API.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async getLastTitles(apiKey, writerId) {
    const url = `${this.baseURL}/redator/${writerId}/titulos`;
    console.log(`Fetching last titles: ${url}`);

    try {
      const response = await axios.get(url, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      console.log('Last titles result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching last titles:', error.message);
      throw new Error(`Failed to fetch last titles: ${error.message}`);
    }
  }

  /**
   * Cria novos títulos e associa-os a um brainstorm.
   * @param {string} apiKey - A chave de API necessária para autenticação.
   * @param {string} writerId - O ID do redator.
   * @param {Array<string>} titles - A lista de títulos a ser criada.
   * @returns {Promise<object>} - A resposta da API.
   * @throws {Error} - Se ocorrer algum erro durante a chamada.
   */
  async createTitles(apiKey, writerId, titles) {
    const url = `${this.baseURL}/redator/${writerId}/titulos`;
    console.log(`Creating new titles: ${url}`);

    if (!Array.isArray(titles) || titles.length === 0) {
      throw new Error('The titles parameter must be a non-empty array.');
    }
    console.log({titles});
    try {
      const response = await axios.post(
        url,
        { titles }, // Corpo da requisição com os títulos
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('Create titles result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating titles:', error.message);
      throw new Error(`Failed to create titles: ${error.message}`);
    }
  }
  
  
  
  
}

module.exports = BrainstormAIService;
