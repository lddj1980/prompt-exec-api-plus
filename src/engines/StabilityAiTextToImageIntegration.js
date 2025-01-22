const axios = require("axios");
const FormData = require("form-data");
const FtpRepoService = require("../services/FtpRepoService"); // Adjust the path to the FtpRepoService class

module.exports = {
  /**
   * Process the Stability AI image generation API integration.
   * @param {string} prompt - The text description for image generation.
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and FTP upload.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    const responseKey = modelParameters.responseKey || "stabilityAIResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.STABILITY_AI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (STABILITY_AI_API_KEY)."
        );
      }

      const outputFormat = modelParameters.output_format || "webp";
      // Endpoint for Stability AI image generation
      const endpoint = "https://api.stability.ai/v2beta/stable-image/generate/ultra";

      // Prepare the FormData payload
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("output_format", outputFormat);

      console.log("Sending request to Stability AI API...");
      console.log("Payload:", formData);

      // Make the API request
      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...formData.getHeaders()
        }
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Stability AI API call successful.");
        console.log(response.data);

        // Configure FTP parameters
        const ftpConfig = {
          ftpHost: process.env.FTP_HOST || "ftp.travelzviagensturismo.com",
          ftpPort: 21,
          ftpUser: process.env.FTP_USER || "pddidg3z",
          ftpPassword: process.env.FTP_PASSWORD || "q9VB0fdr28",
          baseDomain: process.env.BASE_DOMAIN || "https://travelzviagensturismo.com",
          rootDir: process.env.FTP_ROOT_DIR || "/public_html/",
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(ftpConfig);

        console.log("Uploading generated image to FTP...");
        const savedImage = await ftpRepoService.createImage(
          response.data.image, 
          { targetFolder: "imagerepo" }, // Metadata
          `.${outputFormat}`, // File extension
          null,
          null,
          true // Indicates that the content is in Base64 format
        );

        console.log("Image uploaded successfully to FTP.");
        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Stability AI API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Stability AI integration:", error.message);

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
