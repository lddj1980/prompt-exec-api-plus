const OpenAIIntegration = require('../engines/OpenAIIntegration');
const DallEIntegration = require('../engines/DallEIntegration');
const GeminiIntegration = require('../engines/GeminiIntegration');
const InferenceAPIIntegrationTextToImage = require('../engines/InferenceAPIIntegrationTextToImage');
const InferenceAPIIntegrationTextGeneration = require('../engines/InferenceAPIIntegrationTextGeneration');
const InferenceAPIIntegrationTextToAudio = require('../engines/InferenceAPIIntegrationTextToAudio');
const InferenceAPIIntegrationTextToSpeech = require('../engines/InferenceAPIIntegrationTextToSpeech');
const FreePikTextToImageIntegration = require('../engines/FreePikTextToImageIntegration');
const WritterAIIntegration = require('../engines/WritterAIIntegration');
const BrainstormAIIntegration = require('../engines/BrainstormAIIntegration');
const WordpressIntegration = require('../engines/WordpressIntegration');
const InstagramIntegration = require('../engines/InstagramIntegration');
const WhatsappIntegration = require('../engines/WhatsappIntegration');
const TelegramIntegration = require('../engines/TelegramIntegration');
const CarouselIntegration = require('../engines/CarouselIntegration');
const ImageRepoIntegration = require('../engines/ImageRepoIntegration');
const HtmlToImageIntegration = require('../engines/HtmlToImageIntegration');
const ElevenLabsTextToSpeechIntegration = require('../engines/ElevenLabsTextToSpeechIntegration');
const HttpCommandIntegration = require('../engines/HttpCommandIntegration');
const ThreadsIntegration = require('../engines/ThreadsIntegration');
const EmailIntegration = require('../engines/EmailIntegration');
const ImapIntegration = require('../engines/ImapIntegration');
const MysqlIntegration = require('../engines/MysqlIntegration');
const PexelsIntegration = require('../engines/PexelsIntegration');
const ImageToVideoIntegration = require('../engines/ImageToVideoIntegration');
const SerpapiIntegration = require('../engines/SerpapiIntegration');
const DeepSeekIntegration = require('../engines/DeepSeekIntegration');
const FaceSwapV2Integration = require('../engines/FaceSwapV2Integration');
const FaceSwapV3Integration = require('../engines/FaceSwapV3Integration');
const VideofaceswapIntegration = require('../engines/VideofaceswapIntegration');
const SDXLRealDreamLightningIntegration = require('../engines/SDXLRealDreamLightningIntegration');
const Runway3GenAlphaTurboIntegration = require('../engines/Runway3GenAlphaTurboIntegration');
const MusicGenerationPiapiIntegration = require('../engines/MusicGenerationPiapiIntegration');
const SadTalkerIntegration = require('../engines/SadTalkerIntegration');
const MiniMaxAIIntegration = require('../engines/MiniMaxAIIntegration');
const HunyuanVideoIntegration = require('../engines/HunyuanVideoIntegration');
const ConsistentCharacterIntegration = require('../engines/ConsistentCharacterIntegration');
const TextOverlayIntegration = require('../engines/TextOverlayIntegration');
const SD3Img2ImgIntegration = require('../engines/SD3Img2ImgIntegration');
const SuperImposeImageIntegration = require('../engines/SuperImposeImageIntegration');
const CamilaModelIntegration = require('../engines/CamilaModelIntegration');
const VideoAudioMergeIntegration = require('../engines/VideoAudioMergeIntegration');
const VideoCaptionerIntegration = require('../engines/VideoCaptionerIntegration');
const AIProductPhotoEditorIntegration = require('../engines/AIProductPhotoEditorIntegration');
const StableDiffusion35Integration = require('../engines/StableDiffusion35Integration');
const FluxRealismLoraIntegration = require('../engines/FluxRealismLoraIntegration');
const RealdreamPonyV9Integration = require('../engines/RealdreamPonyV9Integration');
const FtpIntegration = require('../engines/FtpIntegration');
const TheNewBlackEditIntegration = require('../engines/TheNewBlackEditIntegration');
const ConsistentCharacterWithPoseIntegration = require('../engines/ConsistentCharacterWithPoseIntegration');
const IDMVTONIntegration = require('../engines/IDMVTONIntegration');
const TryOnDiffusionIntegration = require('../engines/TryOnDiffusionIntegration');
const LivePortraitIntegration = require('../engines/LivePortraitIntegration');
const StabilityAiTextToImageIntegration = require('../engines/StabilityAiTextToImageIntegration');
const VideoCreationIntegration = require('../engines/VideoCreationIntegration');
const SunoApiIntegration = require('../engines/SunoApiIntegration');
const OpenAITtsIntegration = require('../engines/OpenAITtsIntegration');
const OpenAITranscriptIntegration = require('../engines/OpenAITranscriptIntegration');
const YoutubeVideoPublishIntegration = require('../engines/YoutubeVideoPublishIntegration');
const JsFunctionIntegration = require('../engines/JsFunctionIntegration');
const Mp3ToMp4Integration = require('../engines/Mp3ToMp4Integration');
const AutomaticMaskGeneratorIntegration = require('../engines/AutomaticMaskGeneratorIntegration');
const SD15InpaintingIntegration = require('../engines/SD15InpaintingIntegration');
const FluxPulidIntegration = require('../engines/FluxPulidIntegration');
const ConsistentCharacterAIIntegration = require('../engines/ConsistentCharacterAIIntegration');
const BackgroundReplaceIntegration = require('../engines/BackgroundReplaceIntegration');
const SD1_5Img2ImgIntegration = require('../engines/SD1_5Img2ImgIntegration');
const SyncedMediaGenerationIntegration = require('../engines/SyncedMediaGenerationIntegration');
const MimicMotionIntegration = require('../engines/MimicMotionIntegration');
const AudioFrequencyAdjustmentIntegration = require("../engines/AudioFrequencyAdjustmentIntegration");
const FfmpegCommandIntegration = require("../engines/FfmpegCommandIntegration");
const YoutubeDownloadIntegration = require("../engines/YoutubeDownloadIntegration");
const AudioIsolationIntegration = require('../engines/AudioIsolationIntegration');
const MusifyConvertVoicesIntegration = require('../engines/MusifyConvertVoicesIntegration');
const MVSEPIntegration = require('../engines/MVSEPIntegration');


