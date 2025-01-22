const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  /**
   * Inicializa a integração com o Telegram.
   * @param {string} botToken - O token do bot fornecido pelo BotFather.
   * @param {string} channelId - O ID ou username do canal onde o bot será usado.
   */
  constructor(botToken, channelId) {
    if (!botToken) throw new Error('Bot token é obrigatório.');
    if (!channelId) throw new Error('Channel ID é obrigatório.');
    
    this.botToken = botToken;
    this.channelId = channelId;
    this.bot = new TelegramBot(botToken, { polling: false });
  }

  /**
   * Enviar uma mensagem de texto ao canal.
   * @param {string} message - A mensagem a ser enviada.
   */
  async sendMessage(message) {
    if (!message) throw new Error('Mensagem não pode estar vazia.');
    try {
      const result = await this.bot.sendMessage(this.channelId, message);
      console.log('Mensagem enviada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      throw error;
    }
  }

  /**
   * Enviar uma enquete ao canal.
   * @param {string} question - A pergunta da enquete.
   * @param {string[]} options - As opções de resposta.
   */
  async sendPoll(question, options) {
    if (!question || !options || options.length < 2) {
      throw new Error('Pergunta e pelo menos duas opções são necessárias.');
    }
    try {
      const result = await this.bot.sendPoll(this.channelId, question, options, { is_anonymous: false });
      console.log('Enquete enviada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar enquete:', error.message);
      throw error;
    }
  }

  /**
   * Enviar uma imagem ao canal.
   * @param {string} photoUrl - URL ou caminho local da imagem.
   * @param {string} [caption] - Legenda para a imagem (opcional).
   */
  async sendPhoto(photoUrl, caption = '') {
    if (!photoUrl) throw new Error('URL ou caminho da imagem é obrigatório.');
    try {
      const result = await this.bot.sendPhoto(this.channelId, photoUrl, { caption });
      console.log('Imagem enviada com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar imagem:', error.message);
      throw error;
    }
  }

  /**
   * Enviar um documento ao canal.
   * @param {string} documentPath - URL ou caminho local do documento.
   * @param {string} [caption] - Legenda para o documento (opcional).
   */
  async sendDocument(documentPath, caption = '') {
    if (!documentPath) throw new Error('Caminho do documento é obrigatório.');
    try {
      const result = await this.bot.sendDocument(this.channelId, documentPath, { caption });
      console.log('Documento enviado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar documento:', error.message);
      throw error;
    }
  }

  /**
   * Enviar um vídeo ao canal.
   * @param {string} videoPath - URL ou caminho local do vídeo.
   * @param {string} [caption] - Legenda para o vídeo (opcional).
   */
  async sendVideo(videoPath, caption = '') {
    if (!videoPath) throw new Error('Caminho do vídeo é obrigatório.');
    try {
      const result = await this.bot.sendVideo(this.channelId, videoPath, { caption });
      console.log('Vídeo enviado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar vídeo:', error.message);
      throw error;
    }
  }

  /**
   * Enviar um áudio ao canal.
   * @param {string} audioPath - URL ou caminho local do áudio.
   * @param {string} [caption] - Legenda para o áudio (opcional).
   */
  async sendAudio(audioPath, caption = '') {
    if (!audioPath) throw new Error('Caminho do áudio é obrigatório.');
    try {
      const result = await this.bot.sendAudio(this.channelId, audioPath, { caption });
      console.log('Áudio enviado com sucesso:', result);
      return result;
    } catch (error) {
      console.error('Erro ao enviar áudio:', error.message);
      throw error;
    }
  }
}

module.exports = TelegramService;