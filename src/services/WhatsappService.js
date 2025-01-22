const axios = require('axios');

class WhatsappService {
  /**
   * Inicializa a integração com o serviço de proxy do WhatsApp.
   * @param {string} baseURL - A URL base do serviço de proxy do WhatsApp.
   */
  constructor(baseURL = 'https://wzp-publish-v2.onrender.com/api/whatsapp') {
    this.baseURL = baseURL;
  }

  /**
   * Envia uma mensagem de texto para um número específico via o serviço de proxy.
   * @param {string} number - Número do destinatário (formato internacional, ex.: 551199999999).
   * @param {string} message - Mensagem a ser enviada.
   * @param {string} apiKey - API Key do serviço de proxy.
   * @returns {Promise<object>} - Resultado da operação.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async sendMessage(number, message, apiKey) {
    const url = `${this.baseURL}/send-message`;
    console.log(`Calling WhatsApp Proxy API at: ${url}`);

    try {
      const response = await axios.post(
        url,
        { number, message },
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('WhatsApp Proxy result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during WhatsApp Proxy API call:', error.message);
      throw new Error(`WhatsApp Proxy API call failed: ${error.message}`);
    }
  }

  /**
   * Envia uma mensagem com mídia (imagem, vídeo, etc.) para um número específico via o serviço de proxy.
   * @param {string} number - Número do destinatário (formato internacional, ex.: 551199999999).
   * @param {string} mediaUrl - URL da mídia que será enviada.
   * @param {string} mimeType - Tipo MIME da mídia (ex.: image/png, video/mp4).
   * @param {string} fileName - Nome do arquivo que será exibido no WhatsApp.
   * @param {string} caption - Legenda opcional para a mídia.
   * @param {string} apiKey - API Key do serviço de proxy.
   * @returns {Promise<object>} - Resultado da operação.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async sendMedia(number, mediaUrl, mimeType, fileName, caption, apiKey) {
    const url = `${this.baseURL}/send-media`;
    console.log(`Calling WhatsApp Proxy API at: ${url}`);

    try {
      const response = await axios.post(
        url,
        { number, mediaUrl, mimeType, fileName, caption },
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('WhatsApp Proxy result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during WhatsApp Proxy API call:', error.message);
      throw new Error(`WhatsApp Proxy API call failed: ${error.message}`);
    }
  }

  /**
   * Envia uma mensagem para um grupo via o serviço de proxy do WhatsApp.
   * @param {string} groupId - ID do grupo (formato do WhatsApp, ex.: 12345@g.us).
   * @param {string} message - Mensagem a ser enviada.
   * @param {string} apiKey - API Key do serviço de proxy.
   * @returns {Promise<object>} - Resultado da operação.
   * @throws {Error} - Caso ocorra algum erro na chamada ao serviço.
   */
  async sendGroupMessage(groupId, message, apiKey) {
    const url = `${this.baseURL}/send-group-message`;
    console.log(`Calling WhatsApp Proxy API at: ${url}`);

    try {
      const response = await axios.post(
        url,
        { groupId, message },
        {
          headers: {
            'x-api-key': apiKey,
          },
        }
      );

      console.log('WhatsApp Proxy result:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error during WhatsApp Proxy API call:', error.message);
      throw new Error(`WhatsApp Proxy API call failed: ${error.message}`);
    }
  }
}

module.exports = WhatsappService;