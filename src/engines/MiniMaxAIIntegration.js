const axios = require("axios");
const FormData = require("form-data");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Process the MiniMax AI API integration and store the result in ImageRepo.
   * @param {string} prompt - The text description for video generation.
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "miniMaxResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.MINIMAX_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (MINIMAX_API_KEY)."
        );
      }

      // Endpoint for MiniMax AI API
      const endpoint = "https://api.segmind.com/v1/minimax-ai";

      // Prepare the FormData
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append(
        "prompt_optimizer",
        modelParameters.prompt_optimizer || true
      );
      formData.append(
        "first_frame_image",
        modelParameters.first_frame_image || "null"
      );

      // Headers for the API request
      const headers = {
        ...formData.getHeaders(),
        "x-api-key": apiKey,
      };

      console.log("Sending request to MiniMax AI API...");
      console.log("Prompt:", prompt);

      // Make the API request
      const response = await axios.post(endpoint, formData, {
        headers,
        responseType: "arraybuffer", // Expect binary data for video
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("MiniMax AI API call successful.");

        // Convert video to Base64 for ImageRepo upload
        const base64Video = Buffer.from(response.data, "binary").toString(
          "base64"
        );
        console.log("Uploading video to ImageRepo...");

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        const savedVideo = await ftpRepoService.createImage(
          base64Video, // Video content in Base64
          {targetFolder:'videorepo'}, // Metadata (add any necessary metadata here)
          ".mp4", // File extension
          null, // ImageRepo API Key (replace with your key)
          null, // FTP configuration (adjust as needed)
          true // Specify that the content is Base64
        );

        return {
          [responseKey]: {
            success: true,
            data: savedVideo,
          },
        };
      } else {
        throw new Error(`MiniMax AI API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in MiniMax AI integration:", error.message);

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
