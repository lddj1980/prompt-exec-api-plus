const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService');

module.exports = {
  /**
   * Process the MimicMotion API integration.
   * @param {string} prompt - Unused but maintained for consistency.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "mimicMotionResult";

    try {
      // Validate required parameters
      if (!modelParameters.api_key) {
        throw new Error("The 'api_key' parameter is required.");
      }
      if (!modelParameters.version) {
        throw new Error("The 'version' parameter is required.");
      }
      if (!modelParameters.input || !modelParameters.input.motion_video || !modelParameters.input.appearance_image) {
        throw new Error("The 'input' parameter must contain both 'motion_video' and 'appearance_image'.");
      }

      console.log("Starting integration with Replicate API...");

      // API endpoint
      const endpoint = "https://api.replicate.com/v1/predictions";

      // Prepare the payload
      const payload = {
        version: modelParameters.version,
        input: modelParameters.input,
      };

      console.log("Payload:", payload);

      // API request
      const response = await axios.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${modelParameters.api_key || process.env.REPLICATE_API_KEY}`,
          "Content-Type": "application/json",
          Prefer: "wait", // Ensures the request waits for completion
        },
        responseType: "json",
      });

      if (response.status === 200 && response.data && response.data.output) {
        console.log("Replicate API call successful. Downloading output...");

        const outputUrl = response.data.output;
        const outputResponse = await axios.get(outputUrl, {
          responseType: "arraybuffer", // Expect binary data for the video
        });

        if (outputResponse.status === 200) {
          // Convert the video response to Base64
          const base64Video = Buffer.from(outputResponse.data, "binary").toString("base64");

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

          // Save the generated video to FTP
          console.log("Uploading generated video to FTP...");
          const savedVideo = await ftpRepoService.createImage(
            base64Video,
            { targetFolder: "videorepo" },
            ".mp4", // File extension
            null,
            null,
            true // Indicates Base64 content
          );

          console.log("Video uploaded successfully to FTP.");
          return {
            [responseKey]: {
              success: true,
              data: savedVideo,
            },
          };
        } else {
          throw new Error("Failed to download the generated video.");
        }
      } else {
        throw new Error("Failed to process with MimicMotion API.");
      }
    } catch (error) {
      console.error("Error in MimicMotion API Integration:", error.message);

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
