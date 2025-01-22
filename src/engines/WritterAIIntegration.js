const axios = require('axios');
const WritterAIService = require('../services/WritterAIService'); // Ajuste o caminho para a classe WritterAIService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com o Writter-IA...');

      const writerId = modelParameters.writer_id || null;
      const apiKey = modelParameters.api_key || null;

      if (!writerId || !apiKey) {
        throw new Error('Os parâmetros "writerId" e "apiKey" são obrigatórios.');
      }

      // Instancia o serviço WritterAIService
      const writterAiAPI = new WritterAIService();

      // Decide qual funcionalidade usar com base nos parâmetros
      if (modelParameters.action === 'getOldestUnusedTitle') {
        console.log('Buscando o título mais antigo não utilizado...');
        const oldestTitle = await writterAiAPI.getOldestUnusedTitle(writerId, apiKey);

        console.log('Título obtido com sucesso:', oldestTitle);
        return {
          [responseKey]: {
            success: true,
            data: oldestTitle,
          },
        };

      } else if (modelParameters.action === 'generateContent') {
        console.log('Gerando conteúdo...');
        const generatedContent = await writterAiAPI.generateContent(writerId, apiKey);

        console.log('Conteúdo gerado com sucesso:', generatedContent);
        return {
          [responseKey]: {
            success: true,
            data: generatedContent,
          },
        };

      } else if (modelParameters.action === 'savePublication') {
        console.log('Salvando publicação...');

        if (!modelParameters.titulo_id || !modelParameters.conteudo) {
          throw new Error(
            'Os parâmetros "tituloId" e "conteudo" são obrigatórios para salvar a publicação.'
          );
        }

        const savedPublication = await writterAiAPI.savePublication(
          writerId,
          apiKey,
          modelParameters.titulo_id,
          modelParameters.conteudo
        );

        console.log('Publicação salva com sucesso:', savedPublication);
        return {
          [responseKey]: {
            success: true,
            data: savedPublication,
          },
        };

      } else {
        throw new Error(
          'Nenhuma ação válida foi especificada. Use "getOldestUnusedTitle", "generateContent" ou "savePublication" em "modelParameters.action".'
        );
      }

    } catch (error) {
      console.error('Erro durante a integração com o Writter-IA:', error.message);

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
