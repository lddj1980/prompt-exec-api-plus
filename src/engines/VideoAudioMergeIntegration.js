const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho para o arquivo da classe FtpRepoService

module.exports = {
  /**
   * Processes the Video Audio Merge API request and stores the result in ImageRepo.
   * @param {string} prompt - Placeholder for consistency.
   * @param {string} model - Placeholder for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response from the API and ImageRepo.
   */
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "videoAudioMergeResult";

    try {
      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.VIDEO_AUDIO_MERGE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (VIDEO_AUDIO_MERGE_API_KEY)."
        );
      }

      // Endpoint for Video Audio Merge API
      const endpoint = "https://api.segmind.com/v1/video-audio-merge";

      // Prepare the payload
      const payload = {
        input_video: modelParameters.input_video,
        input_audio: modelParameters.input_audio,
        video_start: modelParameters.video_start || 0,
        video_end: modelParameters.video_end || -1,
        audio_start: modelParameters.audio_start || 0,
        audio_end: modelParameters.audio_end || -1,
        audio_fade_in: modelParameters.audio_fade_in || 0,
        audio_fade_out: modelParameters.audio_fade_out || 0,
        override_audio: modelParameters.override_audio || false,
        merge_intensity: modelParameters.merge_intensity || 0.5,
      };

      if (!payload.input_video || !payload.input_audio) {
        throw new Error(
          "The parameters 'input_video' and 'input_audio' are required."
        );
      }

      console.log("Sending request to Video Audio Merge API...");
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
        console.log("Video Audio Merge API call successful.");

        // Convert the video to Base64 for ImageRepo upload
        const base64Video = Buffer.from(response.data, "binary").toString("base64");
        console.log("Uploading video to ImageRepo...");

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
        throw new Error(`Video Audio Merge API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in Video Audio Merge integration:", error.message);

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
