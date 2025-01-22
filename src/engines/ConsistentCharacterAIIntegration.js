const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Consistent Character AI integration.
   * @param {string} prompt - The text description for the character generation.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "consistentCharacterResult";

    try {
      // Validate required parameters
      if (!modelParameters.prompt) {
        throw new Error("The 'prompt' parameter is required.");
      }
      if (!modelParameters.ip_image) {
        throw new Error("The 'ip_image' parameter is required.");
      }
      if (!modelParameters.api_key) {
        throw new Error("The 'api_key' parameter is required.");
      }

      console.log("Starting integration with Consistent Character AI API...");

      // API endpoint
      const endpoint = "https://api.segmind.com/v1/consistent-character-AI-neolemon-v3";

      // Prepare the payload
      const payload = {
        prompt : modelParameters.prompt,
        ip_image: modelParameters.ip_image,
        steps: modelParameters.steps || 10,
        guidance_scale: modelParameters.guidance_scale || 3,
        width: modelParameters.width || 1024,
        height: modelParameters.height || 1024,
        seed: modelParameters.seed || 4898558797,
      };

      console.log("Payload:", payload);

      // API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": modelParameters.api_key || process.env.SEGMIND_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for image
      });

      if (response.status === 200) {
        console.log("Consistent Character AI API call successful.");

        // Convert the response to Base64
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Image converted to Base64.");

        // FTP configuration
        const config = {
          ftpHost: "ftp.travelzviagensturismo.com",
          ftpPort: 21,
          ftpUser: "pddidg3z",
          ftpPassword: "q9VB0fdr28",
          baseDomain: "https://travelzviagensturismo.com",
          rootDir: "/public_html/",
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(config);

        // Save the generated image to FTP
        console.log("Uploading generated image to FTP...");
        const savedImage = await ftpRepoService.createImage(
          base64Image,
          { targetFolder: "characterrepo" },
          ".png", // File extension
          null,
          null,
          true // Indicates Base64 content
        );

        console.log("Image uploaded successfully to FTP.");
        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Consistent Character AI API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Consistent Character AI Integration:", error.message);

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
