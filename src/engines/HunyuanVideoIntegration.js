const axios = require("axios");
const ImageRepoAPI = require("../services/ImageRepoService"); // Adjust the path to your ImageRepoService
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Process the Hunyuan AI Video Generator API integration and store the result in ImageRepo.
   * @param {string} prompt - The text description for video generation.
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "hunyuanVideoResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.HUNYUAN_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (HUNYUAN_API_KEY)."
        );
      }

      // Endpoint for Hunyuan AI Video Generator API
      const endpoint = "https://api.segmind.com/v1/hunyuan-video";

      // Prepare the payload
      const payload = {
        seed: modelParameters.seed || 96501778,
        width: modelParameters.width || 854,
        height: modelParameters.height || 480,
        prompt: prompt,
        flow_shift: modelParameters.flow_shift || 7,
        infer_steps: modelParameters.infer_steps || 40,
        video_length: modelParameters.video_length || 77,
        negative_prompt:
          modelParameters.negative_prompt ||
          "Aerial view, overexposed, low quality, deformation",
        embedded_guidance_scale:
          modelParameters.embedded_guidance_scale || 6,
      };

      // Headers for the API request
      const headers = {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      };

      console.log("Sending request to Hunyuan AI Video Generator API...");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, {
        headers,
        responseType: "arraybuffer", // Expect binary data for video
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Hunyuan AI API call successful.");

        // Convert video to Base64 for ImageRepo upload
        const base64Video = Buffer.from(response.data, "binary").toString(
          "base64"
        );
        console.log("Uploading video to ImageRepo...");

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);

        const savedVideo = await ftpRepoService.createImage(
          base64Video, // Conteúdo em Base64
          {targetFolder:'videorepo'}, // Metadados da imagem
          `.mp4`, // Extensão do arquivo
          null, 
          null, 
          true // Define que o conteúdo está em Base64
          );

        return {
          [responseKey]: {
            success: true,
            data: savedVideo,
          },
        };
      } else {
        throw new Error(`Hunyuan AI Video API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Hunyuan AI Video integration:", error.message);

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
