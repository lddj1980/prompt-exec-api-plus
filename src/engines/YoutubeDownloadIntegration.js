const axios = require("axios");
const stream = require('stream');
const { promisify } = require('util');
const pipeline = promisify(stream.pipeline);
const FtpRepoService = require("../services/FtpRepoService");
const { SocksProxyAgent } = require("socks-proxy-agent");
const { Readable } = require("stream");

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "youtubeDownloadResult";

    try {
      const videoUrl = modelParameters.video_url;
      if (!videoUrl) {
        throw new Error("The 'video_url' parameter is required.");
      }

      console.log("Fetching video download URL from RapidAPI...");

      const rapidApiKey =
        modelParameters.rapidapi_key || process.env.RAPIDAPI_KEY;
      if (!rapidApiKey) {
        throw new Error(
          "The 'rapidapi_key' parameter is required or must be set in the environment variables."
        );
      }

      const options = {
        method: "GET",
        url: "https://youtube-video-and-shorts-downloader1.p.rapidapi.com/api/getYTVideo",
        params: { url: videoUrl},
        headers: {
          "x-rapidapi-ua":"RapidAPI-Playground",
          "x-rapidapi-key": rapidApiKey,
          "x-rapidapi-host": "youtube-video-and-shorts-downloader1.p.rapidapi.com",
        },
      };

      const response = await axios.request(options);

      if (!response.data || !response.data.links) {
        throw new Error("Failed to fetch download link from RapidAPI.");
      }

      console.log(response.data.links);
      const filteredLink = response.data.links.find(
        (link) =>
          link.qualityLabel === "720p" &&
          link.mimeType.includes("video/mp4") &&
          link.hasAudio === true &&
          link.hasVideo === true
      );

      if (!filteredLink) {
        throw new Error(
          "Could not find a valid 720p video download link in the response."
        );
      }

      let downloadLink = filteredLink.link;
      

      console.log("Downloading video as binary data..."+JSON.stringify(filteredLink));
      console.log("Downloading video as binary data..."+downloadLink);

      console.log("Fetching the videohosts.txt file from FTP...");

      
            console.log("Fetching the videohosts.txt file from FTP...");
      // Fetch the videohosts.txt content from the URL
      const tcpHost = "https://travelzviagensturismo.com/videohosts/tcphosts.txt";
      const tcpHostsResponse = await axios.get(tcpHost);
      const proxyUrl = tcpHostsResponse.data.trim().replace('tcp://','');

      
      const proxyAgent = new SocksProxyAgent(`socks5h://${proxyUrl}`);
      
      const videoResponse = await axios({
        method: "get",
        url: downloadLink,
        responseType: "arraybuffer",
        httpsAgent:proxyAgent,
      });


      console.log("Video downloaded successfully!");

      const ftpConfig = {
        ftpHost: process.env.FTP_HOST || "ftp.travelzviagensturismo.com",
        ftpPort: 21,
        ftpUser: process.env.FTP_USER || "pddidg3z",
        ftpPassword: process.env.FTP_PASSWORD || "q9VB0fdr28",
        baseDomain: "https://travelzviagensturismo.com",
        rootDir: "/public_html/",
      };

      const ftpRepoService = new FtpRepoService(ftpConfig);
      const ftpFileName = `video_${Date.now()}.mp4`;
      console.log("Uploading video to FTP...");

              // Convert the image to Base64 for ImageRepo upload
      const base64 = Buffer.from(videoResponse.data, "binary").toString("base64");

            // Cria um stream de escrita para o FTP
      const savedVideo = await ftpRepoService.createImage(
          base64, // Image content in Base64
          {targetFolder:'videorepo'}, // Metadata (add any necessary metadata here)
          ".mp4", // File extension
          null, // ImageRepo API Key (replace with your key)
          null, // FTP configuration (adjust as needed)
          true // Specify that the content is Base64
      );
      
      

      console.log("Video uploaded successfully to FTP.");

      return {
        [responseKey]: {
          success: true,
          data: savedVideo,
        },
      };
    } catch (error) {
      console.error("Error in YouTube Download integration:", error.message);

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
