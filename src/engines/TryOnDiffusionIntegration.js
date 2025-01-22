const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Adjust the path to FtpRepoService

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Starting integration with Try-On Diffusion API...');

      // Retrieve the API Key
      const apiKey = modelParameters.api_key || process.env.TRY_ON_DIFFUSION_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (TRY_ON_DIFFUSION_API_KEY)."
        );
      }

      // Extract required parameters
      const {
        model_image,
        cloth_image,
        category = 'Upper body',
        num_inference_steps = 35,
        guidance_scale = 2,
        seed = 12467,
        base64 = false,
      } = modelParameters;

      // Validate required parameters
      if (!model_image || !cloth_image) {
        throw new Error(
          "The parameters 'model_image' and 'cloth_image' are required."
        );
      }

      // Build the payload
      const payload = {
        model_image,
        cloth_image,
        category,
        num_inference_steps,
        guidance_scale,
        seed,
        base64,
      };

      // API endpoint
      const endpoint = 'https://api.segmind.com/v1/try-on-diffusion';

      console.log('Sending request to Try-On Diffusion API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data) {
        console.log('Request successfully completed.');

        // Get the Base64 image from the response
        const base64Image = response.data.image;
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
            description: 'Image generated using Try-On Diffusion API',
            tags: ['try-on-diffusion', 'AI', 'virtual-try-on'],
            targetFolder: 'try_on_diffusion',
          }, // Metadata
          '.png', // File extension
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
        throw new Error(`Error processing with Try-On Diffusion API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in integration with Try-On Diffusion API:', error);

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
      const base64 = base64String.split(',').pop(); // Remove header if any
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};
