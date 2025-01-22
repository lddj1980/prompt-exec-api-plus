const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the MP3 to MP4 conversion integration with image looping.
   * @param {Object} modelParameters - The payload for the conversion API.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || "mp3ToMp4ConversionResult";

    try {
      // Validating model_parameters
      if (!modelParameters.mp3_url) {
        throw new Error("The 'mp3_url' parameter is required and must contain a valid URL.");
      }
      if (!modelParameters.image_url) {
        throw new Error("The 'image_url' parameter is required and must contain a valid URL.");
      }

      console.log("Fetching the videohosts.txt file from URL...");
      // Fetch the videohosts.txt content from the URL
      const videohostsUrl = "https://travelzviagensturismo.com/videohosts/videohosts.txt";
      const videohostsResponse = await axios.get(videohostsUrl);
      const conversionUrl = videohostsResponse.data.trim() + "/api/audio/mp3/convert/mp4";

      if (!conversionUrl) {
        throw new Error("The videohosts.txt file is empty or does not contain a valid conversion URL.");
      }

      console.log(`Conversion URL obtained: ${conversionUrl}`);

      // Sending POST request to the conversion service with modelParameters as payload
      console.log("Sending MP3 to MP4 conversion request...");
      const conversionResponse = await axios.post(conversionUrl, modelParameters, {
        responseType: "arraybuffer", // Expect binary data
      });

      if (conversionResponse.status !== 200) {
        throw new Error(`Conversion failed. HTTP status: ${conversionResponse.status}`);
      }

      console.log("Conversion completed successfully.");

      // Convert the MP4 response to Base64
      const base64Video = Buffer.from(conversionResponse.data, "binary").toString("base64");
      console.log("MP4 content converted to Base64.");

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

      // Save Base64 MP4 content to FTP
      console.log("Uploading MP4 content to FTP...");
      const savedVideo = await ftpRepoService.createImage(
        base64Video,
        { targetFolder: "videorepo" },
        ".mp4", // File extension
        null,
        null,
        true // Indicates Base64 content
      );

      console.log("MP4 content uploaded successfully to FTP.");
      return {
        [responseKey]: {
          success: true,
          data: savedVideo,
        },
      };
    } catch (error) {
      console.error("Error in MP3 to MP4 Conversion Integration:", error.message);
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
