const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService


module.exports = {
  /**
   * Processes the AI Product Photo Editor API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "aiProductPhotoResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.AI_PRODUCT_PHOTO_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (AI_PRODUCT_PHOTO_API_KEY)."
        );
      }

      // Endpoint for AI Product Photo Editor API
      const endpoint = "https://api.segmind.com/v1/ai-product-photo-editor";

      // Prepare the payload
      const payload = {
        product_image: modelParameters.product_image,
        background_image: modelParameters.background_image,
        prompt: modelParameters.prompt,
        negative_prompt: modelParameters.negative_prompt || "illustration, low quality",
        num_inference_steps: modelParameters.num_inference_steps || 21,
        guidance_scale: modelParameters.guidance_scale || 6,
        seed: modelParameters.seed || 123456,
        sampler: modelParameters.sampler || "dpmpp_3m_sde_gpu",
        scheduler: modelParameters.scheduler || "karras",
        samples: modelParameters.samples || 1,
        ipa_weight: modelParameters.ipa_weight || 0.3,
        ipa_weight_type: modelParameters.ipa_weight_type || "linear",
        ipa_start: modelParameters.ipa_start || 0,
        ipa_end: modelParameters.ipa_end || 0.5,
        ipa_embeds_scaling: modelParameters.ipa_embeds_scaling || "V only",
        cn_strenght: modelParameters.cn_strenght || 0.85,
        cn_start: modelParameters.cn_start || 0,
        cn_end: modelParameters.cn_end || 0.8,
        dilation: modelParameters.dilation || 10,
        mask_threshold: modelParameters.mask_threshold || 220,
        gaussblur_radius: modelParameters.gaussblur_radius || 8,
        base64: modelParameters.base64 || false,
      };

      if (!payload.product_image || !payload.background_image || !payload.prompt) {
        throw new Error(
          "The parameters 'product_image', 'background_image', and 'prompt' are required."
        );
      }

      console.log("Sending request to AI Product Photo Editor API...");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for the image
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("AI Product Photo Editor API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading generated image to ImageRepo...");

        // Save the image to ImageRepo
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
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
        throw new Error(`AI Product Photo Editor API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in AI Product Photo Editor integration:", error.message);

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
