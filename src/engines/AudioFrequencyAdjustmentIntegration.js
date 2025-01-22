const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Audio Frequency Adjustment API integration with videohosts URL.
   * @param {Object} modelParameters - The payload for the audio frequency adjustment API.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "audioFrequencyAdjustmentResult";

    try {
      // Validating modelParameters
      if (!modelParameters.mp3_url) {
        throw new Error("The 'mp3_url' parameter is required.");
      }
      if (!modelParameters.desired_frequency) {
        throw new Error("The 'desired_frequency' parameter is required.");
      }

      console.log("Fetching videohosts.txt file to get the service URL...");
      const videohostsUrl = "https://travelzviagensturismo.com/videohosts/videohosts.txt";
      const videohostsResponse = await axios.get(videohostsUrl);
      const serviceBaseUrl = videohostsResponse.data.trim();
      const serviceUrl = `${serviceBaseUrl}/api/audio/mp3/frequency`;

      if (!serviceUrl) {
        throw new Error("The videohosts.txt file is empty or does not contain a valid service URL.");
      }

      console.log(`Audio frequency adjustment service URL obtained: ${serviceUrl}`);

      console.log("Sending request to the audio frequency adjustment service...");
      const adjustmentResponse = await axios.post(
        serviceUrl,
        {
          mp3_url: modelParameters.mp3_url,
          desired_frequency: modelParameters.desired_frequency,
        },
        {
          responseType: "arraybuffer", // Expect binary data for the adjusted audio
        }
      );

      if (adjustmentResponse.status !== 200) {
        throw new Error(`Audio frequency adjustment service failed. HTTP status: ${adjustmentResponse.status}`);
      }

      console.log("Audio frequency adjustment completed successfully.");

      // Convert adjusted audio to Base64
      const base64Audio = Buffer.from(adjustmentResponse.data, "binary").toString("base64");
      console.log("Adjusted audio content converted to Base64.");

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

      console.log("Uploading adjusted audio content to FTP...");
      const savedAudio = await ftpRepoService.createImage(
        base64Audio,
        { targetFolder: "audiorepo" },
        ".mp3", // File extension
        null,
        null,
        true // Indicates Base64 content
      );

      console.log("Adjusted audio content uploaded successfully to FTP.");
      return {
        [responseKey]: {
          success: true,
          data: savedAudio,
        },
      };
    } catch (error) {
      console.error("Error in Audio Frequency Adjustment Integration:", error.message);
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
