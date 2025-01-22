const { v4: uuidv4 } = require('uuid');
const SolicitacaoRepository = require('../data/SolicitacaoRepository');
const SolicitacaoAgendamentoRepository = require('../data/SolicitacaoAgendamentoRepository');
const PromptRepository = require('../data/PromptRepository');
const ParametroRepository = require('../data/ParametroRepository');
const ProcessingService = require('../services/ProcessingService');

module.exports = {
//
/**
 * @swagger
 * /solicitacoes:
 *   post:
 *     summary: Cria uma nova solicitação de processamento
 *     description: Cria uma solicitação contendo prompts e seus respectivos parâmetros, associados a um cronograma de execução.
 *     operationId: createSolicitacao
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação para a API
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cron_expression:
 *                 type: string
 *                 description: Expressão cron para agendamento do processamento dos prompts.
 *               cron_start_at:
 *                 type: string
 *                 format: date-time
 *                 description: Data de início da validade do cronograma (opcional).
 *               cron_end_at:
 *                 type: string
 *                 format: date-time
 *                 description: Data de término da validade do cronograma (opcional).
 *               prompts:
 *                 type: array
 *                 items:
 *                   oneOf:
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["youtube-video-download"]
 *                           description: Engine for the YouTube video download integration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/YoutubeDownloadParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["ffmpeg-command"]
 *                           description: Engine for the FFMPEG Command Execution API integration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FfmpegCommandParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["audio-frequency-adjustment"]
 *                           description: Engine for the Audio Frequency Adjustment API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/AudioFrequencyAdjustmentParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["mimic-motion"]
 *                           description: Engine for the MimicMotion API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/MimicMotionParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["synced-media-generation"]
 *                           description: Engine for the Synced Media Generation API integration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SyncedMediaGenerationParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["sd1.5-img2img"]
 *                           description: Engine for the SD1.5 Img2Img API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SD1_5Img2ImgParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["background-replace"]
 *                           description: Engine for the Background Replace API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/BackgroundReplaceParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["consistent-character-ai"]
 *                           description: Engine for the Consistent Character AI
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ConsistentCharacterAIParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["flux-pulid"]
 *                           description: Engine for the Flux-Pulid API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FluxPulidParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["sd1.5-inpainting"]
 *                           description: Engine for the SD1.5 Inpainting API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SD1.5InpaintingParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["automatic-mask-generator"]
 *                           description: Engine for the Automatic Mask Generator API integration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/AutomaticMaskGeneratorParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["mp3-to-mp4"]
 *                           description: Engine for converting an MP3 file to an MP4 video with a looping image
 *                         model_parameters:
 *                           $ref: '#/components/schemas/Mp3ToMp4ConversionParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["jsfunction"]
 *                           description: Engine for executing predefined functions
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FunctionExecutionParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao jsfunction for executing predefined functions
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["youtube-video-publish"]
 *                           description: Engine for sending video publishing requests to the YouTube webhook
 *                         model_parameters:
 *                           $ref: '#/components/schemas/YoutubeVideoPublishParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao youtube-video-publish for sending video publishing requests to the YouTube webhook
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["openai-transcribe"]
 *                           description: Engine para transcrição de áudio usando a API da OpenAI.
 *                         model:
 *                           type: string
 *                           enum: ["whisper-1"]
 *                           description: Modelos suportados para transcrição de áudio usando a API da OpenAI.
 *                         model_parameters:
 *                           $ref: '#/components/schemas/OpenAiTranscriptionParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao openai-transcribe para transcrição de áudio usando a API da OpenAI.
 *                       required: [engine, model,model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["openai-tts"]
 *                           description: Engine for generating audio using the SunoAPI
 *                         model_parameters:
 *                           $ref: '#/components/schemas/OpenApiTtsParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao suno-api-music-generation for generating audio using the SunoAPI
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["suno-api-music-generation"]
 *                           description: Engine for generating audio using the SunoAPI
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SunoApiParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao suno-api-music-generation for generating audio using the SunoAPI
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["video-creation"]
 *                           description: Engine for video creation using the API and FTP storage
 *                         model_parameters:
 *                           $ref: '#/components/schemas/VideoCreationParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao video-creation para video creation using the API and FTP storage
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["stability-ai-text2img"]
 *                           description: Engine para Stability AI image generation API integration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/StabilityAiTextToImageParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao stability-ai-text2img para Stability AI image generation API integration
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["liveportrait"]
 *                           description: Engine para  animates static images using a reference driving video through implicit key point based framework, bringing a portrait to life with realistic expressions and movements
 *                         model_parameters:
 *                           $ref: '#/components/schemas/LivePortraitParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao liveportrait para  animates static images using a reference driving video through implicit key point based framework, bringing a portrait to life with realistic expressions and movements
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["tryondiffusion"]
 *                           description: Engine para Outfitting Fusion based Latent Diffusion for Controllable Virtual Try-on
 *                         model_parameters:
 *                           $ref: '#/components/schemas/TryOnDiffusionParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao tryondiffusion para Outfitting Fusion based Latent Diffusion for Controllable Virtual Try-on
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["idmvton"]
 *                           description: Engine para IDM VTON API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/IDMVTONParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao idmvton para troca de roupa em modelos com IA
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["consistent-character-with-pose"]
 *                           description: Engine para Consistent Character With Pose API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ConsistentCharacterWithPoseParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao Consistent Character With Pose API
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["outfiting"]
 *                           description: Engine para conexao com outfit img
 *                         model_parameters:
 *                           $ref: '#/components/schemas/TheNewBlackAIEditParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao outfit img
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["ftp"]
 *                           description: Engine para conexao com FTP
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FtpIntegrationParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao ftp
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["realdreamv9"]
 *                           description: Engine para Realdream Pony V9 API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/RealdreamPonyV9Parameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao realdreamv9 para text to image
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["fluxrealism"]
 *                           description: Engine para Flux Realism Lora with Upscale API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FluxRealismLoraParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao fluxrealism para text to image
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["stablediffusion35"]
 *                           description: Engine para Stable Diffusion 3.5 Large Text-to-Image API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/StableDiffusion35Parameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao stablediffusion35 para text to image
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["ai-product-photo-editor"]
 *                           description: Engine para edicao de fotos de produto
 *                         model_parameters:
 *                           $ref: '#/components/schemas/AIProductPhotoEditorParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao ai-product-photo-editor para edicao de fotos de produto
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["videocaptioner"]
 *                           description: Engine para geracao de captions/legendas para video
 *                         model_parameters:
 *                           $ref: '#/components/schemas/VideoCaptionerParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao videocaptioner para geracao de captions/legendas para video
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["videoaudiomerge"]
 *                           description: Engine para merge de video e audio
 *                         model_parameters:
 *                           $ref: '#/components/schemas/VideoAudioMergeParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao videoaudiomerge para merge de video e audio
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["camila-model"]
 *                           description: Engine para geracao de fotos da Modelo Camila
 *                         model_parameters:
 *                           $ref: '#/components/schemas/CamilaModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao camila-model para fazer a geracao das fotos de camila
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["superimposeimg"]
 *                           description: Engine Image Superimpose API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ImageSuperimposeParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao superimposeimg para fazer o impose das imagens
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["sd3-img2img"]
 *                           description: Engine Stable Diffusion 3 Medium Image-to-Image API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SD3Img2ImgParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao sd3-img2img para transformar uma imagem em outra 
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["textoverlay"]
 *                           description: Engine Text Overlay
 *                         model_parameters:
 *                           $ref: '#/components/schemas/TextOverlayParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao textoverlay para efeito de textoverlay
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["consistent-character"]
 *                           description: Engine Consistent Character API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ConsistentCharacterParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao consistent-character para geracao consistente de personagens
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["hunyuan-video"]
 *                           description: Engine Hunyuan AI Video Generator
 *                         model_parameters:
 *                           $ref: '#/components/schemas/HunyuanVideoParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao hunyuan-video para geracao de videos
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["minimax-ai"]
 *                           description: Engine MinimaxAI para geracao de videos
 *                         model_parameters:
 *                           $ref: '#/components/schemas/MiniMaxAIParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao minimax-ai para geracao de videos
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["sad-talker"]
 *                           description: Engine Sad Talker API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SadTalkerParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao sad-talker para fazer a sincronizacao de audio com imagem
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["brainstorm-ai"]
 *                           description: Engine para Criação de Brainstorms 
 *                         model_parameters:
 *                           $ref: '#/components/schemas/BrainstormAIModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["openai"]
 *                           description: Engine OpenAI
 *                         model:
 *                           type: string
 *                           enum: ["gpt-4o"]
 *                           default: gpt-4o
 *                           description: Modelos suportados para OpenAI
 *                         model_parameters:
 *                           $ref: '#/components/schemas/OpenAIModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao OpenAI
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["dall-e"]
 *                           description: Engine DALL-E
 *                         model:
 *                           type: string
 *                           enum: ["dall-e-2", "dall-e-3"]
 *                           default: dall-e-3
 *                           description: Modelos suportados para DALL-E
 *                         model_parameters:
 *                           $ref: '#/components/schemas/DallEModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao DALL-E para gerar a imagem
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["deepseek"]
 *                           description: Engine DeepSeek
 *                         model:
 *                           type: string
 *                           enum: ["deepseek-chat"]
 *                           default: deepseek-chat
 *                           description: Modelos suportados para DeepSeek
 *                         model_parameters:
 *                           $ref: '#/components/schemas/DeepSeekModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao DeepSeek
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["carousel"]
 *                           description: Engine Carousel
 *                         model_parameters:
 *                           $ref: '#/components/schemas/CarouselModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["elevenlabs-text-to-speech"]
 *                           description: Engine Elevenlabs para conversão de texto para audio
 *                         model:
 *                           type: string
 *                           enum: ["eleven_multilingual_v2","eleven_turbo_v2_5","eleven_turbo_v2","eleven_flash_v2","eleven_monolingual_v1"]
 *                           default: eleven_multilingual_v2         
 *                           description: Modelos suportados para Engine Elevenlabs para conversão de texto para audio
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ElevenLabsModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt como o texto que vai ser solicitado para transformar em audio
 *                       required: [engine, model, prompt, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["email"]
 *                           description: Engine Email para envio de mensagens
 *                         model_parameters:
 *                           $ref: '#/components/schemas/EmailServiceModelParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["faceswapv2"]
 *                           description: Engine Faceswap V2 API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FaceSwapV2Parameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao faceswapv2 para fazer swap de imagens
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["faceswapv3"]
 *                           description: Engine Faceswap V3 API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FaceSwapV3Parameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao faceswapv2 para fazer swap de imagens
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["videofaceswap"]
 *                           description: Engine Videofaceswap API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/VideoFaceSwapParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao videofaceswap para fazer swap de imagens em video
 *                       required: [engine, model_parameters]  
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["freepikapi-text-to-image"]
 *                           description: Engine Freepik API
 *                         model_parameters:
 *                           $ref: '#/components/schemas/FreepikModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao freepik para gerar a imagem
 *                       required: [engine, prompt, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["gemini"]
 *                           description: Engine Gemini
 *                         model:
 *                           type: string
 *                           enum: ["gemini-1.5-flash"]
 *                           default: gemini-1.5-flash
 *                           description: Modelos suportados para Gemini
 *                         model_parameters:
 *                           $ref: '#/components/schemas/GeminiModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao gemini
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["html-to-image"]
 *                           description: Engine HTML-to-Image
 *                         model_parameters:
 *                           $ref: '#/components/schemas/HTMLToImageModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["http-command"]
 *                           description: Engine Http-Command
 *                         model_parameters:
 *                           $ref: '#/components/schemas/HttpCommandModelParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["image-repo"]
 *                           description: Engine Image Repository
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ImageRepoModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["imap"]
 *                           description: Engine Imap
 *                         model_parameters:
 *                           $ref: '#/components/schemas/IMAPModelParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["image-to-video"]
 *                           description: Engine VideoGeneration
 *                         model_parameters:
 *                           $ref: '#/components/schemas/VideoGenerationParameters'
 *                       required: [engine, model_parameters]  
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["inferenceapi-text-to-audio"]
 *                           description: Engine Inference API Text-to-Audio
 *                         model:
 *                           type: string
 *                           enum: ["facebook/musicgen-small"]
 *                           default: facebook/musicgen-small
 *                           description: Modelos suportados para Inference API Text-to-Audio
 *                         model_parameters:
 *                           $ref: '#/components/schemas/InferenceAPITextToAudioModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao inferenceapi para gerar audio
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["inferenceapi-text-to-image"]
 *                           description: Engine Inference API Text-to-Image
 *                         model:
 *                           type: string
 *                           enum: ["stabilityai/stable-diffusion-2-1","strangerzonehf/Flux-Super-Realism-LoRA","nerijs/dark-fantasy-movie-flux","stabilityai/stable-diffusion-xl-base-1.0","black-forest-labs/FLUX.1-dev","stabilityai/stable-diffusion-3.5-large","fofr/flux-handwriting","stable-diffusion-v1-5/stable-diffusion-v1-5","prashanth970/flux-lora-uncensored","user3712931729/flux-nsfw-highres"]
 *                           default: black-forest-labs/FLUX.1-dev
 *                           description: Modelos suportados para Inference API Text-to-Image
 *                         model_parameters:
 *                           $ref: '#/components/schemas/InferenceAPITextToImageModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao inferenceapi para gerar a imagem
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["inferenceapi-text-generation"]
 *                           description: Engine Inference API Text Generation
 *                         model:
 *                           type: string
 *                           enum: ["meta-llama/Llama-3.3-70B-Instruct","Qwen/Qwen2.5-72B-Instruct","openai-community/gpt2","google/gemma-7b"]
 *                           default: meta-llama/Llama-3.3-70B-Instruct
 *                           description: Modelos suportados para Inference API Text Generation
 *                         model_parameters:
 *                           $ref: '#/components/schemas/InferenceAPITextGenerationModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao inferenceapi para text generation
 *                       required: [engine, model, prompt]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["inferenceapi-text-to-speech"]
 *                           description: Engine Inference API Text To Speech
 *                         model:
 *                           type: string
 *                           enum: ["facebook/fastspeech2-en-ljspeech"]
 *                           default: facebook/fastspeech2-en-ljspeech
 *                           description: Modelos suportados para Inference API Text To Speech
 *                         model_parameters:
 *                           $ref: '#/components/schemas/InferenceAPIIntegrationTextToSpeechModelParameters'
 *                         prompt:
 *                           type: string
 *                           description: Prompt que vai ser solicitado ao inferenceapi para text to speech
 *                       required: [engine, model, prompt] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["instagram"]
 *                           description: Engine Instagram
 *                         model_parameters:
 *                           $ref: '#/components/schemas/InstagramModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["mysql"]
 *                           description: Engine Instagram
 *                         model_parameters:
 *                           $ref: '#/components/schemas/MySQLIntegrationModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["pexels"]
 *                           description: Engine Pexels
 *                         model_parameters:
 *                           $ref: '#/components/schemas/PexelsModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["telegram"]
 *                           description: Engine Telegram
 *                         model_parameters:
 *                           $ref: '#/components/schemas/TelegramModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["threads"]
 *                           description: Engine Threads
 *                         model_parameters:
 *                           $ref: '#/components/schemas/ThreadsModelParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["whatsapp"]
 *                           description: Engine WhatsApp
 *                         model_parameters:
 *                           $ref: '#/components/schemas/WhatsappModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["wordpress"]
 *                           description: Engine WordPress
 *                         model_parameters:
 *                           $ref: '#/components/schemas/WordpressModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["writter-ai"]
 *                           description: Engine Writter-AI
 *                         model_parameters:
 *                           $ref: '#/components/schemas/WritterAIModelParameters'
 *                       required: [engine, model_parameters]
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["sdx-real-dream-lightning"]
 *                           description: Engine Sdx-Real-Dream-Lightning para geração de imagens
 *                         model_parameters:
 *                           $ref: '#/components/schemas/SDXLRealDreamLightningParameters'
 *                       required: [engine, model_parameters] 
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["runway3-gen-alpha-turbo"]
 *                           description: Engine Runway3-Gen-Alpha-Turbo para geração de videos
 *                         model_parameters:
 *                           $ref: '#/components/schemas/RunwayGen3AlphaTurboParameters'
 *                       required: [engine, model_parameters]  
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["music-generation-piapi"]
 *                           description: Engine Music Generation Piapi para geração de músicas
 *                         model_parameters:
 *                           $ref: '#/components/schemas/MusicGenerationPiapiParameters'
 *                       required: [engine, model_parameters]   
 *                     - type: object
 *                       properties:
 *                         engine:
 *                           type: string
 *                           enum: ["serpapi"]
 *                           description: Engine SerpAPI
 *                         model:
 *                           type: string
 *                           enum: ["google_search", "google_maps", "google_finance", "google_trends", "google_flights"]
 *                           description: Modelos suportados para SerpAPI
 *                         model_parameters:
 *                           oneOf:
 *                            - $ref: '#/components/schemas/SerpAPIGoogleSearchParameters'
 *                            - $ref: '#/components/schemas/SerpAPIGoogleMapsParameters'
 *                            - $ref: '#/components/schemas/SerpAPIGoogleFinanceParameters'
 *                            - $ref: '#/components/schemas/SerpAPIGoogleTrendsParameters'
 *                            - $ref: '#/components/schemas/SerpAPIGoogleFlightsParameters'
 *                         discriminator:
 *                           propertyName: model
 *                           mapping:
 *                            google_search: '#/components/schemas/SerpAPIGoogleSearchParameters'
 *                            google_maps: '#/components/schemas/SerpAPIGoogleMapsParameters'
 *                            google_finance: '#/components/schemas/SerpAPIGoogleFinanceParameters'
 *                            google_trends: '#/components/schemas/SerpAPIGoogleTrendsParameters'
 *                            google_flights: '#/components/schemas/SerpAPIGoogleFlightsParameters'
 *                       required: [engine, model, model_parameters]
 *             required: [prompts]
 *     responses:
 *       202:
 *         description: Solicitação criada com sucesso e processamento iniciado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 protocoloUid:
 *                   type: string
 *                   description: Identificador único do protocolo da solicitação
 *       400:
 *         description: Requisição inválida (dados incorretos ou ausentes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensagem de erro
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensagem de erro
 */
  
  
  
  async create(req, res) {
    try {
      const { prompts, cron_expression, cron_start_at, cron_end_at } = req.body;
      
      if (!prompts || !Array.isArray(prompts)) {
        return res.status(400).json({ error: 'Prompts inválidos.' });
      }

      console.log(req.body);
      const protocoloUid = uuidv4();
      const solicitacaoId = await SolicitacaoRepository.createSolicitacao(protocoloUid);
      
      if (cron_expression){
        SolicitacaoAgendamentoRepository.insertAgendamento(solicitacaoId, cron_expression, cron_start_at, cron_end_at);
      }
      
      for (const [index, prompt] of prompts.entries()) {
 
        const promptId = await PromptRepository.insertPrompt(
          solicitacaoId,
          prompt.prompt,
          prompt.engine,
          prompt.model,
          index + 1,
          prompt.model_parameters
        );

        if (prompt.prompt_parameters && Array.isArray(prompt.prompt_parameters)) {
          for (const parametro of prompt.prompt_parameters) {
            await ParametroRepository.insertParametro(promptId, parametro.name, parametro.value);
          }
        }
      }

      res.status(202).json({ protocoloUid });
      if (!cron_expression){
        ProcessingService.process(protocoloUid);
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  /**
 * @swagger
 * /solicitacoes/{protocoloUid}/progress:
 *   get:
 *     summary: Obtém o progresso da solicitação
 *     description: Retorna o status e os prompts processados da solicitação.
 *     operationId: getProgress
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação da API
 *         schema:
 *           type: string
 *       - name: protocoloUid
 *         in: path
 *         required: true
 *         description: Identificador único da solicitação.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progresso da solicitação retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status da solicitação.
 *                 prompts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       prompt:
 *                         type: string
 *       404:
 *         description: Solicitação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
  async getProgress(req, res) {
    try {
      const { protocoloUid } = req.params;

      const solicitacao = await SolicitacaoRepository.getSolicitacaoByProtocolo(protocoloUid);
      if (!solicitacao) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }

      const prompts = await PromptRepository.getPromptsBySolicitacaoWithResult(solicitacao.id);

      res.status(200).json({
        status: solicitacao.status,
        prompts,
      });
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

/**
 * @swagger
 * /solicitacoes/{protocoloUid}/result:
 *   get:
 *     summary: Obtém o resultado da solicitação
 *     description: Retorna o resultado processado da solicitação.
 *     operationId: getResultado
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação da API
 *         schema:
 *           type: string
 *       - name: protocoloUid
 *         in: path
 *         required: true
 *         description: Identificador único da solicitação.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado da solicitação retornado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 resultado:
 *                   type: string
 *                   description: Resultado da solicitação em formato JSON.
 *               example:
 *                 resultado: "{\"data\": {\"key\": \"value\"}}"
 *       404:
 *         description: Solicitação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */

  async getResultado(req, res) {
    try {
      const { protocoloUid } = req.params;

      const solicitacao = await SolicitacaoRepository.getSolicitacaoByProtocolo(protocoloUid);
      if (!solicitacao) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }

      res.status(200).json(solicitacao.resultado_dados || '{}');
    } catch (error) {
      console.error('Erro ao buscar resultado:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  /**
 * @swagger
 * /solicitacoes/{protocoloUid}/resume:
 *   post:
 *     summary: Retoma o processamento da solicitação
 *     description: Endpoint para retomar o processamento de uma solicitação em andamento.
 *     operationId: resumeSolicitacao
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação da API
 *         schema:
 *           type: string
 *       - name: protocoloUid
 *         in: path
 *         required: true
 *         description: Identificador único da solicitação.
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Processamento retomado com sucesso.
 *       400:
 *         description: Solicitação já foi concluída.
 *       404:
 *         description: Solicitação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
  async resume(req, res) {
    try {
      const { protocoloUid } = req.params;

      const solicitacao = await SolicitacaoRepository.getSolicitacaoByProtocolo(protocoloUid);
      if (!solicitacao) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }

      res.status(202).json({ message: 'Processamento retomado.' });
      
      await ProcessingService.resume(protocoloUid);

    } catch (error) {
      console.error('Erro ao retomar solicitação:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },
  
  /**
 * @swagger
 * /solicitacoes/{protocoloUid}:
 *   delete:
 *     summary: Exclui uma solicitação por protocolo
 *     description: Remove a solicitação e seus agendamentos associados com base no identificador único do protocolo.
 *     operationId: deleteSolicitacaoByProtocolo
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação para a API
 *         schema:
 *           type: string
 *       - name: protocoloUid
 *         in: path
 *         required: true
 *         description: Identificador único do protocolo da solicitação
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Solicitação excluída com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Confirmação da exclusão
 *       400:
 *         description: Requisição inválida (dados incorretos ou ausentes)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensagem de erro
 *       404:
 *         description: Solicitação ou agendamentos não encontrados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensagem de erro
 *       500:
 *         description: Erro interno do servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Mensagem de erro
 */
  async deleteByProtocolo(req, res) {
  try {
    const { protocoloUid } = req.params;

    if (!protocoloUid) {
      return res.status(400).json({ error: 'Protocolo inválido ou ausente.' });
    }

    // Obter o ID da solicitação pelo protocolo
    const solicitacaoId = await SolicitacaoRepository.getSolicitacaoIdByProtocolo(protocoloUid);
    if (!solicitacaoId) {
      return res.status(404).json({ error: 'Solicitação não encontrada.' });
    }

    // Excluir agendamentos associados
    await SolicitacaoAgendamentoRepository.deleteAgendamentosBySolicitacao(solicitacaoId);

    // Excluir a solicitação
    await SolicitacaoRepository.deleteSolicitacao(solicitacaoId);

    res.status(200).json({ message: 'Solicitação excluída com sucesso.' });
  } catch (error) {
    console.error('Erro ao excluir solicitação:', error);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
},
 /**
 * @swagger
 * /solicitacoes/{protocoloUid}/process:
 *   post:
 *     summary: Processa uma solicitação (mesmo já tendo concluído)
 *     description: Endpoint para processar uma solicitação
 *     operationId: processarSolicitacao
 *     tags:
 *       - Solicitacoes
 *     parameters:
 *       - name: x-api-key
 *         in: header
 *         required: true
 *         description: Chave de autenticação da API
 *         schema:
 *           type: string
 *       - name: protocoloUid
 *         in: path
 *         required: true
 *         description: Identificador único da solicitação.
 *         schema:
 *           type: string
 *     responses:
 *       202:
 *         description: Processamento retomado com sucesso.
 *       404:
 *         description: Solicitação não encontrada.
 *       500:
 *         description: Erro interno do servidor.
 */
  async process(req, res) {
    try {
      const { protocoloUid } = req.params;

      const solicitacao = await SolicitacaoRepository.getSolicitacaoByProtocolo(protocoloUid);
      if (!solicitacao) {
        return res.status(404).json({ error: 'Solicitação não encontrada.' });
      }

      res.status(202).json({ message: 'Processamento realizado.' });

      await ProcessingService.process(protocoloUid);
    } catch (error) {
      console.error('Erro ao realizar o processamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },  
  
  async callback(req, res) {
    try {
      console.log(req);
      res.status(200).json({ message: 'Processamento realizado.' });
    } catch (error) {
      console.error('Erro ao realizar o processamento:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },
  
};
