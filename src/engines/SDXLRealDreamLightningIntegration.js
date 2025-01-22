const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para a classe FtpRepoService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Iniciando integração com a SDXL RealDream Lightning API...');

      // Validação dos parâmetros obrigatórios
      const apiKey = modelParameters.api_key || process.env.SEGMIND_API_KEY;
      if (!apiKey) {
        throw new Error("O parâmetro 'api_key' é obrigatório ou deve ser definido como variável de ambiente.");
      }

      const {
        prompt: textPrompt,
        negative_prompt,
        samples,
        scheduler,
        num_inference_steps,
        guidance_scale,
        seed,
        img_width,
        img_height,
        base64
      } = modelParameters;

      if (!textPrompt) {
        throw new Error("O parâmetro 'prompt' é obrigatório.");
      }

      // Monta o payload para a API
      const payload = {
        prompt: textPrompt,
        negative_prompt: negative_prompt || '',
        samples: samples || 1,
        scheduler: scheduler || 'DPM++ SDE',
        num_inference_steps: num_inference_steps || 8,
        guidance_scale: guidance_scale || 1.2,
        seed: seed || Math.floor(Math.random() * 100000),
        img_width: img_width || 768,
        img_height: img_height || 1152,
        base64: base64 || true, // Recebe como base64 para salvar no FTP
      };

      const endpoint = 'https://api.segmind.com/v1/sdxl1.0-realdream-lightning';

      // Faz a requisição para a API
      console.log('Enviando requisição para SDXL RealDream Lightning API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: "arraybuffer"
      });

      if (response.status === 200 && response.data) {
        console.log('Requisição concluída com sucesso.');

        const base64Image = Buffer.from(response.data, "binary").toString("base64");

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        
        // Salva a imagem no FTP
        console.log('Enviando imagem gerada para o FTP...');
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Image content in Base64
          {targetFolder:'imagerepo'}, // Metadata (add any necessary metadata here)
          ".jpeg", // File extension
          null, // ImageRepo API Key (replace with your key)
          null, // FTP configuration (adjust as needed)
          true // Specify that the content is Base64
        );

        // Retorna a resposta formatada com o responseKey
        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Erro ao processar com SDXL RealDream Lightning API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro na integração com a SDXL RealDream Lightning API:', error);

      // Retorna o erro formatado com responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }

    // Função auxiliar para calcular o tamanho do Base64 em bytes
    function calculateBase64Size(base64String) {
      const base64 = base64String.split(',').pop(); // Remove cabeçalho, se houver
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};
