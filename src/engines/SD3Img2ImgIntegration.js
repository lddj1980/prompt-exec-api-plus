const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Stable Diffusion 3 Medium Image-to-Image API and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency with other integrations.
   * @param {string} model - Placeholder for consistency with other integrations.
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || "sd3Img2ImgResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.SD3_IMG2IMG_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (SD3_IMG2IMG_API_KEY)."
        );
      }

      // Endpoint for Stable Diffusion 3 Medium Image-to-Image API
      const endpoint = "https://api.segmind.com/v1/sd3-med-img2img";

      // Prepare the payload
      const payload = {
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "low quality,less details",
        image: modelParameters.image,
        num_inference_steps: modelParameters.num_inference_steps || 20,
        guidance_scale: modelParameters.guidance_scale || 5,
        seed: modelParameters.seed || Math.floor(Math.random() * 1000000),
        samples: modelParameters.samples || 1,
        strength: modelParameters.strength || 0.7,
        sampler: modelParameters.sampler || "dpmpp_2m",
        scheduler: modelParameters.scheduler || "sgm_uniform",
        base64: modelParameters.base64 || false,
      };

      if (!payload.prompt || !payload.image) {
        throw new Error(
          "The parameters 'prompt' and 'image' are required."
        );
      }

      console.log("Sending request to Stable Diffusion 3 API...");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for image
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Stable Diffusion 3 API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading image to ImageRepo...");

        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        // Save the image to ImageRepo
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
        throw new Error(`Stable Diffusion 3 API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Stable Diffusion 3 integration:", error.message);

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