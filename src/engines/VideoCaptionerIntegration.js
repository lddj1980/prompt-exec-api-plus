const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Video Captioner API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};

    const responseKey = modelParameters.responseKey || "videoCaptionerResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.VIDEO_CAPTIONER_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (VIDEO_CAPTIONER_API_KEY)."
        );
      }

      // Endpoint for Video Captioner API
      const endpoint = "https://api.segmind.com/v1/video-captioner";

      // Prepare the payload
      const payload = {
        MaxChars: modelParameters.MaxChars || 10,
        bg_blur: modelParameters.bg_blur || false,
        bg_color: modelParameters.bg_color || "null",
        color: modelParameters.color || "white",
        font: modelParameters.font || "Poppins/Poppins-ExtraBold.ttf",
        fontsize: modelParameters.fontsize || 7,
        highlight_color: modelParameters.highlight_color || "yellow",
        input_video: modelParameters.input_video,
        kerning: modelParameters.kerning || -2,
        opacity: modelParameters.opacity || 0,
        right_to_left: modelParameters.right_to_left || false,
        stroke_color: modelParameters.stroke_color || "black",
        stroke_width: modelParameters.stroke_width || 2,
        subs_position: modelParameters.subs_position || "bottom75",
      };

      if (!payload.input_video) {
        throw new Error("The parameter 'input_video' is required.");
      }

      console.log("Sending request to Video Captioner API...");
      console.log("Payload:", JSON.stringify(payload, null, 2));

      // Make the API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer", // Expect binary data for the video
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Video Captioner API call successful.");

        // Convert the video to Base64 for ImageRepo upload
        const base64Video = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading captioned video to ImageRepo...");

        // Save the video to ImageRepo
        const config = {ftpHost:'ftp.travelzviagensturismo.com',ftpPort:21,ftpUser:'pddidg3z',ftpPassword:'q9VB0fdr28',baseDomain:'https://travelzviagensturismo.com',rootDir:'/public_html/'};
        // Instancia o serviço de FTP
        const ftpRepoService = new FtpRepoService(config);
        const savedVideo = await ftpRepoService.createImage(
          base64Video, // Video content in Base64
          {targetFolder:'videorepo'}, // Metadata (add any necessary metadata here)
          ".mp4", // File extension
          null, // ImageRepo API Key (replace with your key)
          null, // FTP configuration (adjust as needed)
          true // Specify that the content is Base64
        );

        return {
          [responseKey]: {
            success: true,
            data: savedVideo,
          },
        };
      } else {
        throw new Error(`Video Captioner API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Video Captioner integration:", error.message);

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
