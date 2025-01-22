const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService');

module.exports = {
  /**
   * Process the Synced Media Generation API integration.
   * @param {string} prompt - Unused but maintained for consistency.
   * @param {string} model - Unused but maintained for consistency.
   * @param {Object} modelParameters - Parameters for the API request.
   * @returns {Promise<Object>} - Response with the FTP upload details.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "syncedMediaResult";

    try {
      // Validate required parameters
      if (!modelParameters.api_key) {
        throw new Error("The 'api_key' parameter is required.");
      }
      if (!modelParameters.model) {
        throw new Error("The 'model' parameter is required.");
      }
      if (!Array.isArray(modelParameters.input) || modelParameters.input.length < 1) {
        throw new Error("The 'input' parameter must be an array containing at least one media object.");
      }

      console.log("Starting integration with Synced Media Generation API...");

      // API endpoint
      const endpoint = "https://api.sync.so/v2/generate";

      // Prepare the payload
      const payload = {
        model: modelParameters.model,
        input: modelParameters.input,
        options: modelParameters.options || {},
        webhookUrl: modelParameters.webhookUrl || null,
      };

      console.log("Payload:", payload);

      // API request to create the generation job
      const response = await axios.post(endpoint, payload, {
        headers: {
          "x-api-key": modelParameters.api_key || process.env.SYNC_API_KEY,//
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201 && response.data.id) {
        console.log("Generation job created successfully. Job ID:", response.data.id);

        // Polling the job status
        const generationResult = await this.pollJobStatus(
          modelParameters.api_key,
          response.data.id
        );

        if (generationResult.status === "COMPLETED" && generationResult.outputUrl) {
          console.log("Generation job completed successfully. Downloading result...");

          // Download the generated media
          const mediaResponse = await axios.get(generationResult.outputUrl, {
            responseType: "arraybuffer", // Expect binary data for media
          });

          if (mediaResponse.status === 200) {
            // Convert the media response to Base64
            const base64Media = Buffer.from(mediaResponse.data, "binary").toString("base64");

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

            // Save the generated media to FTP
            console.log("Uploading generated media to FTP...");
            const savedMedia = await ftpRepoService.createImage(
              base64Media,
              { targetFolder: "mediarepo" },
              ".mp4", // File extension
              null,
              null,
              true // Indicates Base64 content
            );

            console.log("Media uploaded successfully to FTP.");
            return {
              [responseKey]: {
                success: true,
                data: savedMedia,
              },
            };
          } else {
            throw new Error("Failed to download the generated media.");
          }
        } else {
          throw new Error(`Job failed or was not completed. Status: ${generationResult.status}`);
        }
      } else {
        throw new Error("Failed to create generation job.");
      }
    } catch (error) {
      console.error("Error in Synced Media Generation Integration:", error.message);

      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }
  },

  /**
   * Poll the status of the generation job until completion or timeout.
   * @param {string} apiKey - The API key for authentication.
   * @param {string} jobId - The ID of the generation job.
   * @returns {Promise<Object>} - The final status and result of the job.
   */
  async pollJobStatus(apiKey, jobId) {
    const maxAttempts = 30;
    const interval = 60000; // 10 seconds
    const endpoint = `https://api.sync.so/v2/generate/${jobId}`;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Polling job status (Attempt ${attempt}/${maxAttempts})...`);
      const response = await axios.get(endpoint, {
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (response.status === 200 && response.data) {
        const jobData = response.data;

        if (jobData.status === "COMPLETED") {
          return jobData;
        } else if (["FAILED", "REJECTED", "CANCELED"].includes(jobData.status)) {
          throw new Error(`Job failed with status: ${jobData.status}`);
        }
      }

      // Wait before the next attempt
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }

    throw new Error("Job polling timeout exceeded.");
  },
};
