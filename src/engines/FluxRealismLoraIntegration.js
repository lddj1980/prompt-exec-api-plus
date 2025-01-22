const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Flux Realism Lora API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "fluxRealismResult";

    try {
      // Get the API Key
      const apiKey =
        modelParameters.api_key || process.env.FLUX_REALISM_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (FLUX_REALISM_API_KEY)."
        );
      }

      // Endpoint for Flux Realism Lora API
      const endpoint = "https://api.segmind.com/v1/flux-realism-lora";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        steps: modelParameters.steps || 20,
        seed: modelParameters.seed || 6652105,
        scheduler: modelParameters.scheduler || "simple",
        sampler_name: modelParameters.sampler_name || "euler",
        aspect_ratio: modelParameters.aspect_ratio || "2:3",
        width: modelParameters.width || 1024,
        height: modelParameters.height || 1024,
        upscale_value: modelParameters.upscale_value || 2,
        lora_strength: modelParameters.lora_strength || 0.8,
        samples: modelParameters.samples || 1,
        upscale: modelParameters.upscale || false,
        image_format: modelParameters.image_format || 'jpg'
      };

      if (!payload.prompt) {
        throw new Error("The parameter 'prompt' is required.");
      }

      console.log("Sending request to Flux Realism Lora API...");
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
        console.log("Flux Realism Lora API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString(
          "base64"
        );
        console.log("Uploading generated image to ImageRepo...");
        
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);

        // Salva a imagem no FTP
        console.log('Enviando imagem gerada para o FTP...');
        
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Conteúdo em Base64
          {targetFolder:'imagerepo'}, // Metadados da imagem
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
        throw new Error(
          `Flux Realism Lora API error: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        "Error in Flux Realism Lora integration:",
        error.message
      );

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
