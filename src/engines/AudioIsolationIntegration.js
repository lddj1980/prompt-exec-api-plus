const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const FtpRepoService = require("../services/FtpRepoService");

module.exports = {
  /**
   * Process the Audio Isolation API integration and store the result in FTP.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the Audio Isolation API.
   * @returns {Promise<Object>} - Response from the API and FTP.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "audioIsolationResult";

    try {
      // Validate required parameters
      const audioUrl = modelParameters.audio_url;
      if (!audioUrl) {
        throw new Error("The 'audio_url' parameter is required.");
      }

      const apiKey = modelParameters.api_key || process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (ELEVENLABS_API_KEY)."
        );
      }

      console.log("Downloading audio file...");
      // Download the audio file as a stream
      const audioStream = await axios.get(audioUrl, { responseType: "stream" });

      console.log("Preparing form data for Audio Isolation API...");
      // Prepare form data
      const form = new FormData();
      form.append("audio", audioStream.data, {
        filename: "input_audio.wav",
        contentType: "audio/wav",
      });

      console.log("Sending request to Audio Isolation API...");
      // Send the POST request to the API
      const response = await axios.post("https://api.elevenlabs.io/v1/audio-isolation", form, {
        headers: {
          "xi-api-key": apiKey,
          ...form.getHeaders(),
        },
        responseType: "arraybuffer", // Expect binary response
      });

      // Handle the response
      if (response.status === 200 && response.data) {
        console.log("Audio Isolation API call successful.");

        // Convert the response audio to Base64
        const base64Audio = Buffer.from(response.data, "binary").toString("base64");

        // FTP Configuration
        const ftpConfig = {
          ftpHost: process.env.FTP_HOST || "ftp.travelzviagensturismo.com",
          ftpPort: 21,
          ftpUser: process.env.FTP_USER || "pddidg3z",
          ftpPassword: process.env.FTP_PASSWORD || "q9VB0fdr28",
          baseDomain: "https://travelzviagensturismo.com",
          rootDir: "/public_html/",
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(ftpConfig);

        console.log("Uploading isolated audio to FTP...");
        // Save the isolated audio to FTP
        const savedAudio = await ftpRepoService.createImage(
          base64Audio, // Audio content in Base64
          { targetFolder: "audiorepo" }, // Metadata
          ".wav", // File extension
          null, // No additional API Key required
          null, // No extra FTP configuration required
          true // Specify that the content is Base64
        );

        console.log("Audio uploaded successfully to FTP.");
        return {
          [responseKey]: {
            success: true,
            data: savedAudio,
          },
        };
      } else {
        throw new Error(`Audio Isolation API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Audio Isolation integration:", error.message);

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
