const axios = require('axios');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    try {
      console.log('Iniciando integração com o serviço de e-mail externo...');

      const responseKey = modelParameters.responseKey || 'response';

      // Verifica e extrai os parâmetros necessários de modelParameters
      const { from, to, subject, body } = modelParameters;

      if (!from || !to || !subject || !body) {
        throw new Error('Os parâmetros "from", "to", "subject" e "body" são obrigatórios.');
      }

      // Configuração do endpoint e headers do serviço externo
      const endpoint = 'https://emailprovider.vercel.app/api/send-email'; // Substitua pela URL do serviço externo
      const headers = {
        'Content-Type': 'application/json',
      };

      // Corpo da requisição
      const requestBody = { from, to, subject, body };

      // Faz a requisição POST para o serviço externo
      const response = await axios.post(endpoint, requestBody, { headers });

      if (response.status === 200 && response.data.success) {
        console.log('E-mail enviado com sucesso:', response.data);

        // Retorna a resposta formatada com `responseKey`
        return {
          [responseKey]: {
            success: true,
            data: {
              provider: response.data.provider || 'Desconhecido',
              message: 'E-mail enviado com sucesso.',
            },
          },
        };
      } else {
        console.error('Falha no envio de e-mail:', response.data);
        return {
          [responseKey]: {
            success: false,
            error: response.data.error || 'Falha ao enviar o e-mail.',
          },
        };
      }
    } catch (error) {
      console.error('Erro ao integrar com o serviço de e-mail:', error.message);

      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
      }

      // Retorna o erro formatado com `responseKey`
      return {
        [modelParameters.responseKey || 'response']: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};
