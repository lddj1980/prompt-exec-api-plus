const HtmlToImageService = require('../services/HtmlToImageService'); // Ajuste o caminho para a classe HTMLToImageService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    // Define a chave de resposta padrão ou usa a fornecida em modelParameters
    const responseKey = modelParameters.responseKey || 'htmlToImageResult';

    try {
      console.log('Iniciando integração com o HTMLToImageService...');

      const apiKey = modelParameters.api_key || null;
      const username = modelParameters.username || null;

      if (!apiKey || !username) {
        throw new Error('Os parâmetros "apiKey" e "username" são obrigatórios.');
      }

      // Instancia o serviço HTMLToImageService
      const htmlToImageService = new HtmlToImageService(modelParameters.base_url);

      // Decide qual funcionalidade usar com base nos parâmetros
      if (modelParameters.action === 'generateImage') {
        console.log('Gerando imagem a partir de HTML...');

        if (!modelParameters.html) {
          throw new Error('O parâmetro "html" é obrigatório para gerar uma imagem.');
        }

        const width = modelParameters.width || 1080; // Largura padrão
        const height = modelParameters.height || 1920; // Altura padrão
        const css = modelParameters.css || ''; // CSS adicional (opcional)

        // Chama o método original do HtmlToImageService
        const result = await htmlToImageService.generateImage(
          modelParameters.html,
          username,
          apiKey,
          width,
          height,
          css
        );

        console.log('Imagem gerada com sucesso:', result);

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: result,
          },
        };
      } else {
        throw new Error(
          'Nenhuma ação válida foi especificada. Use "generateImage" em "modelParameters.action".'
        );
      }
    } catch (error) {
      console.error('Erro durante a integração com o HTMLToImageService:', error.message);

      // Retorna o erro formatado com responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }
  },
};