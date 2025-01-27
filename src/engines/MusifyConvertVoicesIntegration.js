const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Convert Voice API integration.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the Convert Voice API.
   * @returns {Promise<Object>} - Response with FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    const responseKey = modelParameters.responseKey || "convertVoiceResult";

    try {
      // Validate required parameters
      const audioUrl = modelParameters.audio_url;
      if (!audioUrl) {
        throw new Error("The 'audio_url' parameter is required.");
      }

      const apiKey = modelParameters.api_key || process.env.MUSICFY_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API key (api_key) is required and must be provided or set in the environment variable MUSICFY_API_KEY."
        );
      }

      // Fetch the audio file as a stream
      console.log("Fetching audio file from URL...");
      const audioResponse = await axios.get(audioUrl, { responseType: "stream" });

      // Prepare form data
      console.log("Preparing form data...");
      const formData = new FormData();
      formData.append("file", audioResponse.data, "audio_file.mp3");
      formData.append("pitch_shift", modelParameters.pitch_shift || "0");
      formData.append("formant_shift", modelParameters.formant_shift || "1");
      formData.append("isolate_vocals", modelParameters.isolate_vocals || "true");
      formData.append("background_pitch_shift", modelParameters.background_pitch_shift || "0");
      formData.append("background_formant_shift", modelParameters.background_formant_shift || "1");
      formData.append("voice_id", modelParameters.voice_id);

      // Make API request
      console.log("Sending request to Convert Voice API...");
      const apiResponse = await axios.post("https://api.musicfy.lol/v1/convert-voice", formData, {
        headers: {
          ...formData.getHeaders(),
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (apiResponse.status !== 200 || !apiResponse.data) {
        throw new Error(`Error from Convert Voice API: ${apiResponse.statusText}`);
      }

      console.log(apiResponse.data);
      console.log("Processing API response...");
      const fileUrl = apiResponse.data ? (apiResponse.data[0].file_url) : null; // Fetch the file_url for vocals or combined audio
      if (!fileUrl) {
        throw new Error("No file URL found in the API response.");
      }

      // Fetch the resulting file
      console.log("Downloading processed audio file...");
      const processedAudioResponse = await axios.get(fileUrl, { responseType: "arraybuffer" });

      // Convert to Base64 for FTP upload
      const base64Audio = Buffer.from(processedAudioResponse.data, "binary").toString("base64");

      // FTP Configuration
      const ftpConfig = {
        ftpHost: process.env.FTP_HOST || "ftp.travelzviagensturismo.com",
        ftpPort: 21,
        ftpUser: process.env.FTP_USER || "pddidg3z",
        ftpPassword: process.env.FTP_PASSWORD || "q9VB0fdr28",
        baseDomain: "https://travelzviagensturismo.com",
        rootDir: "/public_html/",
      };

      // Upload processed audio to FTP
      const ftpRepoService = new FtpRepoService(ftpConfig);
      console.log("Uploading processed audio to FTP...");
      const savedAudio = await ftpRepoService.createImage(
        base64Audio,
        { targetFolder: "audiorepo" },
        ".mp3", // File extension
        null,
        null,
        true // Specify that the content is Base64
      );

      return {
        [responseKey]: {
          success: true,
          data: savedAudio,
        },
      };
    } catch (error) {
      console.error("Error in Convert Voice integration:", error.message);

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
