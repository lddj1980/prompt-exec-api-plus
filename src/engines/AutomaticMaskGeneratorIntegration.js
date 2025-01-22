const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Automatic Mask Generator API integration.
   * @param {string} prompt - The text description for the operation.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "automaticMaskResult";

    try {
      // Validate required parameters
      if (!modelParameters.prompt) {
        throw new Error("The 'prompt' parameter is required.");
      }
      if (!modelParameters.image) {
        throw new Error("The 'image' parameter is required.");
      }

      console.log("Starting integration with Automatic Mask Generator API...");

      // API endpoint
      const endpoint = "https://api.segmind.com/v1/automatic-mask-generator";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        image: modelParameters.image,
        threshold: modelParameters.threshold || 0.2,
        invert_mask: modelParameters.invert_mask || false,
        return_mask: modelParameters.return_mask || true,
        grow_mask: modelParameters.grow_mask || 10,
        seed: modelParameters.seed || 468685,
        base64: modelParameters.base64 || false,
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
        console.log("Automatic Mask Generator API call successful.");

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
          { targetFolder: "maskrepo" },
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
        throw new Error(`Automatic Mask Generator API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Automatic Mask Generator Integration:", error.message);

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
