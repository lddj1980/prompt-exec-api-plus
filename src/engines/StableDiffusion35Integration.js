const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Stable Diffusion 3.5 Large Text-to-Image API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "stableDiffusion35Result";

    try {
      // Get the API Key
      const apiKey =
        modelParameters.api_key || process.env.STABLE_DIFFUSION_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (STABLE_DIFFUSION_API_KEY)."
        );
      }

      // Endpoint for Stable Diffusion 3.5 Large Text-to-Image API
      const endpoint =
        "https://api.segmind.com/v1/stable-diffusion-3.5-large-txt2img";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "low quality, blurry",
        steps: modelParameters.steps || 25,
        guidance_scale: modelParameters.guidance_scale || 5.5,
        seed: modelParameters.seed || 123456,
        sampler: modelParameters.sampler || "euler",
        scheduler: modelParameters.scheduler || "sgm_uniform",
        width: modelParameters.width || 1024,
        height: modelParameters.height || 1024,
        aspect_ratio: modelParameters.aspect_ratio || "custom",
        batch_size: modelParameters.batch_size || 1,
        image_format: modelParameters.image_format || "jpeg",
        image_quality: modelParameters.image_quality || 95,
        base64: modelParameters.base64 || false,
      };

      if (!payload.prompt) {
        throw new Error("The parameter 'prompt' is required.");
      }

      console.log("Sending request to Stable Diffusion 3.5 API...");
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
        console.log("Stable Diffusion 3.5 API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString(
          "base64"
        );
        console.log("Uploading generated image to ImageRepo...");

        // Save the image to ImageRepo
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Image content in Base64
          {targetFolder:'imagerepo'}, // Metadata (add any necessary metadata here)
          ".jpeg", // File extension
          null, // ImageRepo API Key (replace with your key)
          null, // FTP configuration (adjust as needed)
          true // Specify that the content is Base64
        );

        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(
          `Stable Diffusion 3.5 API error: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error(
        "Error in Stable Diffusion 3.5 Text-to-Image integration:",
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
