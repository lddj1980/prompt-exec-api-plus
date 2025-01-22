const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Process the SadTalker API integration.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API.
   */
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'sadTalkerResult';

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.SADTALKER_API_KEY;
      if (!apiKey) {
        throw new Error('The API Key (api_key) is required and must be provided or configured as an environment variable (SADTALKER_API_KEY).');
      }

      // Endpoint for SadTalker API
      const endpoint = 'https://api.segmind.com/v1/sadtalker';

      // Payload for the API request
      const payload = {
        input_image: modelParameters.input_image,
        input_audio: modelParameters.input_audio,
        pose_style: modelParameters.pose_style || 4,
        expression_scale: modelParameters.expression_scale || 1.4,
        preprocess: modelParameters.preprocess || 'full',
        image_size: modelParameters.image_size || 256,
        enhancer: modelParameters.enhancer || true,
        base64: modelParameters.base64 || true,
      };

      // Headers for the API request
      const headers = {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      };

      console.log('Sending request to SadTalker API...');
      console.log('Payload:', JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, { headers });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log('SadTalker API call successful.');

        // If `base64` is true, save the image to ImageRepo
        if (response.data.base64) {
          const base64Image = response.data.output_image;
          console.log('Saving generated image to ImageRepo...');

          const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
          // Instancia o serviço de FTP
          const ftpRepoService = new FtpRepoService(config);
          
          // Instantiate the ImageRepo API
          const savedImage = await ftpRepoService.createImage(
          base64Image, // Conteúdo em Base64
          {targetFolder:'imagerepo'}, // Metadados da imagem
          `.jpg`, // Extensão do arquivo
          null, 
          null, 
          true // Define que o conteúdo está em Base64
          );

          // Return the saved image details
          return {
            [responseKey]: {
              success: true,
              data: savedImage,
            },
          };
        }

        // If not Base64, return the direct API response
        return {
          [responseKey]: {
            success: true,
            data: response.data,
          },
        };
      } else {
        throw new Error(`SadTalker API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in SadTalker integration:', error.message);

      // Return error response
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
