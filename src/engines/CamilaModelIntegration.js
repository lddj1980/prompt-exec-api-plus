const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Camila Model API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency with other integrations.
   * @param {string} model - Placeholder for consistency with other integrations.
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "camilaModelResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.CAMILA_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (CAMILA_API_KEY)."
        );
      }

      // Endpoint for Camila Model API
      const endpoint = "https://api.segmind.com/v1/8820cf0d-08bc-44e6-9398-a3c14a780723-camila";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        steps: modelParameters.steps || 25,
        seed: modelParameters.seed || Math.floor(Math.random() * 1e8),
        scheduler: modelParameters.scheduler || "simple",
        sampler_name: modelParameters.sampler_name || "euler",
        aspect_ratio: modelParameters.aspect_ratio || "1:1",
        lora_strength: modelParameters.lora_strength || 1.5,
        image_format : modelParameters.image_format || 'jpg'
      };

      if (!payload.prompt) {
        throw new Error("The parameter 'prompt' is required.");
      }

      console.log("Sending request to Camila Model API...");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for the image
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Camila Model API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading image to ImageRepo...");

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);

        // Salva a imagem no FTP
        console.log('Enviando imagem gerada para o FTP...');
        
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Conteúdo em Base64
          {
            targetFolder:'imagerepo'
          }, // Metadados da imagem
          `.${payload.image_format}`, // Extensão do arquivo
          null, 
          null, 
          true // Define que o conteúdo está em Base64
        );

        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Camila Model API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Camila Model integration:", error.message);

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