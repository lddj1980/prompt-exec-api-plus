const axios = require('axios');

class InstagramService {
  constructor(apiBaseUrl='https://instagram-publish.glitch.me/api/') {
    this.apiBaseUrl = apiBaseUrl;
  }

 
  async publishPost(mediaUrl, caption, apiKey) {
    if (!mediaUrl) {
      throw new Error('O campo media_url é obrigatório');
    }

    const response = await axios.post(
      `${this.apiBaseUrl}/post`,
      { media_url: mediaUrl, caption: caption },
      { headers: { api_key: `${apiKey}` } }
    );

    return response.data;
  }

  async publishCarousel(slides, caption, apiKey) {
    if (!slides || !slides.length) {
      throw new Error('O campo slides é obrigatório');
    }

    const response = await axios.post(
      `${this.apiBaseUrl}/carousel`,
      { slides:slides, caption: caption },
      { headers: { api_key: `${apiKey}` } }
    );

    return response.data;
  }

  async publishReel(videoUrl, caption, apiKey) {
    if (!videoUrl) {
      throw new Error('O campo video_url é obrigatório');
    }

    const response = await axios.post(
      `${this.apiBaseUrl}/reel`,
      { video_url: videoUrl, caption },
      { headers: { api_key: `${apiKey}` } }
    );

    return response.data;
  }

  async publishStory(mediaUrl, mediaType, caption, apiKey) {
    if (!mediaUrl || !mediaType) {
      throw new Error('Os campos media_url e media_type são obrigatórios');
    }

    const response = await axios.post(
      `${this.apiBaseUrl}/story`,
      { media_url: mediaUrl, media_type: mediaType, caption },
      { headers: { api_key: `${apiKey}` } }
    );

    return response.data;
  }
}

module.exports = InstagramService;
