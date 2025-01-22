const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Background Replace API integration.
   * @param {string} prompt - The text description for the background replacement.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "backgroundReplaceResult";

    try {
      // Validate required parameters
      if (!modelParameters.image) {
        throw new Error("The 'image' parameter is required.");
      }
      if (!modelParameters.ref_image) {
        throw new Error("The 'ref_image' parameter is required.");
      }
      if (!modelParameters.prompt) {
        throw new Error("The 'prompt' parameter is required.");
      }
      if (!modelParameters.api_key) {
        throw new Error("The 'api_key' parameter is required.");
      }

      console.log("Starting integration with Background Replace API...");

      // API endpoint
      const endpoint = "https://api.segmind.com/v1/bg-replace";

      // Prepare the payload
      const payload = {
        image: modelParameters.image,
        ref_image: modelParameters.ref_image,
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "bad quality, painting, blur",
        samples: modelParameters.samples || 1,
        scheduler: modelParameters.scheduler || "DDIM",
        num_inference_steps: modelParameters.num_inference_steps || 25,
        guidance_scale: modelParameters.guidance_scale || 7.5,
        seed: modelParameters.seed || 12467,
        strength: modelParameters.strength || 1,
        cn_weight: modelParameters.cn_weight || 0.9,
        ip_adapter_weight: modelParameters.ip_adapter_weight || 0.5,
        base64: modelParameters.base64 || false,
      };

      console.log("Payload:", payload);

      // API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": modelParameters.api_key,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for image
      });

      if (response.status === 200) {
        console.log("Background Replace API call successful.");

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
          { targetFolder: "backgroundreplace" },
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
        throw new Error(`Background Replace API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Background Replace Integration:", error.message);

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
