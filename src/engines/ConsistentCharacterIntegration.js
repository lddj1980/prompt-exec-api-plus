const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const ImageRepoAPI = require("../services/ImageRepoService"); // Adjust the path to your ImageRepoService
const FtpRepoService = require('../services/FtpRepoService'); // Adjust the path to the FtpRepoService class

module.exports = {
  /**
   * Process the Consistent Character API integration and store the result in ImageRepo.
   * @param {string} prompt - The text description for the character generation.
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "consistentCharacterResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.CONSISTENT_CHARACTER_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (CONSISTENT_CHARACTER_API_KEY)."
        );
      }

      // Endpoint for Consistent Character API
      const endpoint = "https://api.segmind.com/v1/consistent-character";

      // Prepare the FormData payload
      const formData = new FormData();
      formData.append("seed", modelParameters.seed || 42);
      formData.append("prompt", prompt);
      formData.append("subject", modelParameters.subject);
      formData.append("output_format", modelParameters.output_format || "webp");
      formData.append("output_quality", modelParameters.output_quality || 80);
      formData.append("negative_prompt", modelParameters.negative_prompt || "low quality,blur");
      formData.append("randomise_poses", modelParameters.randomise_poses || true);
      formData.append("number_of_outputs", modelParameters.number_of_outputs || 1);
      formData.append("number_of_images_per_pose", modelParameters.number_of_images_per_pose || 1);

      console.log("Sending request to Consistent Character API...");
      console.log("Payload:", JSON.stringify(formData, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, formData, {
        headers: {
          "x-api-key": apiKey,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer", // Expect binary data for image
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Consistent Character API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading image to ImageRepo...");

        // Configure FTP parameters
        const ftpConfig = {
          ftpHost: 'ftp.travelzviagensturismo.com',
          ftpPort: 21,
          ftpUser: 'pddidg3z',
          ftpPassword: 'q9VB0fdr28',
          baseDomain: 'https://travelzviagensturismo.com',
          rootDir: '/public_html/',
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(ftpConfig);

        console.log('Uploading generated image to FTP...');
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Content in Base64
          {targetFolder: 'generated_images'}, // Metadata
          'webp', // File extension
          null,
          null,
          true // Indicates that the content is in Base64 format
        );
        

        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Consistent Character API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Consistent Character integration:", error.message);

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
