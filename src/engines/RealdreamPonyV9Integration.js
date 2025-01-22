const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Realdream Pony V9 API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "realdreamPonyV9Result";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.REALDREAM_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (REALDREAM_API_KEY)."
        );
      }

      // Endpoint for Realdream Pony V9 API
      const endpoint = "https://api.segmind.com/v1/sdxl1.0-realdream-pony-v9";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "",
        samples: modelParameters.samples || 1,
        scheduler: modelParameters.scheduler || "DPM++ 2M SDE Karras",
        num_inference_steps: modelParameters.num_inference_steps || 25,
        guidance_scale: modelParameters.guidance_scale || 7,
        seed: modelParameters.seed || 968875,
        img_width: modelParameters.img_width || 768,
        img_height: modelParameters.img_height || 1152,
        base64: modelParameters.base64 || false,
      };

      if (!payload.prompt) {
        throw new Error("The parameter 'prompt' is required.");
      }

      console.log("Sending request to Realdream Pony V9 API...");
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
        console.log("Realdream Pony V9 API call successful.");

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
          `Realdream Pony V9 API error: ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("Error in Realdream Pony V9 integration:", error.message);

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
