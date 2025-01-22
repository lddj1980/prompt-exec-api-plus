const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Process the Text Overlay API integration and store the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const responseKey = modelParameters.responseKey || "textOverlayResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.TEXT_OVERLAY_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (TEXT_OVERLAY_API_KEY)."
        );
      }

      // Endpoint for Text Overlay API
      const endpoint = "https://api.segmind.com/v1/text-overlay";

      // Prepare the payload
      const payload = {
        align: modelParameters.align || "right",
        base64: modelParameters.base64 || false,
        blend_mode: modelParameters.blend_mode || "normal",
        color: modelParameters.color || "#FFF",
        font: modelParameters.font || "JosefinSans-Bold",
        font_size: modelParameters.font_size || 150,
        graphspace: modelParameters.graphspace || 0,
        image: modelParameters.image,
        image_format: modelParameters.image_format || "jpeg",
        image_quality: modelParameters.image_quality || 90,
        linespace: modelParameters.linespace || 10,
        margin_x: modelParameters.margin_x || 97,
        margin_y: modelParameters.margin_y || 300,
        outline_color: modelParameters.outline_color || "#11ff00",
        outline_size: modelParameters.outline_size || 0,
        text: modelParameters.text,
        text_underlay: modelParameters.text_underlay || true,
        wrap: modelParameters.wrap || 50,
      };

      if (!payload.image || !payload.text) {
        throw new Error(
          "The parameters 'image' and 'text' are required."
        );
      }

      console.log("Sending request to Text Overlay API...");
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
        console.log("Text Overlay API call successful.");

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
        throw new Error(`Text Overlay API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Text Overlay integration:", error.message);

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
