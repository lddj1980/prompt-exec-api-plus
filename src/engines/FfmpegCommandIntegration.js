const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService");
const path = require("path");

module.exports = {
  /**
   * Process the FFMPEG Command Execution Integration.
   * @param {Object} modelParameters - The payload for the FFMPEG processing request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "ffmpegCommandResult";

    try {
      // Validating model_parameters
      if (!modelParameters.media || !Array.isArray(modelParameters.media) || modelParameters.media.length < 1) {
        throw new Error("The 'media' parameter is required and must contain at least one media object.");
      }
      if (!modelParameters.ffmpeg_command) {
        throw new Error("The 'ffmpeg_command' parameter is required.");
      }
      if (!modelParameters.output_file) {
        throw new Error("The 'output_file' parameter is required.");
      }

      console.log("Fetching the videohosts.txt file from FTP...");
      // Fetch the videohosts.txt content from the URL
      const videohostsUrl = "https://travelzviagensturismo.com/videohosts/videohosts.txt";
      console.log(`Fetching the videohosts.txt content from URL: ${videohostsUrl}`);
      const videohostsResponse = await axios.get(videohostsUrl);
      const processingUrl = videohostsResponse.data.trim() + "/api/media/process";

      if (!processingUrl) {
        throw new Error("The videohosts.txt file is empty or does not contain a valid processing URL.");
      }

      console.log(`Processing URL obtained: ${processingUrl}`);

      // Sending POST request to processingUrl with modelParameters as payload
      console.log("Sending FFMPEG processing request...");
      console.log(modelParameters);
      const processingResponse = await axios.post(processingUrl, modelParameters, {
        responseType: "arraybuffer", // Expect binary data
      });

      if (processingResponse.status !== 200) {
        throw new Error(`FFMPEG processing failed. HTTP status: ${processingResponse.status}`);
      }

      console.log("FFMPEG processing completed successfully.");

      // Convert the processed file response to Base64
      const base64File = Buffer.from(processingResponse.data, "binary").toString("base64");
      console.log("Processed file content converted to Base64.");

      const fileExtension = path.extname(modelParameters.output_file) || ".png"; // Fallback para .png se não houver extensão
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

      // Save Base64 processed file content to FTP
      console.log("Uploading processed file content to FTP...");
      const savedFile = await ftpRepoService.createImage(
        base64File,
        { targetFolder: "mediarepo" },
        fileExtension, // File extension (or adjust based on output file type)
        null,
        null,
        true // Indicates Base64 content
      );

      console.log("Processed file content uploaded successfully to FTP.");
      return {
        [responseKey]: {
          success: true,
          data: savedFile,
        },
      };
    } catch (error) {
      console.error("Error in FFMPEG Command Execution Integration:", error.message);
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
