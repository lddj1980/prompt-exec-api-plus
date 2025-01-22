const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Video Creation API integration with `model_parameters` and FTP storage.
   * @param {Object} modelParameters - The payload for the video generation API.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "videoCreationResult";
    
    try {
      // Validating model_parameters
      if (!modelParameters.images || !Array.isArray(modelParameters.images) || modelParameters.images.length < 1) {
        throw new Error("The 'images' parameter is required and must contain at least one image URL.");
      }
      if (!modelParameters.durations) {
        throw new Error("The 'durations' parameter is required and must contain at least one duration.");
      }

      console.log(modelParameters.durations);
      modelParameters.durations = eval(modelParameters.durations);
      console.log(modelParameters.durations);
      
      if (!Array.isArray(modelParameters.durations) || modelParameters.durations.length < 1) {
        throw new Error("The 'durations' parameter is required and must contain at least one duration.");
      }

      if (modelParameters.audio && !modelParameters.audio.url) {
        throw new Error("If 'audio' is provided, it must contain a valid 'url'.");
      }
      if (modelParameters.background_music && !modelParameters.background_music.url) {
        throw new Error("If 'background_music' is provided, it must contain a valid 'url'.");
      }
      if (modelParameters.transitions && (!Array.isArray(modelParameters.transitions) || modelParameters.transitions.length < 1)) {
        throw new Error("If 'transitions' is provided, it must contain at least one valid transition.");
      }

      console.log("Fetching the videohosts.txt file from FTP...");
       // Fetch the videohosts.txt content from the URL
      const videohostsUrl = "https://travelzviagensturismo.com/videohosts/videohosts.txt";
      console.log(`Fetching the videohosts.txt content from URL: ${videohostsUrl}`);
      const videohostsResponse = await axios.get(videohostsUrl);
      const videoUrl = videohostsResponse.data.trim()+'/api/video/create';

      if (!videoUrl) {
        throw new Error("The videohosts.txt file is empty or does not contain a valid video generation URL.");
      }

      console.log(`Video generation URL obtained: ${videoUrl}`);

      // Sending POST request to videoUrl with modelParameters as payload
      console.log("Sending video generation request...");
      console.log(modelParameters);
      const videoResponse = await axios.post(videoUrl, modelParameters, {
        responseType: "arraybuffer", // Expect binary data
      });

      if (videoResponse.status !== 200) {
        throw new Error(`Video generation failed. HTTP status: ${videoResponse.status}`);
      }

      console.log("Video generation completed successfully.");

      // Convert the video response to Base64
      const base64Video = Buffer.from(videoResponse.data, "binary").toString("base64");
      console.log("Video content converted to Base64.");

      // FTP Configuration
      const ftpConfig = {
        ftpHost: process.env.FTP_HOST || "ftp.travelzviagensturismo.com",
        ftpPort: 21,
        ftpUser: process.env.FTP_USER || "pddidg3z",
        ftpPassword: process.env.FTP_PASSWORD || "q9VB0fdr28",
        baseDomain: process.env.BASE_DOMAIN || "https://travelzviagensturismo.com",
        rootDir: process.env.FTP_ROOT_DIR || "/public_html/",
      };

      // Instantiate FtpRepoService
      const ftpRepoService = new FtpRepoService(ftpConfig);

      // Save Base64 video content to FTP
      console.log("Uploading video content to FTP...");
      const savedVideo = await ftpRepoService.createImage(
        base64Video,
        { targetFolder: "videorepo" },
        ".mp4", // File extension
        null,
        null,
        true // Indicates Base64 content
      );

      console.log("Video content uploaded successfully to FTP.");
      return {
        [responseKey]: {
          success: true,
          data: savedVideo,
        },
      };
    } catch (error) {
      console.error("Error in Video Creation Integration:", error.message);
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
