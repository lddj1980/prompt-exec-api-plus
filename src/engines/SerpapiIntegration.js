const axios = require("axios");

module.exports = {
  /**
   * Integração com o SERP API para diferentes serviços do Google.
   * @param {string} prompt - Termo de pesquisa.
   * @param {string} model - Tipo de pesquisa (e.g., "google_search").
   * @param {Object} modelParameters - Parâmetros de configuração da integração.
   * @returns {Promise<Object>} - Resposta da API no formato { responseKey: { success, data } }.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters ? modelParameters : {};
    const responseKey = modelParameters.responseKey ? modelParameters.responseKey : "default";

    try {
      console.log(`Iniciando integração com o modelo ${model}...`);

      const endpoint = getEndpoint(model);
      if (!modelParameters.api_key) {
        throw new Error("O parâmetro 'api_key' é obrigatório.");
      }
      
      
      if (!endpoint) {
        throw new Error("Modelo não suportado.");
      }

      const params = {
        ...modelParameters,
      };
      
      console.log(endpoint);
      console.log({params});
      
      const response = await axios.get(endpoint, { params });

      if (response.status === 200) {
        console.log("Consulta realizada com sucesso:", response.data);
        return {
          [responseKey]: {
            success: true,
            data: response.data,
          },
        };
      } else {
        throw new Error(`Erro na consulta: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro durante a integração:", error.message);
      if (error.response) {
        console.error("Detalhes do erro:", error.response.data);
      }
      return {
        [responseKey]: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};

/**
 * Mapeia o modelo para o endpoint da API correspondente.
 * @param {string} model - Tipo de modelo.
 * @returns {string|null} - URL do endpoint ou null se não encontrado.
 */
function getEndpoint(model) {
  const endpoints = {
    google_search: "https://serpapi.com/search.json?engine=google",
    google_maps: "https://serpapi.com/search.json?engine=google_maps",
    google_finance: "https://serpapi.com/search.json?engine=google_finance",
    google_trends: "https://serpapi.com/search.json?engine=google_trends",
    google_flights: "https://serpapi.com/search.json?engine=google_flights",
  };
  return endpoints[model] || null;
}
