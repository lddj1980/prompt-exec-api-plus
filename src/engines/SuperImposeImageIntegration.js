const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Image Superimpose API and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency with other integrations.
   * @param {string} model - Placeholder for consistency with other integrations.
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "superimposeResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.SUPERIMPOSE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (SUPERIMPOSE_API_KEY)."
        );
      }

      // Endpoint for Image Superimpose API
      const endpoint = "https://api.segmind.com/v1/superimpose";

      // Prepare the payload
      const payload = {
        base_image: modelParameters.base_image,
        overlay_image: modelParameters.overlay_image,
        rescale_factor: modelParameters.rescale_factor || 0.4,
        resize_method: modelParameters.resize_method || "nearest-exact",
        overlay_resize: modelParameters.overlay_resize || "Resize by rescale_factor",
        opacity: modelParameters.opacity || 1,
        height: modelParameters.height || 1024,
        width: modelParameters.width || 1024,
        x_offset: modelParameters.x_offset || 320,
        y_offset: modelParameters.y_offset || 620,
        rotation: modelParameters.rotation || 0,
        base64: modelParameters.base64 || false,
      };

      if (!payload.base_image || !payload.overlay_image) {
        throw new Error(
          "The parameters 'base_image' and 'overlay_image' are required."
        );
      }

      console.log("Sending request to Image Superimpose API...");
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
        console.log("Image Superimpose API call successful.");

        // Convert the image to Base64 for ImageRepo upload
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading image to ImageRepo...");

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
        throw new Error(`Image Superimpose API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Image Superimpose integration:", error.message);

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
