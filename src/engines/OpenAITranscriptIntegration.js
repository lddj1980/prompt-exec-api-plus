const axios = require('axios');
const FormData = require('form-data');
const { Readable } = require('stream');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || 'response';

    try {
      console.log('Starting integration with OpenAI Audio API...');

      // Retrieve the API Key
      const apiKey = modelParameters.api_key || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "The API Key (api_key) is required and must be provided or configured as an environment variable (OPENAI_API_KEY)."
        );
      }

      // Extract required parameters//
      const {
        audio_url,
        response_format = 'json',
        prompt: transcription_prompt,
        timestamp_granularities,
      } = modelParameters;

      // Validate required parameters
      if (!audio_url) {
        throw new Error(
          "The parameter 'audioUrl' is required and must be a valid URL."
        );
      }

      // Download the audio file from the URL as a stream
      console.log('Downloading audio file from URL...');
      const audioResponse = await axios.get(audio_url, {
        responseType: 'stream', // Ensure the response is a stream
      });

      if (audioResponse.status !== 200) {
        throw new Error(`Failed to download audio file from URL: ${audioResponse.statusText}`);
      }

      // Build the payload
      const formData = new FormData();
      formData.append('file', audioResponse.data, { filename: 'audio.mp3' }); // Pass the stream directly
      formData.append('model', model || 'whisper-1');
      formData.append('response_format', response_format);
      if (transcription_prompt) {
        formData.append('prompt', transcription_prompt);
      }
      if (timestamp_granularities) {
        formData.append('timestamp_granularities[]', timestamp_granularities);
      }

      // API endpoint
      const endpoint = 'https://api.openai.com/v1/audio/transcriptions';

      console.log('Sending request to OpenAI Audio API...');
      const response = await axios.post(endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.status === 200 && response.data) {
        console.log('Request successfully completed.');

        return {
          [responseKey]: {
            success: true,
            data: response.data,
          },
        };
      } else {
        throw new Error(`Error processing with OpenAI Audio API: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error in integration with OpenAI Audio API:', error);

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