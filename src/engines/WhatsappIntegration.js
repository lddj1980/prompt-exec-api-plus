const axios = require('axios');
const WhatsappService = require('../services/WhatsappService'); // Ajuste o caminho para a classe WhatsappService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    // Define a chave de resposta padrão ou usa a fornecida em modelParameters
    const responseKey = modelParameters.responseKey || 'whatsappResult';

    try {
      console.log('Iniciando integração com o WhatsApp Proxy API...');

      const apiKey = modelParameters.api_key || null;

      if (!apiKey) {
        throw new Error('O parâmetro "apiKey" é obrigatório.');
      }

      // Instancia o serviço WhatsappService
      const whatsappService = new WhatsappService(modelParameters.base_url);

      // Decide qual funcionalidade usar com base nos parâmetros
      if (modelParameters.action === 'sendMessage') {
        console.log('Enviando mensagem de texto...');

        if (!modelParameters.number || !modelParameters.message) {
          throw new Error(
            'Os parâmetros "number" e "message" são obrigatórios para enviar uma mensagem de texto.'
          );
        }

        // Chama o método original do WhatsappService
        const result = await whatsappService.sendMessage(
          modelParameters.number,
          modelParameters.message,
          apiKey
        );

        console.log('Mensagem enviada com sucesso:', result);

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: result,
          },
        };

      } else if (modelParameters.action === 'sendMedia') {
        console.log('Enviando mensagem com mídia...');

        if (
          !modelParameters.number ||
          !modelParameters.media_url ||
          !modelParameters.mime_type ||
          !modelParameters.file_name
        ) {
          throw new Error(
            'Os parâmetros "number", "mediaUrl", "mimeType" e "fileName" são obrigatórios para enviar uma mensagem com mídia.'
          );
        }

        // Chama o método original do WhatsappService
        const result = await whatsappService.sendMedia(
          modelParameters.number,
          modelParameters.media_url,
          modelParameters.mime_type,
          modelParameters.file_name,
          modelParameters.caption || '',
          apiKey
        );

        console.log('Mensagem com mídia enviada com sucesso:', result);

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: result,
          },
        };

      } else if (modelParameters.action === 'sendGroupMessage') {
        console.log('Enviando mensagem para um grupo...');

        if (!modelParameters.group_id || !modelParameters.message) {
          throw new Error(
            'Os parâmetros "groupId" e "message" são obrigatórios para enviar uma mensagem para um grupo.'
          );
        }

        // Chama o método original do WhatsappService
        const result = await whatsappService.sendGroupMessage(
          modelParameters.group_id,
          modelParameters.message,
          apiKey
        );

        console.log('Mensagem para o grupo enviada com sucesso:', result);

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: result,
          },
        };

      } else {
        throw new Error(
          'Nenhuma ação válida foi especificada. Use "sendMessage", "sendMedia" ou "sendGroupMessage" em "modelParameters.action".'
        );
      }
    } catch (error) {
      console.error('Erro durante a integração com o WhatsApp Proxy API:', error.message);

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