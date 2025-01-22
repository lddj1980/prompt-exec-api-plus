const axios = require("axios");

module.exports = {
  /**
   * Process the integration with the YouTube video publishing webhook.
   * @param {Object} modelParameters - The payload parameters for the YouTube video publishing webhook.
   * @returns {Promise<Object>} - Response from the webhook.
   */
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};
    const responseKey = modelParameters.responseKey || "youtubeVideoPublishResult";

    try {
      // Validating required parameters
      if (!modelParameters.endpoint) {
        throw new Error("The 'endpoint' parameter is required and must contain a valid webhook URL.");
      }
      if (!modelParameters.url) {
        throw new Error("The 'url' parameter is required and must contain a valid video URL.");
      }
      if (!modelParameters.title) {
        throw new Error("The 'title' parameter is required and must contain a valid title.");
      }
      if (!modelParameters.description) {
        throw new Error("The 'description' parameter is required and must contain a valid description.");
      }
      if (!modelParameters.hashtags) {
        throw new Error("The 'hashtags' parameter is required and must contain valid hashtags.");
      }
      if (typeof modelParameters.is_made_for_kids === "undefined") {
        throw new Error("The 'is_made_for_kids' parameter is required and must be a boolean.");
      }

      // Prepare payload for YouTube webhook
      const payload = {
        url: modelParameters.url,
        title: modelParameters.title,
        description: modelParameters.description,
        hashtags: modelParameters.hashtags,
        category: modelParameters.category || 22, // Default value
        is_made_for_kids: modelParameters.is_made_for_kids,
        privacy: modelParameters.privacy || "private", // Default value
        notify_subscribers: modelParameters.notify_subscribers || "yes", // Default value
        allow_embedding: modelParameters.allow_embedding || "yes", // Default value
        publish_date: modelParameters.publish_date || null,
        recording_date: modelParameters.recording_date || null,
      };
      
      
      console.log(payload);
      console.log("Sending video upload request to the YouTube webhook...");
      const endpoint = modelParameters.endpoint;

      // Send POST request to the YouTube webhook
      const response = await axios.post(endpoint, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200 || response.status === 201) {
        console.log("YouTube webhook call successful.");
        return {
          [responseKey]: {
            success: true,
            data: response.data,
          },
        };
      } else {
        throw new Error(`YouTube webhook call failed. HTTP status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error in YouTube video publishing integration:", error.message);
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
