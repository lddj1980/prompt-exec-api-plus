const axios = require('axios');
const FormData = require('form-data');
const FtpRepoService = require('../services/FtpRepoService');

module.exports = {
  /**
   * Process the MVSEP API integration with polling for result.
   * @param {string} prompt - Placeholder for consistency with other integrations (not used here).
   * @param {string} model - Placeholder for consistency with other integrations (not used here).
   * @param {Object} modelParameters - Parameters required for the MVSEP API.
   * @returns {Promise<Object>} - Response with FTP upload details or error information.
   */
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'mvsepResult';
    const pollingInterval = 10000; // 10 seconds
    const pollingTimeout = 600000; // 10 minutes

    try {
      console.log('Starting integration with MVSEP API...');

      // Validate required parameters
      const audioUrl = modelParameters.audio_url;
      const apiToken = modelParameters.api_token || process.env.MVSEP_API_KEY;
      if (!audioUrl) {
        throw new Error("The 'audio_url' parameter is required.");
      }
      if (!apiToken) {
        throw new Error(
          "The 'api_token' parameter is required and must be provided or set in the environment variables."
        );
      }

      // Download the audio file from the URL
      console.log('Downloading audio file from URL...');
      const audioResponse = await axios.get(audioUrl, {
        responseType: 'stream',
      });

      if (audioResponse.status !== 200) {
        throw new Error(`Failed to download audio file from URL: ${audioResponse.statusText}`);
      }

      // Build the payload
      console.log('Building form data for MVSEP API...');
      const formData = new FormData();
      formData.append('audiofile', audioResponse.data, { filename: 'audio.mp3' });
      formData.append('api_token', apiToken);
      formData.append('sep_type', modelParameters.sep_type || '9'); // Default: Demucs3 Model B
      if (modelParameters.add_opt1) formData.append('add_opt1', modelParameters.add_opt1);
      if (modelParameters.add_opt2) formData.append('add_opt2', modelParameters.add_opt2);
      formData.append('output_format', modelParameters.output_format || '0'); // Default: mp3
      formData.append('is_demo', modelParameters.is_demo || '0');

      // API endpoint
      const createEndpoint = 'https://mvsep.com/api/separation/create';

      console.log('Sending request to MVSEP API...');
      const createResponse = await axios.post(createEndpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      if (!createResponse.data.success) {
        throw new Error(`MVSEP API error: ${createResponse.data.data.message}`);
      }

      const hash = createResponse.data.data.hash;
      const getResultEndpoint = `https://mvsep.com/api/separation/get?hash=${hash}`;

      console.log('Polling for processing result...');

      const pollForResult = async () => {
        const startTime = Date.now();

        while (Date.now() - startTime < pollingTimeout) {
          const resultResponse = await axios.get(getResultEndpoint);

          if (resultResponse.data.success && resultResponse.data.status === 'done') {
            return resultResponse.data;
          }

          if (resultResponse.data.status === 'failed') {
            throw new Error('MVSEP API processing failed.');
          }

          console.log('Processing not complete. Retrying in 10 seconds...');
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }

        throw new Error('Timeout while waiting for MVSEP API to complete processing.');
      };

      const resultData = await pollForResult();

      // Extract URLs for vocals and instruments
      const vocalsFile = resultData.data.files.find(file => file.type === 'Vocals');
      const instrumentsFile = resultData.data.files.find(file => file.type === 'Instruments');

      if (!vocalsFile || !instrumentsFile) {
        throw new Error('Vocals or Instruments file not found in MVSEP API response.');
      }

      // Download files and upload to FTP
      console.log('Downloading and uploading separated files to FTP...');

      const ftpConfig = {
        ftpHost: process.env.FTP_HOST || 'ftp.travelzviagensturismo.com',
        ftpPort: 21,
        ftpUser: process.env.FTP_USER || 'pddidg3z',
        ftpPassword: process.env.FTP_PASSWORD || 'q9VB0fdr28',
        baseDomain: 'https://travelzviagensturismo.com',
        rootDir: '/public_html/',
      };

      const ftpRepoService = new FtpRepoService(ftpConfig);

      const uploadFile = async (fileUrl, targetFolder) => {
        const fileResponse = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const base64File = Buffer.from(fileResponse.data, 'binary').toString('base64');
        return ftpRepoService.createImage(base64File, { targetFolder }, '.mp3', null, null, true);
      };

      const savedVocals = await uploadFile(vocalsFile.url, 'audiorepo/vocals');
      const savedInstruments = await uploadFile(instrumentsFile.url, 'audiorepo/instruments');

      return {
        [responseKey]: {
          success: true,
          data: {
            vocals: savedVocals,
            instruments: savedInstruments,
          },
        },
      };
    } catch (error) {
      console.error('Error in MVSEP integration:', error);

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
