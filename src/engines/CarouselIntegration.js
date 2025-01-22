const CarouselService = require('../services/CarouselService'); // Ajuste o caminho para a classe CarouselService

module.exports = {
  async process(prompt, modelo, parametros_modelo) {
    try {
      parametros_modelo = parametros_modelo || {};
      console.log('Iniciando integração com o Carousel API...');

      const apiKey = parametros_modelo.api_key || null;
      const responseKey = parametros_modelo.responseKey || 'response';

      if (!apiKey) {
        throw new Error('O parâmetro "apiKey" é obrigatório.');
      }

      // Instancia o serviço CarouselService
      const carouselService = new CarouselService(parametros_modelo.base_url);

      let result;

      // Decide qual funcionalidade usar com base nos parâmetros
      if (parametros_modelo.action === 'generateCarousel') {
        // Gera um carousel
        console.log('Gerando carousel...');
        if (!parametros_modelo.payload) {
          throw new Error('O parâmetro "payload" é obrigatório para gerar um carousel.');
        }

        result = await carouselService.generateCarousel(apiKey, parametros_modelo.payload);

        console.log('Carousel gerado com sucesso:', result);

      } else if (parametros_modelo.action === 'getProgress') {
        // Consulta o progresso da geração de um carousel
        console.log('Consultando progresso do carousel...');
        if (!parametros_modelo.progress_id) {
          throw new Error('O parâmetro "progressId" é obrigatório para consultar o progresso.');
        }

        result = await carouselService.getProgress(apiKey, parametros_modelo.progress_id);

        console.log('Progresso consultado com sucesso:', result);

      } else if (parametros_modelo.action === 'getCarousel') {
        // Consulta as imagens de um carousel gerado
        console.log('Consultando carousel gerado...');
        if (!parametros_modelo.carousel_id) {
          throw new Error('O parâmetro "carouselId" é obrigatório para consultar o carousel.');
        }

        result = await carouselService.getCarousel(apiKey, parametros_modelo.carousel_id);

        console.log('Carousel consultado com sucesso:', result);

      } else {
        throw new Error(
          'Nenhuma ação válida foi especificada. Use "generateCarousel", "getProgress" ou "getCarousel" em "parametros_modelo.action".'
        );
      }

      // Retorna a resposta estruturada com responseKey
      return {
        [responseKey]: {
          success: true,
          data: result,
        },
      };

    } catch (error) {
      console.error('Erro durante a integração com o Carousel API:', error.message);

      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
      }

      // Retorna erro estruturado com responseKey
      return {
        [parametros_modelo.responseKey || 'response']: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};
