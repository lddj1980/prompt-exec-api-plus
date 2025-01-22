const axios = require('axios');
const FtpRepoService = require('../services/FtpRepoService'); // Adjust the path to the FtpRepoService class

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Starting integration with IDM VTON API...');

      // Get the API Key
      const apiKey = modelParameters.api_key || process.env.IDM_VTON_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (IDM_VTON_API_KEY)."
        );
      }

      // Extract required parameters
      const {
        crop = false,
        seed = 42,
        steps = 30,
        category = 'upper_body',
        force_dc = false,
        human_img,
        garm_img,
        mask_only = false,
        garment_des,
      } = modelParameters;

      // Validate required parameters
      if (!human_img || !garm_img || !garment_des) {
        throw new Error(
          "The parameters 'human_img', 'garm_img', and 'garment_des' are required."
        );
      }

      // Build the payload for the API
      const payload = {
        crop,
        seed,
        steps,
        category,
        force_dc,
        human_img,
        garm_img,
        mask_only,
        garment_des,
      };

      // API endpoint
      const endpoint = 'https://api.segmind.com/v1/idm-vton';

      console.log('Sending request to IDM VTON API...');
      const response = await axios.post(endpoint, payload, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200 && response.data) {
        console.log('Request completed successfully.');

        // Extract the Base64 image data or URL
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
            description: 'Image generated using IDM VTON API',
            tags: ['idm-vton', 'AI', 'virtual-try-on'],
            targetFolder: 'imagerepo',
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
        throw new Error(`Error processing with IDM VTON API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in integration with IDM VTON API:', error);

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