module.exports = {
  async processPrompt(prompt, engine, model, parametrosModelo) {
    try {
      console.log(`Processando com ${engine} - ${model}`);

      let integrationClass;

      switch (engine.toLowerCase()) {
        case 'ai-product-photo-editor':
          integrationClass = AIProductPhotoEditorIntegration;
          break;
        case "audio-frequency-adjustment":
          integrationClass = AudioFrequencyAdjustmentIntegration;
          break;          
        case "audio-isolation":
          integrationClass = AudioIsolationIntegration;
          break;
        case 'automatic-mask-generator':
          integrationClass = AutomaticMaskGeneratorIntegration;
          break;
        case 'background-replace':
          integrationClass = BackgroundReplaceIntegration;
          break;          
        case 'brainstorm-ai':
          integrationClass = BrainstormAIIntegration;
          break;
        case 'carousel':
          integrationClass = CarouselIntegration;
          break;           
        case 'camila-model':
          integrationClass = CamilaModelIntegration;
          break;           
        case 'consistent-character':
          integrationClass = ConsistentCharacterIntegration;
          break;           
        case 'consistent-character-with-pose':
          integrationClass = ConsistentCharacterWithPoseIntegration;
          break;        
        case 'consistent-character-ai':
          integrationClass = ConsistentCharacterAIIntegration;
          break;          
        case 'dall-e':
          integrationClass = DallEIntegration;
          break;
        case 'deepseek':
          integrationClass = DeepSeekIntegration;
          break;          
        case 'elevenlabs-text-to-speech':
          integrationClass = ElevenLabsTextToSpeechIntegration;
          break;   
        case 'faceswapv2':
          integrationClass = FaceSwapV2Integration;
          break;
        case 'faceswapv3':
          integrationClass = FaceSwapV3Integration;
          break;          
        case "ffmpeg-command":
          integrationClass = FfmpegCommandIntegration;
          break;          
        case 'fluxrealism':
          integrationClass = FluxRealismLoraIntegration;
          break;        
        case 'flux-pulid':
          integrationClass = FluxPulidIntegration;
          break;  
        case 'freepikapi-text-to-image':
          integrationClass = FreePikTextToImageIntegration;
          break;      
        case 'ftp':
          integrationClass = FtpIntegration;//
          break;      
        case 'gemini':
          integrationClass = GeminiIntegration;
          break;
        case 'html-to-image':
          integrationClass = HtmlToImageIntegration;
          break;
        case 'http-command':
          integrationClass = HttpCommandIntegration;
          break;          
        case 'email':
          integrationClass = EmailIntegration;
          break;                    
        case 'hunyuan-video':
          integrationClass = HunyuanVideoIntegration;
          break;
        case 'idmvton':
          integrationClass = IDMVTONIntegration;
          break;                    
        case 'imap':
          integrationClass = ImapIntegration;
          break;                    
        case 'image-repo':
          integrationClass = ImageRepoIntegration;
          break;
        case 'image-to-video':
          integrationClass = ImageToVideoIntegration;
          break;
        case 'inferenceapi-text-to-image':
          integrationClass = InferenceAPIIntegrationTextToImage;
          break;
        case 'inferenceapi-text-generation':
          integrationClass = InferenceAPIIntegrationTextGeneration;
          break;
        case 'inferenceapi-text-to-audio':
          integrationClass = InferenceAPIIntegrationTextToAudio;
          break; 
        case 'inferenceapi-text-to-speech':
          integrationClass = InferenceAPIIntegrationTextToSpeech;
          break;           
        case 'instagram':
          integrationClass = InstagramIntegration;
          break;
        case 'jsfunction':
          integrationClass = JsFunctionIntegration;
          break;
        case 'liveportrait':
          integrationClass = LivePortraitIntegration;
          break;
        case 'mimic-motion':
          integrationClass = MimicMotionIntegration;
          break;
        case 'minimax-ai':
          integrationClass = MiniMaxAIIntegration;
          break;
        case 'music-generation-piapi':
          integrationClass = MusicGenerationPiapiIntegration;
          break;
        case 'musify-convert-voices':
          integrationClass = MusifyConvertVoicesIntegration;
          break;          
        case 'mysql':
          integrationClass = MysqlIntegration;
          break;    
        case 'mp3-to-mp4':
          integrationClass = Mp3ToMp4Integration;
          break;    
        case 'mvsep':
          integrationClass = MVSEPIntegration;
          break;    
        case 'openai':
          integrationClass = OpenAIIntegration;
          break;
        case 'openai-tts':
          integrationClass = OpenAITtsIntegration;
          break;
        case 'openai-transcribe':
          integrationClass = OpenAITranscriptIntegration;
          break;
        case 'outfiting':
          integrationClass = TheNewBlackEditIntegration;
          break;          
        case 'pexels':
          integrationClass = PexelsIntegration;
          break;
        case 'realdreamv9':
          integrationClass = RealdreamPonyV9Integration;
          break;
        case 'runway3-gen-alpha-turbo':
          integrationClass = Runway3GenAlphaTurboIntegration;
          break;
        case 'sad-talker':
          integrationClass = SadTalkerIntegration;
          break;
        case 'serpapi':
          integrationClass = SerpapiIntegration;
          break;
        case 'sd1.5-img2img':
          integrationClass = SD1_5Img2ImgIntegration;
          break;          
        case 'sd1.5-inpainting':
          integrationClass = SD15InpaintingIntegration;
          break;
        case 'sdx-real-dream-lightning':
          integrationClass = SDXLRealDreamLightningIntegration;
          break;
        case 'sd3-img2img':
          integrationClass = SD3Img2ImgIntegration;
          break;
        case 'synced-media-generation':
          integrationClass = SyncedMediaGenerationIntegration;
          break;
        case 'superimposeimg':
          integrationClass = SuperImposeImageIntegration;
          break;
        case 'stablediffusion35':
          integrationClass = StableDiffusion35Integration;
          break;
        case 'stability-ai-text2img':
          integrationClass = StabilityAiTextToImageIntegration;
          break;
        case 'suno-api-music-generation':
          integrationClass = SunoApiIntegration;
          break;
        case 'telegram':
          integrationClass = TelegramIntegration;
          break; 
        case 'textoverlay':
          integrationClass = TextOverlayIntegration;
          break; 
        case 'threads':
          integrationClass = ThreadsIntegration;
          break; 
        case 'tryondiffusion':
          integrationClass = TryOnDiffusionIntegration;
          break; 
        case 'video-creation':
          integrationClass = VideoCreationIntegration;
          break; 
        case 'videoaudiomerge':
          integrationClass = VideoAudioMergeIntegration;
          break; 
        case 'videocaptioner':
          integrationClass = VideoCaptionerIntegration;
          break; 
        case 'videofaceswap':
          integrationClass = VideofaceswapIntegration;
          break; 
        case 'youtube-video-publish':
          integrationClass = YoutubeVideoPublishIntegration;
          break;
        case "youtube-video-download":
          integrationClass = YoutubeDownloadIntegration;
          break;          
        case 'whatsapp':
          integrationClass = WhatsappIntegration;
          break; 
        case 'wordpress':
          integrationClass = WordpressIntegration;
          break;          
        case 'writter-ai':
          integrationClass = WritterAIIntegration;
          break;
        default:
          throw new Error(`Engine não suportada: ${engine}`);//
      }
      console.log(integrationClass);
      
      return await integrationClass.process(prompt, model, parametrosModelo);
    } catch (error) {
      console.error(`Erro na integração com ${engine}:`, error);
      throw error;
    }
  },
};