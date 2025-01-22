const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Flux-Pulid API integration.
   * @param {string} prompt - The text description for the operation.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "fluxPulidResult";

    try {
      // Validate required parameters
      if (!modelParameters.prompt) {
        throw new Error("The 'prompt' parameter is required.");
      }
      if (!modelParameters.main_face_image) {
        throw new Error("The 'main_face_image' parameter is required.");
      }

      console.log("Starting integration with Flux-Pulid API...");

      // API endpoint
      const endpoint = "https://api.segmind.com/v1/flux-pulid";

      // Prepare the payload
      const payload = {
        prompt : modelParameters.prompt,
        main_face_image: modelParameters.main_face_image,
        seed: modelParameters.seed || 720558,
        width: modelParameters.width || 896,
        height: modelParameters.height || 1152,
        true_cfg: modelParameters.true_cfg || 1,
        id_weight: modelParameters.id_weight || 1.05,
        num_steps: modelParameters.num_steps || 20,
        start_step: modelParameters.start_step || 0,
        num_outputs: modelParameters.num_outputs || 1,
        output_format: modelParameters.output_format || "webp",
        guidance_scale: modelParameters.guidance_scale || 4,
        output_quality: modelParameters.output_quality || 80,
        negative_prompt: modelParameters.negative_prompt || "bad quality, worst quality, text, signature, watermark, extra limbs, low resolution, partially rendered objects, deformed or partially rendered eyes, deformed, deformed eyeballs, cross-eyed, blurry",
        max_sequence_length: modelParameters.max_sequence_length || 128,
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
        console.log("Flux-Pulid API call successful.");

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
          { targetFolder: "fluxpulidrepo" },
          ".webp", // File extension
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
        throw new Error(`Flux-Pulid API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Flux-Pulid Integration:", error.message);

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
