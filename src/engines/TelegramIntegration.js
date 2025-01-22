const TelegramService = require('../services/TelegramService'); // Ajuste o caminho para a classe TelegramService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com o Telegram...');

      const botToken = modelParameters.bot_token || null;
      const channelId = modelParameters.channel_id || null;

      if (!botToken || !channelId) {
        throw new Error('Os parâmetros "botToken" e "channelId" são obrigatórios.');
      }

      // Instancia o serviço TelegramService
      const telegramService = new TelegramService(botToken, channelId);

      let result;

      // Decide qual funcionalidade usar com base nos parâmetros
      switch (modelParameters.action) {
        case 'sendMessage':
          console.log('Enviando mensagem de texto...');
          if (!modelParameters.message) {
            throw new Error('O parâmetro "message" é obrigatório para enviar uma mensagem de texto.');
          }
          result = await telegramService.sendMessage(modelParameters.message);
          console.log('Mensagem enviada com sucesso:', result);
          break;

        case 'sendPoll':
          console.log('Enviando enquete...');
          if (!modelParameters.question || !modelParameters.options) {
            throw new Error(
              'Os parâmetros "question" e "options" são obrigatórios para enviar uma enquete.'
            );
          }
          result = await telegramService.sendPoll(
            modelParameters.question,
            modelParameters.options
          );
          console.log('Enquete enviada com sucesso:', result);
          break;

        case 'sendPhoto':
          console.log('Enviando imagem...');
          if (!modelParameters.photo_url) {
            throw new Error('O parâmetro "photoUrl" é obrigatório para enviar uma imagem.');
          }
          result = await telegramService.sendPhoto(
            modelParameters.photo_url,
            modelParameters.caption || ''
          );
          console.log('Imagem enviada com sucesso:', result);
          break;

        case 'sendDocument':
          console.log('Enviando documento...');
          if (!modelParameters.document_path) {
            throw new Error('O parâmetro "documentPath" é obrigatório para enviar um documento.');
          }
          result = await telegramService.sendDocument(
            modelParameters.document_path,
            modelParameters.caption || ''
          );
          console.log('Documento enviado com sucesso:', result);
          break;

        case 'sendVideo':
          console.log('Enviando vídeo...');
          if (!modelParameters.video_path) {
            throw new Error('O parâmetro "videoPath" é obrigatório para enviar um vídeo.');
          }
          result = await telegramService.sendVideo(
            modelParameters.video_path,
            modelParameters.caption || ''
          );
          console.log('Vídeo enviado com sucesso:', result);
          break;

        case 'sendAudio':
          console.log('Enviando áudio...');
          if (!modelParameters.audio_path) {
            throw new Error('O parâmetro "audioPath" é obrigatório para enviar um áudio.');
          }
          result = await telegramService.sendAudio(
            modelParameters.audio_path,
            modelParameters.caption || ''
          );
          console.log('Áudio enviado com sucesso:', result);
          break;

        default:
          throw new Error(
            'Nenhuma ação válida foi especificada. Use "sendMessage", "sendPoll", "sendPhoto", "sendDocument", "sendVideo" ou "sendAudio" em "modelParameters.action".'
          );
      }

      // Retorna a resposta encapsulada com o responseKey
      return {
        [responseKey]: {
          success: true,
          data: result,
        },
      };
    } catch (error) {
      console.error('Erro durante a integração com o Telegram:', error.message);

      // Retorna o erro encapsulado com o responseKey
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
