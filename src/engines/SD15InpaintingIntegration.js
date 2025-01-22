const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Inpainting API integration.
   * @param {string} prompt - The text description for the inpainting operation.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {

    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "inpaintingResult";

    try {
      // Validate required parameters
      if (!modelParameters.prompt) {
        throw new Error("The 'prompt' parameter is required.");
      }
      if (!modelParameters.image) {
        throw new Error("The 'image' parameter is required.");
      }
      if (!modelParameters.mask) {
        throw new Error("The 'mask' parameter is required.");
      }

      console.log("Starting integration with SD1.5 Inpainting API...");

      // API endpoint
      const endpoint = "https://api.segmind.com/v1/sd1.5-inpainting";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "Disfigured, cartoon, blurry, nude",
        samples: modelParameters.samples || 1,
        image: modelParameters.image,
        mask: modelParameters.mask,
        scheduler: modelParameters.scheduler || "DDIM",
        num_inference_steps: modelParameters.num_inference_steps || 25,
        guidance_scale: modelParameters.guidance_scale || 7.5,
        strength: modelParameters.strength || 1,
        seed: modelParameters.seed || Math.floor(Math.random() * 1e9),
        img_width: modelParameters.img_width || 512,
        img_height: modelParameters.img_height || 512,
      };

      console.log("Payload:", payload);

      // API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": modelParameters.api_key || process.env.SEGMIND_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for the image
      });

      if (response.status === 200) {
        console.log("SD1.5 Inpainting API call successful.");

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
          { targetFolder: "inpaintingrepo" },
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
        throw new Error(`SD1.5 Inpainting API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in SD1.5 Inpainting Integration:", error.message);

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
