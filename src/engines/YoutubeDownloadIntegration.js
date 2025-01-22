const axios = require('axios');
const FtpRepoService = require("../services/FtpRepoService");
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);

module.exports = {
  /**
   * Process the YouTube video download and store it in FTP.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the YouTube video download.
   * @returns {Promise<Object>} - Response from the API and FTP.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "youtubeDownloadResult";

    try {
      // Validate required parameters
      const videoUrl = modelParameters.video_url;
      if (!videoUrl) {
        throw new Error("The 'video_url' parameter is required.");
      }

      console.log("Validating YouTube URL...");
      if (!videoUrl.includes("youtube.com/watch?v=") && !videoUrl.includes("youtu.be/")) {
        throw new Error("The provided URL is not a valid YouTube video URL.");
      }

      console.log("Fetching video stream URL...");

      // Extrai o ID do vídeo da URL
      const videoId = new URL(videoUrl).searchParams.get('v');
      if (!videoId) {
        throw new Error("Invalid YouTube video URL.");
      }
      
      console.log(videoId);

      // Obtém informações do vídeo (incluindo a URL de stream)
      const videoInfo = await axios.get(`https://www.youtube.com/get_video_info?video_id=${videoId}`);
      const videoData = new URLSearchParams(videoInfo.data);

      // Extrai a URL de stream (formato MP4)
      const streamUrl = videoData.get('url');
      if (!streamUrl) {
        throw new Error("Failed to fetch video stream URL.");
      }

      console.log("Downloading video from YouTube...");

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

      // Define o nome do arquivo no FTP
      const ftpFileName = `video_${Date.now()}.mp4`;

      // Cria um stream de leitura a partir da URL de stream do YouTube
      const videoStream = await axios({
        method: 'get',
        url: streamUrl,
        responseType: 'stream',
      });

      // Cria um stream de escrita para o FTP
      const ftpUploadStream = await ftpRepoService.createWriteStream(
        { targetFolder: "videorepo", metadata: { title: ftpFileName } },
        ".mp4"
      );

      console.log("Uploading video to FTP...");

      // Usa pipeline para transmitir o vídeo diretamente para o FTP
      await pipeline(
        videoStream.data, // Stream de leitura do YouTube
        ftpUploadStream   // Stream de escrita para o FTP
      );

      console.log("Video uploaded successfully to FTP.");

      // Return success response
      return {
        [responseKey]: {
          success: true,
          data: {
            message: "Video uploaded successfully.",
            ftpPath: `${ftpConfig.baseDomain}/videorepo/${ftpFileName}`,
          },
        },
      };
    } catch (error) {
      console.error("Error in YouTube Download integration:", error.message);

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