const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Adjust the path to the FtpRepoService class

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    modelParameters = modelParameters || {};

    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Starting integration with the Live Portrait API...');

      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.LIVE_PORTRAIT_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (LIVE_PORTRAIT_API_KEY)."
        );
      }

      const {
        face_image,
        driving_video,
        live_portrait_dsize,
        live_portrait_scale,
        video_frame_load_cap,
        live_portrait_lip_zero,
        live_portrait_relative,
        live_portrait_vx_ratio,
        live_portrait_vy_ratio,
        live_portrait_stitching,
        video_select_every_n_frames,
        live_portrait_eye_retargeting,
        live_portrait_lip_retargeting,
        live_portrait_lip_retargeting_multiplier,
        live_portrait_eyes_retargeting_multiplier,
      } = modelParameters;

      if (!face_image || !driving_video) {
        throw new Error(
          "The parameters 'face_image' and 'driving_video' are required."
        );
      }

      // Build the payload
      const payload = {
        face_image,
        driving_video,
        live_portrait_dsize,
        live_portrait_scale,
        video_frame_load_cap,
        live_portrait_lip_zero,
        live_portrait_relative,
        live_portrait_vx_ratio,
        live_portrait_vy_ratio,
        live_portrait_stitching,
        video_select_every_n_frames,
        live_portrait_eye_retargeting,
        live_portrait_lip_retargeting,
        live_portrait_lip_retargeting_multiplier,
        live_portrait_eyes_retargeting_multiplier,
      };

      const endpoint = 'https://api.segmind.com/v1/live-portrait';

      // Make the request to the Live Portrait API
      console.log('Sending request to Live Portrait API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data) {
        console.log('Request completed successfully.');

        // Convert the response to Base64
        const base64Video = response.data.video;
        console.log('Size of the Base64 video:', calculateBase64Size(base64Video));

        // FTP Configuration
        const config = {
          ftpHost: 'ftp.yourdomain.com',
          ftpPort: 21,
          ftpUser: 'ftp_user',
          ftpPassword: 'ftp_password',
          baseDomain: 'https://yourdomain.com',
          rootDir: '/public_html',
        };

        // Initialize the FTP Repo Service
        const ftpRepoService = new FtpRepoService(config);

        // Save the video to FTP
        console.log('Uploading the generated Live Portrait video to FTP...');
        const savedVideo = await ftpRepoService.createImage(
          base64Video, // Base64 content
          {
            description: 'Generated Live Portrait Video',
            tags: ['live-portrait', 'AI', 'animation'],
            targetFolder: 'live-portrait-uploads',
          },
          '.mp4', // File extension
          null, // No API Key required for FTP
          null, // No FTP Config ID
          true // Content is Base64
        );

        // Return the response formatted with the responseKey
        return {
          [responseKey]: {
            success: true,
            data: savedVideo,
          },
        };
      } else {
        throw new Error(`Error while processing with Live Portrait API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in integration with Live Portrait API:', error);

      // Return formatted error response with responseKey
      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }

    // Helper function to calculate Base64 size
    function calculateBase64Size(base64String) {
      const base64 = base64String.split(',').pop(); // Remove header if present
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};
