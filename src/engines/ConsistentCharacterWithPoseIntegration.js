const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Adjust the path to the FtpRepoService class

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Starting integration with Consistent Character With Pose API...');

      // Extract required parameters
      const {
        api_key,
        base_64 = false,
        custom_height = 1024,
        custom_width = 1024,
        face_image,
        output_format = 'png',
        pose_image,
        prompt,
        quality = 95,
        samples = 1,
        seed,
        use_input_img_dimension = true,
      } = modelParameters;

           // Get the API Key
      const apiKey = modelParameters.api_key || process.env.CONSISTENT_CHARACTER_WITH_POSE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (CONSISTENT_CHARACTER_API_KEY)."
        );
      }

      if (!face_image || !pose_image || !prompt) {
        throw new Error(
          "The parameters 'face_image', 'pose_image', and 'prompt' are required."
        );
      }

      // Build the payload for the API
      const payload = {
        base_64,
        custom_height,
        custom_width,
        face_image,
        output_format,
        pose_image,
        prompt,
        quality,
        samples,
        seed,
        use_input_img_dimension,
      };

      // API endpoint
      const endpoint = 'https://api.segmind.com/v1/consistent-character-with-pose';

      console.log('Sending request to Consistent Character With Pose API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        responseType: "arraybuffer", // Expect binary data for image
      });

      if (response.status === 200 && response.data) {
        console.log('Request completed successfully.');

        // Extract the Base64 image data or URL
        const base64Image = Buffer.from(response.data, "binary").toString("base64");
        console.log('Image size (Base64):', calculateBase64Size(base64Image));

        // Configure FTP parameters
        const ftpConfig = {
          ftpHost: 'ftp.travelzviagensturismo.com',
          ftpPort: 21,
          ftpUser: 'pddidg3z',
          ftpPassword: 'q9VB0fdr28',
          baseDomain: 'https://travelzviagensturismo.com',
          rootDir: '/public_html/',
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(ftpConfig);

        console.log('Uploading generated image to FTP...');
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Content in Base64
          {
            targetFolder: 'generated_images'
          }, // Metadata
          `.${output_format}`, // File extension
          null,
          null,
          true // Indicates that the content is in Base64 format
        );

        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Error processing with Consistent Character With Pose API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in integration with Consistent Character With Pose API:', error);

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
      const base64 = base64String.split(',').pop(); // Remove header, if any
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};
