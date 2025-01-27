const express = require('express');
const router = require('./routes/index');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cron = require('node-cron');
const DatabaseRepository = require('./data/DatabaseRepository');
const TableCleanerService = require('./services/TableCleanerService');
const pool = require('./config/database');
const dbRepository = new DatabaseRepository(pool);
const tableCleanerService = new TableCleanerService(dbRepository);
const cors = require('cors'); // Importe o pacote cors
// Configuração do Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.1.0', // Especificação OpenAPI 3.0
    info: {
      title: 'API para gestão de pipelines de prompts de integração',
      version: '1.0.0',
      description: 'Documentação da API que permite fazer a gestão de pipelines de prompts de integração. Ela permite compor múltiplos comandos aninhados em formato de pipelines. É possível solicitar a criação da pipeline para execução imediata ou agendada, acompanhar o progresso da pipeline, obter os resultados gerados, resumir a execução, executar ou obter os resultados do processamento.',
    },
    components: {
      schemas: {
      "MusifyConvertVoiceParameters": {
        "type": "object",
        "description": "Parameters for the Convert Voice API integration.",
        "properties": {
          "audio_url": {
            "type": "string",
            "description": "URL of the input audio file.",
            "example": "https://example.com/audio_file.mp3"
          },
          "api_key": {
            "type": "string",
            "description": "The API key for authentication with the Musicfy API.",
            "example": "your_api_key_here"
          },
          "pitch_shift": {
            "type": "string",
            "description": "Pitch shift value for the audio conversion.",
            "default": "0",
            "example": "2"
          },
          "formant_shift": {
            "type": "string",
            "description": "Formant shift value for the audio conversion.",
            "default": "1",
            "example": "1.1"
          },
          "isolate_vocals": {
            "type": "string",
            "description": "Boolean value to isolate vocals.",
            "default": "true",
            "example": "true"
          },
          "background_pitch_shift": {
            "type": "string",
            "description": "Pitch shift value for the background audio.",
            "default": "0",
            "example": "-2"
          },
          "background_formant_shift": {
            "type": "string",
            "description": "Formant shift value for the background audio.",
            "default": "1",
            "example": "1.2"
          },
          "voice_id": {
            "type": "string",
            "description": "ID of the voice to be applied.",
            "example": "c06b8712-2854-4170-b6f5-11b28817d8b3"
          },
          "responseKey": {
            "type": "string",
            "description": "The key for the response structure.",
            "default": "convertVoiceResult",
            "example": "convertVoiceResult"
          }
        },
        "required": ["audio_url", "voice_id"]
      },        
     "AudioIsolationParameters": {
        "type": "object",
        "description": "Parameters for the Audio Isolation API integration.",
        "properties": {
          "audio_url": {
            "type": "string",
            "description": "The URL of the audio file to be processed.",
            "example": "https://example.com/audio_file.wav"
          },
          "api_key": {
            "type": "string",
            "description": "The API key for authentication with the ElevenLabs API.",
            "example": "your_api_key_here"
          },
          "responseKey": {
            "type": "string",
            "description": "The key for the response structure.",
            "example": "audioIsolationResult",
            "default": "audioIsolationResult"
          }
        },
        "required": ["audio_url"]
      },        
      "YoutubeDownloadParameters": {
          "type": "object",
          "description": "Parameters for the YouTube video download integration.",
          "properties": {
            "video_url": {
              "type": "string",
              "description": "The URL of the YouTube video to download.",
              "example": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "youtubeDownloadResult",
              "default": "youtubeDownloadResult"
            }
          },
          "required": ["video_url"]
        },        
      "FfmpegCommandParameters": {
        "type": "object",
        "description": "Parameters for the FFMPEG Command Execution API integration.",
        "properties": {
          "media": {
            "type": "array",
            "description": "An array of media objects containing their IDs and URLs.",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "The ID of the media object.",
                  "example": "fundo"
                },
                "url": {
                  "type": "string",
                  "description": "The URL of the media object.",
                  "example": "https://travelzviagensturismo.com/imagerepo/background.png"
                }
              },
              "required": ["id", "url"]
            }
          },
          "ffmpeg_command": {
            "type": "string",
            "description": "The FFMPEG command to execute.",
            "example": "ffmpeg -i fundo -vf \"subtitles=ass\""
          },
          "output_file": {
            "type": "string",
            "description": "The name of the output file to be generated.",
            "example": "output.png"
          },
          "responseKey": {
            "type": "string",
            "description": "The key for structuring the response.",
            "example": "ffmpegCommandResult",
            "default": "ffmpegCommandResult"
          }
        },
        "required": ["media", "ffmpeg_command", "output_file"]
      },        
      "AudioFrequencyAdjustmentParameters": {
          "type": "object",
          "description": "Parameters for the Audio Frequency Adjustment API integration.",
          "properties": {
            "api_key": {
              "type": "string",
              "description": "The API key for authentication.",
              "example": "YOUR_API_KEY"
            },
            "mp3_url": {
              "type": "string",
              "description": "The URL of the MP3 file to adjust frequency.",
              "example": "https://travelzviagensturismo.com/audiorepo/sample.mp3"
            },
            "desired_frequency": {
              "type": "integer",
              "description": "The desired frequency for the audio file in Hz.",
              "example": 432
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "audioFrequencyAdjustmentResult",
              "default": "audioFrequencyAdjustmentResult"
            }
          },
          "required": ["mp3_url", "desired_frequency"]
        },        
      "MimicMotionParameters": {
          "type": "object",
          "description": "Parameters for the Mimic Motion API integration.",
          "properties": {
            "api_key": {
              "type": "string",
              "description": "The API key for authentication.",
              "example": "YOUR_API_KEY"
            },
            "version": {
              "type": "string",
              "description": "The version of the model to use.",
              "example": "b3edd455f68ec4ccf045da8732be7db837cb8832d1a2459ef057ddcd3ff87dea"
            },
            "input": {
              "type": "object",
              "description": "Input parameters for the Mimic Motion API request.",
              "properties": {
                "motion_video": {
                  "type": "string",
                  "description": "URL of the motion video.",
                  "example": "https://replicate.delivery/pbxt/LD5c2cJou7MsS6J7KMBDfywggKAFCfsc2GUAlo67w4Z8aN30/pose1_trimmed_fixed.mp4"
                },
                "appearance_image": {
                  "type": "string",
                  "description": "URL of the appearance image.",
                  "example": "https://replicate.delivery/pbxt/LD5c2GQlXTIlL1i3ZbVcCybtLlmF4XoPoTnbpCmt38MqMQiS/demo1.jpg"
                }
              },
              "required": ["motion_video", "appearance_image"]
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "mimicMotionResult",
              "default": "mimicMotionResult"
            }
          },
          "required": ["version", "input"]
        },        
        "SyncedMediaGenerationParameters": {
          "type": "object",
          "description": "Parameters for the Synced Media Generation API integration.",
          "properties": {
            "api_key": {
              "type": "string",
              "description": "The API key for authentication.",
              "example": "YOUR_API_KEY"
            },
            "model": {
              "type": "string",
              "description": "The name of the model to use for generation.",
              "example": "lipsync-1.7.1"
            },
            "input": {
              "type": "array",
              "description": "An array of input media objects.",
              "items": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "The type of media (e.g., 'video', 'audio').",
                    "example": "video"
                  },
                  "url": {
                    "type": "string",
                    "description": "The URL of the input media.",
                    "example": "https://example.com/video.mp4"
                  }
                },
                "required": ["type", "url"]
              }
            },
            "options": {
              "type": "object",
              "description": "Additional options for generation.",
              "example": {
                "output_format": "mp4",
                "fps": 24,
                "output_resolution": [1280, 720]
              }
            },
            "webhookUrl": {
              "type": "string",
              "description": "The webhook URL for generation status updates.",
              "example": "https://your-server.com/webhook"
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "syncedMediaResult",
              "default": "syncedMediaResult"
            }
          },
          "required": ["model", "input"]
        },        
      "SD1_5Img2ImgParameters": {
        "type": "object",
        "description": "Parameters for the SD1.5 Img2Img API integration.",
        "properties": {
          "image": {
            "type": "string",
            "description": "The URL of the input image.",
            "example": "https://www.segmind.com/sd-img2img-input.jpeg"
          },
          "prompt": {
            "type": "string",
            "description": "The text description for the image transformation.",
            "example": "A fantasy landscape, trending on artstation, mystical sky"
          },
          "negative_prompt": {
            "type": "string",
            "description": "The text description for elements to avoid.",
            "example": "nude, disfigured, blurry",
            "default": "nude, disfigured, blurry"
          },
          "samples": {
            "type": "integer",
            "description": "Number of output samples to generate.",
            "example": 1,
            "default": 1
          },
          "scheduler": {
            "type": "string",
            "description": "Scheduler type.",
            "example": "DDIM",
            "default": "DDIM"
          },
          "num_inference_steps": {
            "type": "integer",
            "description": "Number of inference steps.",
            "example": 25,
            "default": 25
          },
          "guidance_scale": {
            "type": "number",
            "description": "Guidance scale for the transformation.",
            "example": 10.5,
            "default": 10.5
          },
          "strength": {
            "type": "number",
            "description": "Strength of the transformation.",
            "example": 0.75,
            "default": 0.75
          },
          "seed": {
            "type": "integer",
            "description": "Seed for random number generation.",
            "example": 98877465625,
            "default": 98877465625
          },
          "img_width": {
            "type": "integer",
            "description": "Width of the generated image.",
            "example": 512,
            "default": 512
          },
          "img_height": {
            "type": "integer",
            "description": "Height of the generated image.",
            "example": 512,
            "default": 512
          },
          "base64": {
            "type": "boolean",
            "description": "Indicates if the output should be Base64 encoded.",
            "example": false,
            "default": false
          },
          "api_key": {
            "type": "string",
            "description": "The API key for authentication.",
            "example": "YOUR_API_KEY"
          },
          "responseKey": {
            "type": "string",
            "description": "The key for the response structure.",
            "example": "sd1_5Img2ImgResult",
            "default": "sd1_5Img2ImgResult"
          }
        },
        "required": ["image", "prompt", "api_key"]
      },        
      "BackgroundReplaceParameters": {
          "type": "object",
          "description": "Parameters for the Background Replace API integration.",
          "properties": {
            "image": {
              "type": "string",
              "description": "The URL of the input image.",
              "example": "https://segmind-sd-models.s3.amazonaws.com/outputs/bg_replace_input.jpg"
            },
            "ref_image": {
              "type": "string",
              "description": "The URL of the reference image.",
              "example": "https://segmind-sd-models.s3.amazonaws.com/outputs/bg_input_reference.jpg"
            },
            "prompt": {
              "type": "string",
              "description": "The text description for the background replacement.",
              "example": "Perfume bottle placed on top of a rock, in a jungle"
            },
            "negative_prompt": {
              "type": "string",
              "description": "The text description for elements to avoid.",
              "example": "bad quality, painting, blur",
              "default": "bad quality, painting, blur"
            },
            "samples": {
              "type": "integer",
              "description": "Number of output samples to generate.",
              "example": 1,
              "default": 1
            },
            "scheduler": {
              "type": "string",
              "description": "Scheduler type.",
              "example": "DDIM",
              "default": "DDIM"
            },
            "num_inference_steps": {
              "type": "integer",
              "description": "Number of inference steps.",
              "example": 25,
              "default": 25
            },
            "guidance_scale": {
              "type": "number",
              "description": "Guidance scale for background replacement.",
              "example": 7.5,
              "default": 7.5
            },
            "seed": {
              "type": "integer",
              "description": "Seed for random number generation.",
              "example": 12467,
              "default": 12467
            },
            "strength": {
              "type": "number",
              "description": "Strength of the background replacement.",
              "example": 1,
              "default": 1
            },
            "cn_weight": {
              "type": "number",
              "description": "Weight for conditional noise.",
              "example": 0.9,
              "default": 0.9
            },
            "ip_adapter_weight": {
              "type": "number",
              "description": "Weight for image processing adapter.",
              "example": 0.5,
              "default": 0.5
            },
            "base64": {
              "type": "boolean",
              "description": "Indicates if the output should be Base64 encoded.",
              "example": false,
              "default": false
            },
            "api_key": {
              "type": "string",
              "description": "The API key for authentication.",
              "example": "YOUR_API_KEY"
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "backgroundReplaceResult",
              "default": "backgroundReplaceResult"
            }
          },
          "required": ["image", "ref_image", "prompt"]
        },        
        "ConsistentCharacterAIParameters": {
            "type": "object",
            "description": "Parameters for the Consistent Character AI integration.",
            "properties": {
              "prompt": {
                "type": "string",
                "description": "The text description for the character generation.",
                "example": "young man, beard, light skin, round face, large brown eyes and wavy brown hair, wearing a white t-shirt, red plaid shirt, blue jeans, and brown boots"
              },
              "ip_image": {
                "type": "string",
                "description": "The URL of the input image.",
                "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/def_ip_image.png"
              },
              "api_key": {
                "type": "string",
                "description": "The API key for authentication.",
                "example": "YOUR_API_KEY"
              },
              "steps": {
                "type": "integer",
                "description": "Number of steps for character generation.",
                "example": 10,
                "default": 10
              },
              "guidance_scale": {
                "type": "number",
                "description": "Guidance scale for character generation.",
                "example": 3,
                "default": 3
              },
              "width": {
                "type": "integer",
                "description": "Width of the output image.",
                "example": 1024,
                "default": 1024
              },
              "height": {
                "type": "integer",
                "description": "Height of the output image.",
                "example": 1024,
                "default": 1024
              },
              "seed": {
                "type": "integer",
                "description": "Seed for random number generation.",
                "example": 4898558797,
                "default": 4898558797
              },
              "responseKey": {
                "type": "string",
                "description": "The key for the response structure.",
                "example": "consistentCharacterResult",
                "default": "consistentCharacterResult"
              }
            },
            "required": ["prompt", "ip_image"]
          },        
        "FluxPulidParameters": {
            "type": "object",
            "description": "Parameters for the Flux-Pulid API integration.",
            "properties": {
              "api_key": {
                 "type": "string",
                 "description": "The API key for authenticating with Segmind API.",
                 "example": "sk-1234567890abcdef1234567890abcdef"
              },                
              "prompt": {
                "type": "string",
                "description": "The text description for the image generation.",
                "example": "portrait of woman, neon color, cinematic"
              },
              "main_face_image": {
                "type": "string",
                "description": "The URL of the main face image to be used.",
                "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/flux-pulid-ip.jpeg"
              },
              "seed": {
                "type": "integer",
                "description": "Seed for random number generation.",
                "example": 720558,
                "default": 720558
              },
              "width": {
                "type": "integer",
                "description": "Width of the output image.",
                "example": 896,
                "default": 896
              },
              "height": {
                "type": "integer",
                "description": "Height of the output image.",
                "example": 1152,
                "default": 1152
              },
              "true_cfg": {
                "type": "number",
                "description": "True CFG parameter for the model.",
                "example": 1,
                "default": 1
              },
              "id_weight": {
                "type": "number",
                "description": "Identity weight for the model.",
                "example": 1.05,
                "default": 1.05
              },
              "num_steps": {
                "type": "integer",
                "description": "Number of steps for the generation process.",
                "example": 20,
                "default": 20
              },
              "start_step": {
                "type": "integer",
                "description": "The starting step for the process.",
                "example": 0,
                "default": 0
              },
              "num_outputs": {
                "type": "integer",
                "description": "Number of output images to generate.",
                "example": 1,
                "default": 1
              },
              "output_format": {
                "type": "string",
                "description": "Format of the output file.",
                "example": "webp",
                "default": "webp"
              },
              "guidance_scale": {
                "type": "number",
                "description": "Guidance scale for the image generation.",
                "example": 4,
                "default": 4
              },
              "output_quality": {
                "type": "integer",
                "description": "Quality of the output image.",
                "example": 80,
                "default": 80
              },
              "negative_prompt": {
                "type": "string",
                "description": "Text description of what to avoid in the image.",
                "example": "bad quality, worst quality, text, signature, watermark",
                "default": "bad quality, worst quality, text, signature, watermark"
              },
              "max_sequence_length": {
                "type": "integer",
                "description": "Maximum sequence length for the model.",
                "example": 128,
                "default": 128
              },
              "responseKey": {
                "type": "string",
                "description": "The key for the response structure.",
                "example": "fluxPulidResult",
                "default": "fluxPulidResult"
              }
            },
            "required": ["prompt", "main_face_image"]
          },        
        "SD1.5InpaintingParameters": {
          "type": "object",
          "description": "Parameters for the SD1.5 Inpainting API integration.",
          "properties": {
            "api_key": {
               "type": "string",
               "description": "The API key for authenticating with Segmind API.",
               "example": "sk-1234567890abcdef1234567890abcdef"
            },   
            "prompt": {
              "type": "string",
              "description": "The description for the inpainting operation.",
              "example": "Mecha robot sitting on a bench"
            },
            "negative_prompt": {
              "type": "string",
              "description": "Text to specify what should not be in the output.",
              "example": "Disfigured, cartoon, blurry, nude",
              "default": "Disfigured, cartoon, blurry, nude"
            },
            "samples": {
              "type": "integer",
              "description": "The number of output images to generate.",
              "example": 1,
              "default": 1
            },
            "image": {
              "type": "string",
              "description": "The URL of the input image.",
              "example": "https://segmind.com/inpainting-input-image.jpeg"
            },
            "mask": {
              "type": "string",
              "description": "The URL of the mask image.",
              "example": "https://segmind.com/inpainting-input-mask.jpeg"
            },
            "scheduler": {
              "type": "string",
              "description": "The scheduler to use for the inpainting process.",
              "example": "DDIM",
              "default": "DDIM"
            },
            "num_inference_steps": {
              "type": "integer",
              "description": "Number of inference steps for the model.",
              "example": 25,
              "default": 25
            },
            "guidance_scale": {
              "type": "number",
              "description": "Guidance scale to control the image generation.",
              "example": 7.5,
              "default": 7.5
            },
            "strength": {
              "type": "number",
              "description": "Strength of the inpainting.",
              "example": 1,
              "default": 1
            },
            "seed": {
              "type": "integer",
              "description": "Seed for random number generation.",
              "example": 17123564234,
              "default": "Randomly generated"
            },
            "img_width": {
              "type": "integer",
              "description": "Width of the output image.",
              "example": 512,
              "default": 512
            },
            "img_height": {
              "type": "integer",
              "description": "Height of the output image.",
              "example": 512,
              "default": 512
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "inpaintingResult",
              "default": "inpaintingResult"
            }
          },
          "required": ["prompt", "image", "mask"]
        },        
        "AutomaticMaskGeneratorParameters": {
          "type": "object",
          "description": "Parameters for the Automatic Mask Generator API integration.",
          "properties": {
            "api_key": {
               "type": "string",
               "description": "The API key for authenticating with Segmind API.",
               "example": "sk-1234567890abcdef1234567890abcdef"
            },            
            "prompt": {
              "type": "string",
              "description": "The description or context for the mask generation.",
              "example": "Sofa"
            },
            "image": {
              "type": "string",
              "description": "The URL of the input image.",
              "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/automask-ip.jpg"
            },
            "threshold": {
              "type": "number",
              "description": "The threshold value for the mask generation.",
              "example": 0.2,
              "default": 0.2
            },
            "invert_mask": {
              "type": "boolean",
              "description": "Whether to invert the mask.",
              "example": false,
              "default": false
            },
            "return_mask": {
              "type": "boolean",
              "description": "Whether to return the mask in the response.",
              "example": true,
              "default": true
            },
            "grow_mask": {
              "type": "number",
              "description": "The amount to grow the mask.",
              "example": 10,
              "default": 10
            },
            "seed": {
              "type": "integer",
              "description": "The random seed for reproducibility.",
              "example": 468685,
              "default": 468685
            },
            "base64": {
              "type": "boolean",
              "description": "Whether to return the image in Base64 format.",
              "example": false,
              "default": false
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "automaticMaskResult",
              "default": "automaticMaskResult"
            }
          },
          "required": ["prompt", "image"]
        },        
       "Mp3ToMp4ConversionParameters": {
          "type": "object",
          "description": "Parameters for converting an MP3 file to an MP4 video with a looping image.",
          "properties": {
            "mp3_url": {
              "type": "string",
              "description": "The URL of the MP3 file to be converted.",
              "example": "https://travelzviagensturismo.com/audiorepo/audiofile.mp3"
            },
            "image_url": {
              "type": "string",
              "description": "The URL of the image to be used as the looping background.",
              "example": "https://travelzviagensturismo.com/imagerepo/imagefile.jpg"
            },
            "responseKey": {
              "type": "string",
              "description": "The key for the response structure.",
              "example": "mp3ToMp4ConversionResult",
              "default": "mp3ToMp4ConversionResult"
            }
          },
          "required": ["mp3_url", "image_url"]
        },        
        DallEModelParameters: {
          type: 'object',
          description: 'Parâmetros específicos para a engine dall-e',
          properties: {
            n: {
              type: 'integer',
              description: 'Número de imagens desejadas para geração',
              example: 1,
            },
            size: {
              type: 'string',
              description: 'Resolução da imagem desejada',
              example: '1024x1024',
            },
          },
        },
        "FunctionExecutionParameters": {
          "type": "object",
          "description": "Parameters for executing predefined functions.",
          "properties": {
            "functionName": {
              "type": "string",
              "description": "Name of the predefined function to execute.",
              "examples": ["now", "html_data"]
            },
            "args": {
              "type": "array",
              "description": "Arguments to pass to the function.",
              "items": {
                "type": "string"
              },
              "examples": ["YYYY-MM-DD HH:mm:ss", "https://example.com"]
            },
            "responseKey": {
              "type": "string",
              "description": "Key for the response structure.",
              "default": "functionExecutionResult",
              "example": "functionExecutionResult"
            }
          },
          "required": ["functionName"]
        },        
        "YoutubeVideoPublishParameters": {
          "type": "object",
          "description": "Parameters for sending video publishing requests to the YouTube webhook.",
          "properties": {
            "endpoint": {
              "type": "string",
              "description": "The URL of the YouTube webhook endpoint.",
              "example": "https://hook.us1.make.com/15bp9bsit4hhlagtktwn6vd9wudvpelk"
            },
            "url": {
              "type": "string",
              "description": "The URL of the video to be uploaded.",
              "example": "https://travelzviagensturismo.com/videorepo/video.mp4"
            },
            "title": {
              "type": "string",
              "description": "The title of the video.",
              "example": "Test Video for YouTube Integration"
            },
            "description": {
              "type": "string",
              "description": "The description of the video.",
              "example": "Detailed description of the video for testing the YouTube integration."
            },
            "hashtags": {
              "type": "string",
              "description": "Comma-separated hashtags for the video.",
              "example": "test,integration,youtube"
            },
            "category": {
              "type": "integer",
              "description": "The category ID of the video.",
              "default": 22,
              "example": 22
            },
            "is_made_for_kids": {
              "type": "boolean",
              "description": "Indicates if the video is made for kids.",
              "example": true
            },
            "privacy": {
              "type": "string",
              "description": "Privacy status of the video (public, private, unlisted).",
              "default": "private",
              "example": "private"
            },
            "notify_subscribers": {
              "type": "string",
              "description": "Indicates whether to notify subscribers (yes or no).",
              "default": "yes",
              "example": "yes"
            },
            "allow_embedding": {
              "type": "string",
              "description": "Indicates if embedding is allowed (yes or no).",
              "default": "yes",
              "example": "yes"
            },
            "publish_date": {
              "type": "string",
              "format": "date-time",
              "description": "The date and time the video will be published.",
              "example": "2025-07-10T15:00:00Z"
            },
            "recording_date": {
              "type": "string",
              "format": "date-time",
              "description": "The recording date of the video.",
              "example": "2020-07-10T15:00:00Z"
            }
          },
          "required": [
            "endpoint",
            "url",
            "title",
            "description",
            "hashtags",
            "is_made_for_kids",
            "privacy"
          ]
        },        
        "OpenAiTranscriptionParameters": {
            "type": "object",
            "description": "Parâmetros para transcrição de áudio usando a API da OpenAI.",
            "properties": {
              "audioUrl": {
                "type": "string",
                "description": "URL do arquivo de áudio a ser transcrito.",
                "example": "https://example.com/audio.mp3"
              },
              "options": {
                "type": "object",
                "description": "Opções adicionais para a transcrição ou tradução.",
                "properties": {
                  "model": {
                    "type": "string",
                    "description": "Modelo a ser usado para a transcrição.",
                    "default": "whisper-1",
                    "example": "whisper-1"
                  },
                  "response_format": {
                    "type": "string",
                    "description": "Formato da resposta (json, text, srt, verbose_json, vtt).",
                    "default": "json",
                    "example": "text"
                  },
                  "prompt": {
                    "type": "string",
                    "description": "Prompt para melhorar a qualidade da transcrição.",
                    "example": "Este é um exemplo de prompt para corrigir palavras específicas."
                  },
                  "timestamp_granularities": {
                    "type": "array",
                    "description": "Granularidades de timestamps (word, segment).",
                    "items": {
                      "type": "string",
                      "enum": ["word", "segment"]
                    },
                    "example": ["word"]
                  }
                },
                "required": ["model"]
              }
            },
            "required": ["audioUrl"]
          },        
        "VideoCreationParameters": {
          "type": "object",
          "description": "Parameters for video creation using the API and FTP storage.",
          "properties": {
            "images": {
              "type": "array",
              "description": "List of image objects with URLs to include in the video.",
              "items": {
                "type": "object",
                "properties": {
                  "url": {
                    "type": "string",
                    "description": "The URL of the image.",
                    "example": "https://example.com/image1.png"
                  }
                },
                "required": ["url"]
              }
            },
            "durations": {
              "type": "array",
              "description": "List of durations (in seconds) for each image.",
              "items": {
                "type": "integer",
                "description": "Duration in seconds for the corresponding image.",
                "example": 5
              }
            },
            "audio": {
              "type": "object",
              "description": "Audio narration for the video.",
              "properties": {
                "url": {
                  "type": "string",
                  "description": "URL of the audio file.",
                  "example": "https://example.com/narration.mp3"
                },
                "volume": {
                  "type": "number",
                  "description": "Volume level for the audio.",
                  "example": 1.0
                }
              },
              "required": ["url"]
            },
            "background_music": {
              "type": "object",
              "description": "Background music for the video.",
              "properties": {
                "url": {
                  "type": "string",
                  "description": "URL of the music file.",
                  "example": "https://example.com/background.mp3"
                },
                "volume": {
                  "type": "number",
                  "description": "Volume level for the music.",
                  "example": 0.5
                }
              },
              "required": ["url"]
            },
            "transitions": {
              "type": "array",
              "description": "List of transition effects between images.",
              "items": {
                "type": "object",
                "properties": {
                  "type": {
                    "type": "string",
                    "description": "The type of transition effect.",
                    "example": "fade"
                  },
                  "duration": {
                    "type": "integer",
                    "description": "Duration of the transition in seconds.",
                    "example": 1
                  }
                },
                "required": ["type", "duration"]
              }
            },
            "responseKey": {
              "type": "string",
              "description": "Custom key for the response object.",
              "example": "videoCreationResult"
            }
          },
          "required": ["images", "durations"]
        },    
        "OpenApiTtsParameters": {
            "type": "object",
            "description": "Parameters for text-to-speech audio generation using the OpenAI API and FTP storage.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "The API key for authenticating with the OpenAI API.",
                "example": "sk-1234567890abcdef1234567890abcdef"
              },
              "model": {
                "type": "string",
                "description": "The TTS model to use for audio generation.",
                "enum": ["tts-1", "tts-1-hd"],
                "default": "tts-1",
                "example": "tts-1"
              },
              "input": {
                "type": "string",
                "description": "The text to convert into speech.",
                "example": "Today is a wonderful day to build something people love!"
              },
              "voice": {
                "type": "string",
                "description": "The voice to use for the generated speech.",
                "enum": ["alloy", "echo", "fable", "onyx", "nova", "shimmer"],
                "default": "alloy",
                "example": "alloy"
              },
              "responseKey": {
                "type": "string",
                "description": "Custom key for the response object.",
                "example": "openaiTtsResult"
              }
            },
            "required": ["input"]
          },        
      "SunoApiParameters": {
          "type": "object",
          "description": "Parameters for generating audio using the SunoAPI.",
          "properties": {
            "customMode": {
              "type": "boolean",
              "description": "Enable custom mode. If true, additional parameters are required based on the instrumental setting.",
              "example": true
            },
            "instrumental": {
              "type": "boolean",
              "description": "Generate instrumental music only. If true, no lyrics will be included.",
              "example": false
            },
            "style": {
              "type": "string",
              "description": "Music style (e.g., Jazz, Electronic).",
              "example": "Jazz"
            },
            "title": {
              "type": "string",
              "description": "Title of the music.",
              "example": "Relaxing Piano"
            },
            "model": {
              "type": "string",
              "description": "Model version for audio generation (e.g., V3_5, V4).",
              "example": "V3_5",
              "default":"V3_5"//
            },
            "callBackUrl": {
              "type": "string",
              "description": "Callback URL for task completion notifications.",
              "example": "https://example.com/callback"
            },
            "responseKey": {
              "type": "string",
              "description": "Custom key for the response object.",
              "example": "sunoAudioResult"
            }
          },
          "required": ["customMode", "instrumental", "callBackUrl"],
          "allOf": [
            {
              "if": {
                "properties": {
                  "customMode": { "const": true },
                  "instrumental": { "const": true }
                }
              },
              "then": {
                "required": ["style", "title"]
              }
            },
            {
              "if": {
                "properties": {
                  "customMode": { "const": true },
                  "instrumental": { "const": false }
                }
              },
              "then": {
                "required": ["style", "title"]
              }
            }
          ]
        },        
        "StabilityAiTextToImageParameters": {
            "type": "object",
            "description": "Parameters for Stability AI image generation API integration.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "API Key for authentication with the Stability AI API.",
                "example": "sk-1234567890abcdef"
              },
              "prompt": {
                "type": "string",
                "description": "The text description for the image generation.",
                "example": "Lighthouse on a cliff overlooking the ocean"
              },
              "output_format": {
                "type": "string",
                "description": "The format of the generated image (e.g., 'webp', 'png', 'jpeg').",
                "example": "webp"
              },
              "responseKey": {
                "type": "string",
                "description": "Optional key to specify the structure of the API response.",
                "example": "stabilityAIResult"
              }
            },
            "required": ["api_key", "prompt"]
          },        
      "LivePortraitParameters": {
          "type": "object",
          "description": "Parameters for Live Portrait API integration to animate static images with a driving video.",
          "properties": {
            "api_key": {
              "type": "string",
              "description": "API Key for authentication with the Live Portrait API.",
              "example": "YOUR_API_KEY"
            },
            "face_image": {
              "type": "string",
              "description": "URL of the face image to be animated.",
              "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/liveportrait-input.jpg"
            },
            "driving_video": {
              "type": "string",
              "description": "URL of the driving video to animate the face image.",
              "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/liveportrait-video.mp4"
            },
            "live_portrait_dsize": {
              "type": "integer",
              "description": "Resolution size for the animated portrait.",
              "example": 512
            },
            "live_portrait_scale": {
              "type": "number",
              "description": "Scale factor for the animated portrait.",
              "example": 2.3
            },
            "video_frame_load_cap": {
              "type": "integer",
              "description": "Maximum number of video frames to load.",
              "example": 128
            },
            "live_portrait_lip_zero": {
              "type": "boolean",
              "description": "Enable or disable lip movement retargeting.",
              "example": true
            },
            "live_portrait_relative": {
              "type": "boolean",
              "description": "Use relative positioning for the animation.",
              "example": true
            },
            "live_portrait_vx_ratio": {
              "type": "number",
              "description": "Horizontal adjustment ratio for the animation.",
              "example": 0
            },
            "live_portrait_vy_ratio": {
              "type": "number",
              "description": "Vertical adjustment ratio for the animation.",
              "example": -0.12
            },
            "live_portrait_stitching": {
              "type": "boolean",
              "description": "Enable or disable stitching of animation frames.",
              "example": true
            },
            "video_select_every_n_frames": {
              "type": "integer",
              "description": "Select every Nth frame from the driving video.",
              "example": 1
            },
            "live_portrait_eye_retargeting": {
              "type": "boolean",
              "description": "Enable or disable eye retargeting.",
              "example": false
            },
            "live_portrait_lip_retargeting": {
              "type": "boolean",
              "description": "Enable or disable lip retargeting.",
              "example": false
            },
            "live_portrait_lip_retargeting_multiplier": {
              "type": "number",
              "description": "Multiplier for lip retargeting.",
              "example": 1
            },
            "live_portrait_eyes_retargeting_multiplier": {
              "type": "number",
              "description": "Multiplier for eye retargeting.",
              "example": 1
            },
            "responseKey": {
              "type": "string",
              "description": "Key for the response structure.",
              "example": "livePortraitResult"
            }
          },
          "required": ["face_image", "driving_video"]
        },        
        "TryOnDiffusionParameters": {
            "type": "object",
            "description": "Parameters for the Try-On Diffusion API integration.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "API Key for Try-On Diffusion API (optional if set in environment variables).",
                "example": "your-api-key"
              },
              "model_image": {
                "type": "string",
                "description": "URL of the model image to be used for the virtual try-on.",
                "example": "https://example.com/model.png"
              },
              "cloth_image": {
                "type": "string",
                "description": "URL of the clothing image to be applied to the model.",
                "example": "https://example.com/cloth.jpg"
              },
              "category": {
                "type": "string",
                "description": "Category of the clothing item.",
                "example": "Upper body",
                "default": "Upper body"
              },
              "num_inference_steps": {
                "type": "integer",
                "description": "Number of inference steps for image generation.",
                "example": 35,
                "default": 35
              },
              "guidance_scale": {
                "type": "number",
                "description": "Guidance scale for the diffusion process.",
                "example": 2.0,
                "default": 2.0
              },
              "seed": {
                "type": "integer",
                "description": "Seed for reproducibility.",
                "example": 12467,
                "default": 12467
              },
              "base64": {
                "type": "boolean",
                "description": "Whether to return the image as Base64.",
                "example": false,
                "default": false
              },
              "responseKey": {
                "type": "string",
                "description": "Key for the response structure.",
                "example": "tryOnDiffusionResult",
                "default": "response"
              }
            },
            "required": ["model_image", "cloth_image"]
          },        
        "IDMVTONParameters": {
            "type": "object",
            "description": "Parameters for IDM VTON API integration.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "API key for authentication.",
                "example": "your-api-key"
              },
              "crop": {
                "type": "boolean",
                "description": "Whether to crop the image.",
                "default": false
              },
              "seed": {
                "type": "integer",
                "description": "Seed for random number generation.",
                "default": 42,
                "example": 42
              },
              "steps": {
                "type": "integer",
                "description": "Number of steps for the process.",
                "default": 30,
                "example": 30
              },
              "category": {
                "type": "string",
                "description": "Category of the clothing (e.g., 'upper_body').",
                "default": "upper_body",
                "example": "upper_body"
              },
              "force_dc": {
                "type": "boolean",
                "description": "Whether to force deep conditioning.",
                "default": false
              },
              "human_img": {
                "type": "string",
                "description": "URL of the human image.",
                "example": "https://example.com/human_img.png"
              },
              "garm_img": {
                "type": "string",
                "description": "URL of the garment image.",
                "example": "https://example.com/garment_img.png"
              },
              "mask_only": {
                "type": "boolean",
                "description": "Whether to generate only the mask.",
                "default": false
              },
              "garment_des": {
                "type": "string",
                "description": "Description of the garment.",
                "example": "Green colour semi Formal Blazer"
              },
              "responseKey": {
                "type": "string",
                "description": "Key for the response structure.",
                "example": "idmVTONResponse"
              }
            },
            "required": ["human_img", "garm_img", "garment_des"]
          },        
        "DeepSeekModelParameters": {
          "type": "object",
          "description": "Parâmetros para interações com a engine DeepSeekModelParameters.",
          "properties": {
            "max_tokens": {
              "type": "integer",
              "description": "O número máximo de tokens permitidos na resposta. Necessário para interações de texto.",
              "example": 1000,
              "minimum": 1
            },
            "responseKey": {
              "type": "string",
              "description": "Chave personalizada para o retorno da resposta da API.",
              "example": "resultadoAPI",
              "default": "result"
            }
          },
          "oneOf": [
            {
              "required": ["max_tokens"]
            }
          ],
          "additionalProperties": false
        },
        "OpenAIModelParameters": {
          "type": "object",
          "description": "Parâmetros para interações com a engine OpenAI.",
          "properties": {
            "max_tokens": {
              "type": "integer",
              "description": "O número máximo de tokens permitidos na resposta. Necessário para interações de texto.",
              "example": 1000,
              "minimum": 1
            },
            "image_url": {
              "type": "string",
              "format": "uri",
              "description": "URL da imagem a ser analisada. Necessário para interações baseadas em imagens.",
              "example": "https://example.com/my-image.jpg"
            },
            "responseKey": {
              "type": "string",
              "description": "Chave personalizada para o retorno da resposta da API.",
              "example": "resultadoAPI",
              "default": "result"
            }
          },
          "oneOf": [
            {
              "required": ["max_tokens"]
            },
            {
              "required": ["image_url"]
            }
          ],
          "additionalProperties": false
        },
        "GeminiModelParameters": {
          "type": "object",
          "description": "Parâmetros para interações com a engine Gemini.",
          "properties": {
            "image_url": {
              "type": "string",
              "format": "uri",
              "description": "URL da imagem a ser analisada pela engine Gemini.",
              "example": "https://example.com/my-image.jpg"
            }
          },
          "required": ["image_url"]
        },   
        "BrainstormAIModelParameters": {
            "type": "object",
            "description": "Parâmetros para integração com o Brainstorm AI.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "Chave de API para autenticação no Brainstorm AI."
              },
              "action": {
                "type": "string",
                "description": "Ação a ser executada pela integração.",
                "enum": ["execute", "getLastTitles", "createTitles"]
              },
              "writer_id": {
                "type": "string",
                "description": "ID do redator associado à ação."
              },
              "titles": {
                "type": "array",
                "description": "Lista de títulos a serem criados (apenas para a ação 'createTitles').",
                "items": {
                  "type": "string"
                }
              }
            },
            "required": ["api_key"],
            "oneOf": [
              {
                "description": "Parâmetros para a ação 'execute'.",
                "properties": {
                  "action": {
                    "const": "execute"
                  },
                  "writer_id": {
                    "type": "string",
                    "description": "ID do redator associado à ação."
                  }
                },
                "required": ["action", "writer_id"]
              },
              {
                "description": "Parâmetros para a ação 'getLastTitles'.",
                "properties": {
                  "action": {
                    "const": "getLastTitles"
                  },
                  "writer_id": {
                    "type": "string",
                    "description": "ID do redator associado à ação."
                  }
                },
                "required": ["action", "writer_id"]
              },
              {
                "description": "Parâmetros para a ação 'createTitles'.",
                "properties": {
                  "action": {
                    "const": "createTitles"
                  },
                  "writer_id": {
                    "type": "string",
                    "description": "ID do redator associado à ação."
                  },
                  "titles": {
                    "type": "array",
                    "description": "Lista de títulos a serem criados.",
                    "items": {
                      "type": "string"
                    }
                  }
                },
                "required": ["action", "writer_id", "titles"]
              }
            ]
        },
        "CarouselModelParameters": {
            "type": "object",
            "description": "Parâmetros para integração com o Carousel API.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "Chave de API para autenticação no Carousel API."
              },
              "base_url": {
                "type": "string",
                "format": "uri",
                "description": "Base URL para o serviço Carousel API."
              },
              "action": {
                "type": "string",
                "description": "Ação a ser executada pela integração.",
                "enum": ["generateCarousel", "getProgress", "getCarousel"]
              },
              "payload": {
                "type": "object",
                "description": "Carga de dados necessária para gerar um carousel (apenas para a ação 'generateCarousel').",
                "additionalProperties": true
              },
              "progress_id": {
                "type": "string",
                "description": "ID do progresso associado à geração do carousel (apenas para a ação 'getProgress')."
              },
              "carousel_id": {
                "type": "string",
                "description": "ID do carousel gerado (apenas para a ação 'getCarousel')."
              }
            },
            "required": ["api_key"],
            "oneOf": [
              {
                "description": "Parâmetros para a ação 'generateCarousel'.",
                "properties": {
                  "action": {
                    "const": "generateCarousel"
                  },
                  "payload": {
                    "type": "object",
                    "description": "Carga de dados para gerar o carousel.",
                    "additionalProperties": true
                  }
                },
                "required": ["action", "payload"]
              },
              {
                "description": "Parâmetros para a ação 'getProgress'.",
                "properties": {
                  "action": {
                    "const": "getProgress"
                  },
                  "progress_id": {
                    "type": "string",
                    "description": "ID do progresso associado à geração do carousel."
                  }
                },
                "required": ["action", "progress_id"]
              },
              {
                "description": "Parâmetros para a ação 'getCarousel'.",
                "properties": {
                  "action": {
                    "const": "getCarousel"
                  },
                  "carousel_id": {
                    "type": "string",
                    "description": "ID do carousel gerado."
                  }
                },
                "required": ["action", "carousel_id"]
              }
            ]
          },
          "FreepikModelParameters": {
            "type": "object",
            "description": "Parâmetros para integração com a API Freepik Text-to-Image.",
            "properties": {
              "negative_prompt": {
                "type": "object",
                "description": "Prompt negativo para controlar os elementos a serem evitados na geração da imagem.",
                "additionalProperties": true
              },
              "guidance_scale": {
                "type": "number",
                "description": "Fator de ajuste para influenciar o resultado da imagem. O valor padrão é 1.",
                "example": 1
              },
              "seed": {
                "type": "integer",
                "description": "Semente para a geração de imagens determinísticas. O valor padrão é 0.",
                "example": 42
              },
              "num_images": {
                "type": "integer",
                "description": "Número de imagens a serem geradas. O valor padrão é 1.",
                "example": 5
              },
              "image": {
                "type": "object",
                "description": "Configuração do tamanho da imagem.",
                "properties": {
                  "size": {
                    "type": "string",
                    "description": "Tamanho da imagem gerada. O valor padrão é 'square_1_1'.",
                    "enum": ["square_1_1", "landscape", "portrait"],
                    "example": "landscape"
                  }
                },
                "required": ["size"]
              },
              "styling": {
                "type": "object",
                "description": "Estilização adicional para a geração de imagens.",
                "additionalProperties": true
              }
            },
            "required": ["negative_prompt", "guidance_scale", "seed", "num_images", "image"]
        },
        "HTMLToImageModelParameters": {
            "type": "object",
            "description": "Parâmetros para integração com o serviço HTMLToImageService.",
            "properties": {
              "api_key": {
                "type": "string",
                "description": "Chave de API para autenticação no HTMLToImageService."
              },
              "username": {
                "type": "string",
                "description": "Nome de usuário associado à conta no HTMLToImageService."
              },
              "base_url": {
                "type": "string",
                "format": "uri",
                "description": "URL base do serviço HTMLToImageService.",
                "default": "https://default-base-url.com"
              },
              "action": {
                "type": "string",
                "description": "Ação a ser executada. Atualmente, apenas 'generateImage' é suportado.",
                "enum": ["generateImage"]
              },
              "html": {
                "type": "string",
                "description": "Conteúdo HTML que será convertido em imagem."
              },
              "width": {
                "type": "integer",
                "description": "Largura da imagem gerada. Valor padrão: 1080.",
                "default": 1080,
                "example": 1080
              },
              "height": {
                "type": "integer",
                "description": "Altura da imagem gerada. Valor padrão: 1920.",
                "default": 1920,
                "example": 1920
              },
              "css": {
                "type": "string",
                "description": "CSS adicional para estilizar o conteúdo HTML antes de gerar a imagem.",
                "default": "",
                "example": "body { background-color: #000; }"
              }
            },
            "required": ["api_key", "username", "action", "html"],
            "oneOf": [
              {
                "description": "Parâmetros para a ação 'generateImage'.",
                "properties": {
                  "action": {
                    "const": "generateImage"
                  },
                  "html": {
                    "type": "string",
                    "description": "Conteúdo HTML que será convertido em imagem."
                  },
                  "width": {
                    "type": "integer",
                    "description": "Largura da imagem gerada.",
                    "default": 1080
                  },
                  "height": {
                    "type": "integer",
                    "description": "Altura da imagem gerada.",
                    "default": 1920
                  },
                  "css": {
                    "type": "string",
                    "description": "CSS adicional para estilizar o conteúdo HTML.",
                    "default": ""
                  }
                },
                "required": ["action", "html"]
              }
            ]
          },       
          "ImageRepoModelParameters": {
            "type": "object",
            "description": "Parâmetros para integração com o serviço ImageRepoService.",
            "properties": {
              "apiKey": {
                "type": "string",
                "description": "Chave de API para autenticação no ImageRepoService."
              },
              "baseURL": {
                "type": "string",
                "format": "uri",
                "description": "URL base do serviço ImageRepoService.",
                "default": "https://default-base-url.com"
              },
              "action": {
                "type": "string",
                "description": "Ação a ser executada. Atualmente, apenas 'createImage' é suportado.",
                "enum": ["createImage"]
              },
              "image_url": {
                "type": "string",
                "format": "uri",
                "description": "URL da imagem a ser salva no repositório."
              },
              "metadata": {
                "type": "object",
                "description": "Metadados associados à imagem.",
                "properties": {
                  "description": {
                    "type": "string",
                    "description": "Descrição da imagem.",
                    "default": ""
                  },
                  "tags": {
                    "type": "array",
                    "description": "Lista de tags associadas à imagem.",
                    "items": {
                      "type": "string"
                    },
                    "default": []
                  }
                }
              },
              "extension": {
                "type": "string",
                "description": "Extensão do arquivo de imagem.",
                "enum": [".jpg", ".png", ".gif"],
                "default": ".jpg"
              },
              "ftp_config_id": {
                "type": "integer",
                "description": "ID da configuração do FTP para upload da imagem."
              },
              "base64": {
                "type": "boolean",
                "description": "Indica se o conteúdo da imagem está em Base64.",
                "default": false
              }
            },
            "required": ["apiKey", "action", "image_url", "metadata", "extension", "ftp_config_id"],
            "oneOf": [
              {
                "description": "Parâmetros para a ação 'createImage'.",
                "properties": {
                  "action": {
                    "const": "createImage"
                  },
                  "image_url": {
                    "type": "string",
                    "format": "uri",
                    "description": "URL da imagem a ser salva no repositório."
                  },
                  "metadata": {
                    "type": "object",
                    "description": "Metadados associados à imagem.",
                    "properties": {
                      "description": {
                        "type": "string",
                        "description": "Descrição da imagem.",
                        "default": ""
                      },
                      "tags": {
                        "type": "array",
                        "description": "Lista de tags associadas à imagem.",
                        "items": {
                          "type": "string"
                        },
                        "default": []
                      }
                    }
                  },
                  "extension": {
                    "type": "string",
                    "description": "Extensão do arquivo de imagem.",
                    "enum": [".jpg", ".png", ".gif"],
                    "default": ".jpg"
                  },
                  "ftp_config_id": {
                    "type": "integer",
                    "description": "ID da configuração do FTP para upload da imagem."
                  },
                  "base64": {
                    "type": "boolean",
                    "description": "Indica se o conteúdo da imagem está em Base64.",
                    "default": false
                  }
                },
                "required": ["action", "image_url", "metadata", "extension", "ftp_config_id"]
              }
            ]
          },  
          "ElevenLabsModelParameters": {
             "type": "object",
                "description": "Parameters for the ElevenLabs Text-to-Speech API integration.",
                "properties": {
                  "api_key": {
                    "type": "string",
                    "description": "The API key for authenticating with the ElevenLabs API.",
                    "example": "YOUR_ELEVENLABS_API_KEY"
                  },
                  "voice_id": {
                    "type": "string",
                    "description": "The ID of the voice to use for text-to-speech generation.",
                    "example": "21m00Tcm4TlvDq8ikWAM"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "The key for structuring the response.",
                    "example": "elevenLabsAudioResult",
                    "default": "response"
                  }
                },
                "required": ["voice_id"]
            },       
            "InferenceAPITextToImageModelParameters": {
              "type": "object",
              "description": "Parameters for the Hugging Face Inference API integration.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "The API key for authenticating with the Hugging Face API.",
                  "example": "YOUR_API_KEY"
                },
                "max_length": {
                      "type": "integer",
                      "description": "Maximum length of the generated text.",
                      "example": 100
                },
               "temperature": {
                      "type": "number",
                      "description": "Sampling temperature for the model.",
                      "example": 0.7
                },
               "top_p": {
                      "type": "number",
                      "description": "Nucleus sampling parameter.",
                      "example": 0.9
                    }
                ,
                "responseKey": {
                  "type": "string",
                  "description": "The key for the response structure.",
                  "example": "huggingFaceResult",
                  "default": "huggingFaceResult"
                }
              },
              "required": ["prompt", "model"]
            },        
            "InferenceAPITextGenerationModelParameters": {
                "type": "object",
                "description": "Parameters for the Hugging Face Inference API integration.",
                "properties": {
                  "api_key": {
                    "type": "string",
                    "description": "The API key for authenticating with the Hugging Face API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "The key for the response structure.",
                    "example": "inferenceResult",
                    "default": "response"
                  },
                  "inputs": {
                    "type": "string",
                    "description": "The input prompt or text for the model.",
                    "example": "Generate a realistic image of a futuristic city."
                  }
                },
                "required": ["inputs"]
            },   
            "InferenceAPITextToAudioModelParameters": {
              "type": "object",
              "description": "Parameters for the Hugging Face Inference API integration to generate audio files.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "The API key for authenticating with the Hugging Face API.",
                  "example": "YOUR_API_KEY"
                },
                "responseKey": {
                  "type": "string",
                  "description": "The key for the response structure.",
                  "example": "audioGenerationResult",
                  "default": "response"
                },
                "model": {
                  "type": "string",
                  "description": "The Hugging Face model to be used for generating audio.",
                  "example": "facebook/wav2vec2-large-xlsr-53"
                },
                "inputs": {
                  "type": "string",
                  "description": "The input prompt or text to be used by the model.",
                  "example": "Generate a realistic audio based on this description."
                },
                "parameters": {
                  "type": "object",
                  "description": "Additional parameters to configure the audio generation.",
                  "properties": {
                    "temperature": {
                      "type": "number",
                      "description": "Sampling temperature for the model.",
                      "example": 0.7
                    },
                    "max_length": {
                      "type": "integer",
                      "description": "Maximum length of the generated audio in seconds.",
                      "example": 60
                    },
                    "top_p": {
                      "type": "number",
                      "description": "Nucleus sampling parameter.",
                      "example": 0.9
                    }
                  }
                }
              },
              "required": ["model", "inputs"]
            }, 
            "InferenceAPITextToSpeechModelParameters": {
              "type": "object",
                  "description": "Parameters for the Hugging Face Inference API integration for generating audio from text prompts.",
                  "properties": {
                    "api_key": {
                      "type": "string",
                      "description": "The API key for authenticating with the Hugging Face API.",
                      "example": "YOUR_API_KEY"
                    },
                    "prompt": {
                      "type": "string",
                      "description": "The text prompt or input to generate audio from.",
                      "example": "Generate a smooth and professional voiceover for this text."
                    },
                    "model": {
                      "type": "string",
                      "description": "The model to use for audio generation.",
                      "example": "facebook/wav2vec2-large-xlsr-53"
                    },
                    "responseKey": {
                      "type": "string",
                      "description": "The key for structuring the response.",
                      "example": "speechGenerationResult",
                      "default": "response"
                    },
                    "parameters": {
                      "type": "object",
                      "description": "Additional parameters to configure the audio generation.",
                      "properties": {
                        "temperature": {
                          "type": "number",
                          "description": "Sampling temperature for the model.",
                          "example": 0.7
                        },
                        "max_length": {
                          "type": "integer",
                          "description": "Maximum duration of the generated audio in seconds.",
                          "example": 60
                        },
                        "top_p": {
                          "type": "number",
                          "description": "Nucleus sampling parameter.",
                          "example": 0.9
                        }
                      }
                    }
                  },
                  "required": ["prompt", "model"]
            },   
            "InstagramModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com a API do Instagram.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de API para autenticação na API do Instagram.",
                  "example": "your_api_key"
                },
                "api_base_url": {
                  "type": "string",
                  "description": "URL base da API do Instagram.",
                  "example": "https://graph.instagram.com/"
                },
                "action": {
                  "type": "string",
                  "description": "Ação a ser realizada na API do Instagram.",
                  "enum": ["publishPost", "publishCarousel", "publishReel", "publishStory"],
                  "example": "publishPost"
                },
                "media_url": {
                  "type": "string",
                  "description": "URL da mídia a ser publicada (imagem ou vídeo). Obrigatório para `publishPost` e `publishStory`.",
                  "example": "https://example.com/media.jpg"
                },
                "media_type": {
                  "type": "string",
                  "description": "Tipo de mídia para stories (`image` ou `video`). Obrigatório para `publishStory`.",
                  "enum": ["image", "video"],
                  "example": "image"
                },
                "caption": {
                  "type": "string",
                  "description": "Legenda opcional para a publicação.",
                  "example": "Veja nosso novo post!"
                },
                "slides": {
                  "type": "array",
                  "description": "Lista de URLs de mídia para um carrossel. Obrigatório para `publishCarousel`.",
                  "items": {
                    "type": "string"
                  },
                  "example": ["https://example.com/slide1.jpg", "https://example.com/slide2.jpg"]
                },
                "video_url": {
                  "type": "string",
                  "description": "URL do vídeo a ser publicado como reel. Obrigatório para `publishReel`.",
                  "example": "https://example.com/video.mp4"
                }
              },
              "required": ["api_key", "action"],
              "oneOf": [
                {
                  "description": "Parâmetros para publicar um post.",
                  "properties": {
                    "action": {
                      "const": "publishPost"
                    },
                    "media_url": {
                      "type": "string"
                    }
                  },
                  "required": ["media_url"]
                },
                {
                  "description": "Parâmetros para publicar um carrossel.",
                  "properties": {
                    "action": {
                      "const": "publishCarousel"
                    },
                    "slides": {
                      "type": "array"
                    }
                  },
                  "required": ["slides"]
                },
                {
                  "description": "Parâmetros para publicar um reel.",
                  "properties": {
                    "action": {
                      "const": "publishReel"
                    },
                    "video_url": {
                      "type": "string"
                    }
                  },
                  "required": ["video_url"]
                },
                {
                  "description": "Parâmetros para publicar um story.",
                  "properties": {
                    "action": {
                      "const": "publishStory"
                    },
                    "media_url": {
                      "type": "string"
                    },
                    "media_type": {
                      "type": "string"
                    }
                  },
                  "required": ["media_url", "media_type"]
                }
              ]
            },   
            "WhatsappModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com o WhatsApp Proxy API.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de API para autenticação na API do WhatsApp.",
                  "example": "your_api_key"
                },
                "base_url": {
                  "type": "string",
                  "description": "URL base da API do WhatsApp.",
                  "example": "https://whatsapp.example.com/api"
                },
                "action": {
                  "type": "string",
                  "description": "Ação a ser realizada na API do WhatsApp.",
                  "enum": ["sendMessage", "sendMedia", "sendGroupMessage"],
                  "example": "sendMessage"
                },
                "number": {
                  "type": "string",
                  "description": "Número de telefone do destinatário, no formato internacional.",
                  "example": "+5511999999999"
                },
                "message": {
                  "type": "string",
                  "description": "Texto da mensagem a ser enviada. Obrigatório para 'sendMessage' e 'sendGroupMessage'.",
                  "example": "Olá, tudo bem?"
                },
                "media_url": {
                  "type": "string",
                  "description": "URL do arquivo de mídia a ser enviado. Obrigatório para 'sendMedia'.",
                  "example": "https://example.com/image.jpg"
                },
                "mime_type": {
                  "type": "string",
                  "description": "Tipo MIME do arquivo de mídia. Obrigatório para 'sendMedia'.",
                  "example": "image/jpeg"
                },
                "file_name": {
                  "type": "string",
                  "description": "Nome do arquivo de mídia. Obrigatório para 'sendMedia'.",
                  "example": "imagem.jpg"
                },
                "caption": {
                  "type": "string",
                  "description": "Legenda opcional para a mídia enviada em 'sendMedia'.",
                  "example": "Esta é uma imagem de exemplo."
                },
                "group_id": {
                  "type": "string",
                  "description": "ID do grupo para o qual a mensagem será enviada. Obrigatório para 'sendGroupMessage'.",
                  "example": "1234567890@g.us"
                }
              },
              "required": ["apiKey", "action"],
              "oneOf": [
                {
                  "description": "Parâmetros para enviar uma mensagem de texto.",
                  "properties": {
                    "action": {
                      "const": "sendMessage"
                    },
                    "number": {
                      "type": "string"
                    },
                    "message": {
                      "type": "string"
                    }
                  },
                  "required": ["number", "message"]
                },
                {
                  "description": "Parâmetros para enviar uma mensagem com mídia.",
                  "properties": {
                    "action": {
                      "const": "sendMedia"
                    },
                    "number": {
                      "type": "string"
                    },
                    "media_url": {
                      "type": "string"
                    },
                    "mime_type": {
                      "type": "string"
                    },
                    "file_name": {
                      "type": "string"
                    }
                  },
                  "required": ["number", "media_url", "mime_type", "file_name"]
                },
                {
                  "description": "Parâmetros para enviar uma mensagem para um grupo.",
                  "properties": {
                    "action": {
                      "const": "sendGroupMessage"
                    },
                    "group_id": {
                      "type": "string"
                    },
                    "message": {
                      "type": "string"
                    }
                  },
                  "required": ["group_id", "message"]
                }
              ]
            },
            "TelegramModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com o Telegram Bot API.",
              "properties": {
                "bot_token": {
                  "type": "string",
                  "description": "Token do bot do Telegram para autenticação.",
                  "example": "123456789:ABCDefGhIjKlMnOpQrStUvWxYz1234567890"
                },
                "channel_id": {
                  "type": "string",
                  "description": "ID do canal ou chat no Telegram onde a ação será realizada.",
                  "example": "@meu_canal_telegram"
                },
                "action": {
                  "type": "string",
                  "description": "Ação a ser realizada no Telegram.",
                  "enum": [
                    "sendMessage",
                    "sendPoll",
                    "sendPhoto",
                    "sendDocument",
                    "sendVideo",
                    "sendAudio"
                  ],
                  "example": "sendMessage"
                },
                "message": {
                  "type": "string",
                  "description": "Texto da mensagem a ser enviada. Obrigatório para 'sendMessage'.",
                  "example": "Olá, esta é uma mensagem enviada pelo bot!"
                },
                "question": {
                  "type": "string",
                  "description": "Pergunta para a enquete. Obrigatório para 'sendPoll'.",
                  "example": "Qual é a sua cor favorita?"
                },
                "options": {
                  "type": "array",
                  "description": "Lista de opções para a enquete. Obrigatório para 'sendPoll'.",
                  "items": {
                    "type": "string"
                  },
                  "example": ["Azul", "Verde", "Vermelho", "Amarelo"]
                },
                "photo_url": {
                  "type": "string",
                  "description": "URL da foto a ser enviada. Obrigatório para 'sendPhoto'.",
                  "example": "https://example.com/foto.jpg"
                },
                "document_path": {
                  "type": "string",
                  "description": "Caminho do documento a ser enviado. Obrigatório para 'sendDocument'.",
                  "example": "/path/to/document.pdf"
                },
                "video_path": {
                  "type": "string",
                  "description": "Caminho do vídeo a ser enviado. Obrigatório para 'sendVideo'.",
                  "example": "/path/to/video.mp4"
                },
                "audio_path": {
                  "type": "string",
                  "description": "Caminho do áudio a ser enviado. Obrigatório para 'sendAudio'.",
                  "example": "/path/to/audio.mp3"
                },
                "caption": {
                  "type": "string",
                  "description": "Legenda opcional para a mídia (foto, documento, vídeo, ou áudio).",
                  "example": "Veja este arquivo incrível!"
                }
              },
              "required": ["bot_token", "channel_id", "action"],
              "oneOf": [
                {
                  "description": "Parâmetros para enviar uma mensagem de texto.",
                  "properties": {
                    "action": {
                      "const": "sendMessage"
                    },
                    "message": {
                      "type": "string"
                    }
                  },
                  "required": ["message"]
                },
                {
                  "description": "Parâmetros para enviar uma enquete.",
                  "properties": {
                    "action": {
                      "const": "sendPoll"
                    },
                    "question": {
                      "type": "string"
                    },
                    "options": {
                      "type": "array"
                    }
                  },
                  "required": ["question", "options"]
                },
                {
                  "description": "Parâmetros para enviar uma imagem.",
                  "properties": {
                    "action": {
                      "const": "sendPhoto"
                    },
                    "photo_url": {
                      "type": "string"
                    }
                  },
                  "required": ["photo_url"]
                },
                {
                  "description": "Parâmetros para enviar um documento.",
                  "properties": {
                    "action": {
                      "const": "sendDocument"
                    },
                    "document_path": {
                      "type": "string"
                    }
                  },
                  "required": ["document_path"]
                },
                {
                  "description": "Parâmetros para enviar um vídeo.",
                  "properties": {
                    "action": {
                      "const": "sendVideo"
                    },
                    "video_path": {
                      "type": "string"
                    }
                  },
                  "required": ["video_path"]
                },
                {
                  "description": "Parâmetros para enviar um áudio.",
                  "properties": {
                    "action": {
                      "const": "sendAudio"
                    },
                    "audio_path": {
                      "type": "string"
                    }
                  },
                  "required": ["audio_path"]
                }
              ]
            },      

            "WordpressModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com o WordPress API para publicação de posts.",
              "properties": {
                "webhook_url": {
                  "type": "string",
                  "description": "URL do webhook para envio de notificações. Caso não fornecido, será usado o webhook padrão.",
                  "example": "https://hook.us1.make.com/fy97mitmrsnsy43kaa8x9ousrcy6b2am"
                },
                "title": {
                  "type": "string",
                  "description": "Título do post a ser publicado.",
                  "example": "Como criar integrações automatizadas no WordPress"
                },
                "content": {
                  "type": "string",
                  "description": "Conteúdo do post em formato HTML ou Markdown.",
                  "example": "<p>Este é um exemplo de conteúdo para um post no WordPress.</p>"
                },
                "author": {
                  "type": "string",
                  "description": "Nome do autor do post. Opcional.",
                  "example": "João da Silva"
                },
                "slug": {
                  "type": "string",
                  "description": "Slug do post, utilizado na URL amigável. Opcional.",
                  "example": "como-criar-integracoes-wordpress"
                },
                "excerpt": {
                  "type": "string",
                  "description": "Resumo ou trecho do post. Opcional.",
                  "example": "Aprenda como integrar e automatizar processos no WordPress."
                },
                "feature_media_id": {
                  "type": "integer",
                  "description": "ID da imagem destacada do post no WordPress. Opcional.",
                  "example": 12345
                },
                "parent_object_id": {
                  "type": "integer",
                  "description": "ID do objeto pai para o post, caso aplicável (ex.: ID de um post ao qual este será uma resposta). Opcional.",
                  "example": 67890
                }
              },
              "required": ["title", "content"]
            },
            "WritterAIModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com a API do Writter-IA.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de API para autenticação no Writter-IA.",
                  "example": "your_api_key"
                },
                "writer_id": {
                  "type": "string",
                  "description": "Identificador único do redator associado ao conteúdo.",
                  "example": "writer_12345"
                },
                "action": {
                  "type": "string",
                  "description": "Ação a ser realizada na API do Writter-IA.",
                  "enum": ["getOldestUnusedTitle", "generateContent", "savePublication"],
                  "example": "getOldestUnusedTitle"
                },
                "titulo_id": {
                  "type": "string",
                  "description": "Identificador único do título a ser associado à publicação. Obrigatório para 'savePublication'.",
                  "example": "title_67890"
                },
                "conteudo": {
                  "type": "string",
                  "description": "Conteúdo a ser salvo com o título especificado. Obrigatório para 'savePublication'.",
                  "example": "Este é o conteúdo gerado para o título especificado."
                }
              },
              "required": ["api_key", "writer_id", "action"],
              "oneOf": [
                {
                  "description": "Parâmetros para buscar o título mais antigo não utilizado.",
                  "properties": {
                    "action": {
                      "const": "getOldestUnusedTitle"
                    }
                  }
                },
                {
                  "description": "Parâmetros para gerar conteúdo baseado no título mais antigo.",
                  "properties": {
                    "action": {
                      "const": "generateContent"
                    }
                  }
                },
                {
                  "description": "Parâmetros para salvar uma publicação.",
                  "properties": {
                    "action": {
                      "const": "savePublication"
                    },
                    "titulo_id": {
                      "type": "string"
                    },
                    "conteudo": {
                      "type": "string"
                    }
                  },
                  "required": ["titulo_id", "conteudo"]
                }
              ]
            },
            "HttpCommandModelParameters": {
              "type": "object",
              "description": "Parâmetros para configuração e integração com a API genérica.",
              "properties": {
                "base_url": {
                  "type": "string",
                  "description": "URL base da API para as requisições.",
                  "example": "https://api.example.com/v1"
                },
                "endpoint": {
                  "type": "string",
                  "description": "Endpoint da API que será chamado.",
                  "example": "/execute"
                },
                "method": {
                  "type": "string",
                  "description": "Método HTTP para a requisição.",
                  "enum": ["GET", "POST", "PUT", "DELETE"],
                  "example": "POST"
                },
                "headers": {
                  "type": "object",
                  "description": "Cabeçalhos adicionais para a requisição.",
                  "example": {
                    "Authorization": "Bearer your_api_key",
                    "Content-Type": "application/json"
                  }
                },
                "body": {
                  "type": "object",
                  "description": "Dados do corpo da requisição para métodos POST ou PUT.",
                  "example": {
                    "key1": "value1",
                    "key2": "value2"
                  }
                },
                "params": {
                  "type": "object",
                  "description": "Parâmetros de query opcionais para a requisição.",
                  "example": {
                    "queryParam1": "value1",
                    "queryParam2": "value2"
                  }
                },
                "timeout": {
                  "type": "integer",
                  "description": "Tempo máximo em milissegundos para a requisição. Valor padrão: 5000.",
                  "example": 10000
                },
                "request_id": {
                  "type": "string",
                  "description": "Identificador único para a requisição. Gerado automaticamente se não for fornecido.",
                  "example": "custom-request-id-12345"
                }
              },
              "required": ["base_url", "endpoint", "method"]
            },     
            "ThreadsModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com o Threads API.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Token de acesso para autenticação no Threads API.",
                  "example": "your_access_token"
                },
                "action": {
                  "type": "string",
                  "description": "Ação a ser realizada na API Threads.",
                  "enum": ["publishPost", "publishCarousel"],
                  "example": "publishPost",
                  "default": "publishPost"
                },
                "media_type": {
                  "type": "string",
                  "description": "Tipo de mídia a ser publicada. Opcional para 'publishPost'.",
                  "enum": ["IMAGE", "VIDEO"],
                  "example": "IMAGE"
                },
                "text": {
                  "type": "string",
                  "description": "Texto associado à publicação. Obrigatório para publicações apenas de texto.",
                  "example": "Este é o texto da publicação."
                },
                "image_url": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL da imagem a ser publicada. Obrigatório se 'media_type' for 'IMAGE'.",
                  "example": "https://example.com/image.jpg"
                },
                "video_url": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL do vídeo a ser publicado. Obrigatório se 'media_type' for 'VIDEO'.",
                  "example": "https://example.com/video.mp4"
                },
                "items": {
                  "type": "array",
                  "description": "Lista de objetos representando os itens do carrossel. Obrigatório para 'publishCarousel'.",
                  "items": {
                    "type": "object",
                    "properties": {
                      "media_type": {
                        "type": "string",
                        "description": "Tipo de mídia para o item do carrossel.",
                        "enum": ["image", "video"],
                        "example": "image"
                      },
                      "image_url": {
                        "type": "string",
                        "format": "uri",
                        "description": "URL da imagem para o item do carrossel. Obrigatório se 'media_type' for 'image'.",
                        "example": "https://example.com/carousel-image.jpg"
                      },
                      "video_url": {
                        "type": "string",
                        "format": "uri",
                        "description": "URL do vídeo para o item do carrossel. Obrigatório se 'media_type' for 'video'.",
                        "example": "https://example.com/carousel-video.mp4"
                      }
                    },
                    "required": ["media_type"]
                  }
                }
              },
              "required": ["api_key", "action"],
              "oneOf": [
                {
                  "description": "Parâmetros para publicar um post de texto no Threads.",
                  "properties": {
                    "action": {
                      "const": "publishPost"
                    },
                    "text": {
                      "type": "string",
                      "description": "Texto associado à publicação. Obrigatório para publicações de texto simples.",
                      "example": "Este é o texto da publicação."
                    }
                  },
                  "required": ["text"]
                },
                {
                  "description": "Parâmetros para publicar um post com mídia no Threads.",
                  "properties": {
                    "action": {
                      "const": "publishPost"
                    },
                    "media_type": {
                      "type": "string",
                      "enum": ["IMAGE", "VIDEO"]
                    },
                    "text": {
                      "type": "string",
                      "description": "Texto associado à publicação. Opcional para publicações com mídia.",
                      "example": "Texto para complementar a publicação."
                    }
                  },
                  "required": ["media_type"]
                },
                {
                  "description": "Parâmetros para publicar um carrossel no Threads.",
                  "properties": {
                    "action": {
                      "const": "publishCarousel"
                    },
                    "items": {
                      "type": "array",
                      "minItems": 2
                    },
                    "text": {
                      "type": "string",
                      "description": "Texto opcional associado ao carrossel.",
                      "example": "Texto complementar ao carrossel."
                    }
                  },
                  "required": ["items"]
                }
              ]
            },      
            "EmailServiceModelParameters": {
                "type": "object",
                "description": "Parâmetros para integração com o serviço externo de envio de e-mails.",
                "properties": {
                  "from": {
                    "type": "string",
                    "format": "email",
                    "description": "Endereço de e-mail do remetente.",
                    "example": "sender@example.com"
                  },
                  "to": {
                    "type": "string",
                    "format": "email",
                    "description": "Endereço de e-mail do destinatário.",
                    "example": "recipient@example.com"
                  },
                  "subject": {
                    "type": "string",
                    "description": "Assunto do e-mail.",
                    "example": "Assunto do E-mail"
                  },
                  "body": {
                    "type": "string",
                    "description": "Conteúdo do e-mail.",
                    "example": "Este é o corpo do e-mail enviado pelo serviço externo."
                  }
                },
                "required": ["from", "to", "subject", "body"]
              },     
              "IMAPModelParameters": {
                  "type": "object",
                  "description": "Parâmetros para integração com servidores IMAP.",
                  "properties": {
                    "api_key": {
                      "type": "string",
                      "description": "API Key para o IMAP.",
                      "example": "ABC"
                    },
                    "user": {
                      "type": "string",
                      "description": "Nome de usuário para autenticação no servidor IMAP.",
                      "example": "user@example.com"
                    },
                    "password": {
                      "type": "string",
                      "description": "Senha do usuário para autenticação no servidor IMAP.",
                      "example": "your_password"
                    },
                    "host": {
                      "type": "string",
                      "description": "Host do servidor IMAP.",
                      "example": "imap.example.com"
                    },
                    "port": {
                      "type": "integer",
                      "description": "Porta para conexão com o servidor IMAP.",
                      "example": 993
                    },
                    "tls": {
                      "type": "boolean",
                      "description": "Indica se a conexão deve usar TLS (Transport Layer Security). O padrão é true.",
                      "example": true
                    },
                    "responseKey": {
                      "type": "string",
                      "description": "Chave de resposta para organizar os resultados no JSON de saída.",
                      "example": "imapResponse"
                    },
                    "download_attachments ": {
                      "type": "boolean",
                      "description": "Indica se os anexos do email devem ou nao ser lidos.",
                      "example": false,
                      "default":false
                    },
                  },
                  "required": ["user", "password", "host", "port", "responseKey"]
                },    
                "MySQLIntegrationModelParameters": {
                    "type": "object",
                    "description": "Parâmetros para a integração com um banco de dados MySQL.",
                    "properties": {
                      "host": {
                        "type": "string",
                        "description": "Endereço do servidor MySQL.",
                        "example": "localhost"
                      },
                      "user": {
                        "type": "string",
                        "description": "Usuário para autenticação no banco de dados.",
                        "example": "root"
                      },
                      "password": {
                        "type": "string",
                        "description": "Senha para autenticação do usuário no banco de dados.",
                        "example": "my_password"
                      },
                      "database": {
                        "type": "string",
                        "description": "Nome do banco de dados a ser utilizado.",
                        "example": "my_database"
                      },
                      "port": {
                        "type": "integer",
                        "description": "Porta para conexão ao banco de dados MySQL. O valor padrão é 3306.",
                        "example": 3306,
                        "default": 3306
                      },
                      "query": {
                        "type": "string",
                        "description": "Consulta SQL a ser executada no banco de dados.",
                        "example": "SELECT * FROM users WHERE id = ?"
                      },
                      "values": {
                        "type": "array",
                        "description": "Valores para as variáveis na consulta SQL (placeholders ?).",
                        "items": {
                          "type": "string"
                        },
                        "example": ["1"]
                      },
                      "responseKey": {
                        "type": "string",
                        "description": "Chave para organizar os resultados na resposta JSON.",
                        "example": "mysqlResponse",
                        "default": "mysqlResponse"
                      }
                    },
                    "required": ["host", "user", "password", "database", "query"]
                  },       
          "PexelsModelParameters": {
              "type": "object",
              "description": "Parâmetros para integração com a API do Pexels para busca de imagens.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de autenticação para a API do Pexels.",
                  "example": "your_pexels_api_key"
                },
                "query": {
                  "type": "string",
                  "description": "Palavra-chave para a busca de imagens.",
                  "example": "espaço"
                },
                "quantidade": {
                  "type": "integer",
                  "description": "Número máximo de imagens a serem retornadas pela busca.",
                  "default": 5,
                  "example": 10
                },
                "responseKey": {
                  "type": "string",
                  "description": "Chave para organizar a resposta no JSON.",
                  "default": "pexelsBusca",
                  "example": "resultadoPexels"
                }
              },
              "required": ["api_key", "query"]
            },     
            "VideoGenerationParameters": {
              "type": "object",
              "description": "Parâmetros para geração de vídeos usando ffmpeg e envio para o ImageRepo.",
              "properties": {
                "imagens": {
                  "type": "array",
                  "description": "URLs das imagens que serão usadas no vídeo.",
                  "items": {
                    "type": "string",
                    "format": "uri",
                    "example": "https://example.com/image1.jpg"
                  },
                  "minItems": 1
                },
                "narracao": {
                  "type": "string",
                  "description": "URL do arquivo de narração em áudio.",
                  "format": "uri",
                  "example": "https://example.com/narracao.mp3"
                },
                "musica": {
                  "type": "string",
                  "description": "URL do arquivo de música de fundo.",
                  "format": "uri",
                  "example": "https://example.com/musica.mp3"
                },
                "tempo_por_imagem": {
                  "type": "integer",
                  "description": "Duração em segundos para cada imagem no vídeo.",
                  "default": 10,
                  "example": 5,
                  "minimum": 1
                },
                "apiKey": {
                  "type": "string",
                  "description": "Chave de API para autenticação no ImageRepo.",
                  "example": "your_image_repo_api_key"
                },
                "responseKey": {
                  "type": "string",
                  "description": "Chave para estruturar a resposta da integração.",
                  "example": "videoResponse"
                }
              },
              "required": ["imagens", "narracao", "musica", "apiKey", "responseKey"]
            },   
            "SerpAPIGoogleSearchParameters": {
                "type": "object",
                "description": "Parâmetros para interações com o Google Search via SerpAPI.",
                "properties": {
                  "query": {
                    "type": "string",
                    "description": "Termo de busca no Google.",
                    "example": "weather in San Francisco"
                  },
                  "location": {
                    "type": "string",
                    "description": "Localização para personalizar a busca.",
                    "example": "San Francisco, California, United States"
                  },
                  "language": {
                    "type": "string",
                    "description": "Idioma dos resultados.",
                    "example": "en"
                  },
                  "num_results": {
                    "type": "integer",
                    "description": "Número de resultados a serem retornados.",
                    "example": 10
                  },
                  "api_key":{
                    "type": "string",
                    "description": "API Key para integração com Serpapi (obrigatório).",
                    "example": "ABC"
                  }
                },
                "required": ["api_key","query"]
              },
              "SerpAPIGoogleMapsParameters": {
                  "type": "object",
                  "description": "Parâmetros para interações com o Google Maps via SerpAPI.",
                  "properties": {
                    "query": {
                      "type": "string",
                      "description": "Local ou termo de busca no Google Maps.",
                      "example": "restaurants near me"
                    },
                    "location": {
                      "type": "string",
                      "description": "Localização para personalizar a busca no Maps.",
                      "example": "New York, New York, United States"
                    },
                    "radius": {
                      "type": "integer",
                      "description": "Raio de busca em metros.",
                      "example": 1000
                    },
                    "num_results": {
                      "type": "integer",
                      "description": "Número de resultados a serem retornados.",
                      "example": 5
                    },
                    "api_key":{
                      "type": "string",
                      "description": "API Key para integração com Serpapi (obrigatório).",
                      "example": "ABC"
                    }
                  },
                  "required": ["api_key","query", "location"]
                },
          "SerpAPIGoogleFinanceParameters": {
              "type": "object",
              "description": "Parâmetros para interações com o Google Finance via SerpAPI.",
              "properties": {
                "ticker": {
                  "type": "string",
                  "description": "Símbolo do ticker da ação ou ativo financeiro.",
                  "example": "AAPL"
                },
                "exchange": {
                  "type": "string",
                  "description": "Bolsa de valores onde o ativo é negociado.",
                  "example": "NASDAQ"
                },
                "currency": {
                  "type": "string",
                  "description": "Moeda de exibição dos valores financeiros.",
                  "example": "USD"
                },
                "api_key":{
                  "type": "string",
                  "description": "API Key para integração com Serpapi (obrigatório).",
                  "example": "ABC"
                }
              },
              "required": ["api_key","ticker"]
            },
          "SerpAPIGoogleTrendsParameters": {
              "type": "object",
              "description": "Parâmetros para interações com o Google Trends via SerpAPI.",
              "properties": {
                "keyword": {
                  "type": "string",
                  "description": "Palavra-chave para análise de tendências.",
                  "example": "artificial intelligence"
                },
                "geo": {
                  "type": "string",
                  "description": "Código do país ou região para personalizar os resultados.",
                  "example": "US"
                },
                "time_range": {
                  "type": "string",
                  "description": "Intervalo de tempo para a análise (ex.: 'past_7_days').",
                  "example": "past_7_days"
                },
                "category": {
                  "type": "integer",
                  "description": "Categoria do Google Trends (opcional).",
                  "example": 0
                },
                "api_key":{
                  "type": "string",
                  "description": "API Key para integração com Serpapi (obrigatório).",
                  "example": "ABC"
                }
              },
              "required": ["api_key","keyword"]
            },    
          "SerpAPIGoogleFlightsParameters": {
              "type": "object",
              "description": "Parâmetros para interações com o Google Flights via SerpAPI.",
              "properties": {
                "departure_id": {
                  "type": "string",
                  "description": "Código do aeroporto de origem.",
                  "example": "JFK"
                },
                "arrival_id": {
                  "type": "string",
                  "description": "Código do aeroporto de destino.",
                  "example": "LAX"
                },
                "outbound_date": {
                  "type": "string",
                  "format": "date",
                  "description": "Data de partida no formato AAAA-MM-DD.",
                  "example": "2024-12-31"
                },
                "return_date": {
                  "type": "string",
                  "format": "date",
                  "description": "Data de retorno no formato AAAA-MM-DD (opcional).",
                  "example": "2025-01-07"
                },
                "adults": {
                  "type": "integer",
                  "description": "Número de adultos na reserva.",
                  "example": 1
                },
                "children": {
                  "type": "integer",
                  "description": "Número de crianças na reserva (opcional).",
                  "example": 0
                },
                "api_key":{
                  "type": "string",
                  "description": "API Key para integração com Serpapi (obrigatório).",
                  "example": "ABC"
                }
              },
              "required": ["api_key","departure_id", "arrival_id", "outbound_date"]
            },  
            "FaceSwapV2Parameters": {
              "type": "object",
              "description": "Parâmetros para interações com a API FaceSwap v2.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de API para integração com FaceSwap v2. Se não fornecida, será usada a variável de ambiente FACESWAP_API_KEY.",
                  "example": "YOUR_API_KEY"
                },
                "source_img": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL da imagem de origem que contém o rosto a ser usado na substituição.",
                  "example": "https://example.com/source.jpg"
                },
                "target_img": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL da imagem de destino onde o rosto será substituído.",
                  "example": "https://example.com/target.jpg"
                },
                "input_faces_index": {
                  "type": "integer",
                  "description": "Índice da face na imagem de destino que será substituída.",
                  "example": 0
                },
                "source_faces_index": {
                  "type": "integer",
                  "description": "Índice da face na imagem de origem que será usada.",
                  "example": 0
                },
                "face_restore": {
                  "type": "string",
                  "description": "Modelo de restauração facial a ser usado no processo. Exemplo: 'codeformer-v0.1.0.pth'.",
                  "example": "codeformer-v0.1.0.pth"
                },
                "base64": {
                  "type": "boolean",
                  "description": "Se verdadeiro, a resposta será retornada no formato Base64.",
                  "example": false
                },
                "responseKey": {
                  "type": "string",
                  "description": "Chave para formatar a resposta da integração.",
                  "example": "faceSwapResult"
                }
              },
              "required": ["source_img", "target_img", "input_faces_index", "source_faces_index", "face_restore"]
            },
            "FaceSwapV3Parameters": {
              "type": "object",
              "description": "Parâmetros para interações com a API FaceSwap v3.",
              "properties": {
                "api_key": {
                  "type": "string",
                  "description": "Chave de API para integração com FaceSwap v3. Se não fornecida, será usada a variável de ambiente FACESWAP_API_KEY.",
                  "example": "YOUR_API_KEY"
                },
                "source_img": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL da imagem de origem que contém o rosto a ser usado na substituição.",
                  "example": "https://example.com/source.jpg"
                },
                "target_img": {
                  "type": "string",
                  "format": "uri",
                  "description": "URL da imagem de destino onde o rosto será substituído.",
                  "example": "https://example.com/target.jpg"
                },
                "input_faces_index": {
                  "type": "integer",
                  "description": "Índice da face na imagem de destino que será substituída.",
                  "example": 0
                },
                "source_faces_index": {
                  "type": "integer",
                  "description": "Índice da face na imagem de origem que será usada.",
                  "example": 0
                },
                "face_restore": {
                  "type": "string",
                  "description": "Modelo de restauração facial a ser usado no processo. Exemplo: 'codeformer-v0.1.0.pth'.",
                  "example": "codeformer-v0.1.0.pth"
                },
                "interpolation": {
                  "type": "string",
                  "description": "Método de interpolação a ser usado.",
                  "example": "Bilinear"
                },
                "detection_face_order": {
                  "type": "string",
                  "description": "Ordem de detecção de rostos na imagem de destino.",
                  "example": "large-small"
                },
                "facedetection": {
                  "type": "string",
                  "description": "Modelo de detecção de rosto a ser usado.",
                  "example": "retinaface_resnet50"
                },
                "detect_gender_input": {
                  "type": "string",
                  "description": "Habilitar ou desabilitar a detecção de gênero na imagem de entrada.",
                  "example": "no"
                },
                "detect_gender_source": {
                  "type": "string",
                  "description": "Habilitar ou desabilitar a detecção de gênero na imagem de origem.",
                  "example": "no"
                },
                "face_restore_weight": {
                  "type": "number",
                  "description": "Peso para restauração facial.",
                  "example": 0.75
                },
                "image_format": {
                  "type": "string",
                  "description": "Formato da imagem gerada.",
                  "example": "jpeg"
                },
                "image_quality": {
                  "type": "integer",
                  "description": "Qualidade da imagem gerada, em escala de 1 a 100.",
                  "example": 95
                },
                "base64": {
                  "type": "boolean",
                  "description": "Se verdadeiro, a resposta será retornada no formato Base64.",
                  "example": false
                },
                "responseKey": {
                  "type": "string",
                  "description": "Chave para formatar a resposta da integração.",
                  "example": "faceSwapResult"
                }
              },
              "required": [
                "source_img",
                "target_img",
                "input_faces_index",
                "source_faces_index",
                "face_restore"
              ]
            },      
            "VideoFaceSwapParameters": {
                "type": "object",
                "description": "Parameters for the Video FaceSwap API integration.",
                "properties": {
                  "source_img": {
                    "type": "string",
                    "description": "URL of the source image to use for face swapping.",
                    "example": "https://example.com/source.jpg"
                  },
                  "video_input": {
                    "type": "string",
                    "description": "URL of the input video for face swapping.",
                    "example": "https://example.com/input.mp4"
                  },
                  "face_restore": {
                    "type": "boolean",
                    "description": "Whether to restore faces in the output video.",
                    "example": true
                  },
                  "input_faces_index": {
                    "type": "integer",
                    "description": "Index of the face to use from the input video.",
                    "example": 0
                  },
                  "source_faces_index": {
                    "type": "integer",
                    "description": "Index of the face to use from the source image.",
                    "example": 0
                  },
                  "face_restore_visibility": {
                    "type": "number",
                    "description": "Face restore visibility level.",
                    "example": 1
                  },
                  "codeformer_weight": {
                    "type": "number",
                    "description": "Weight for the CodeFormer face restoration model.",
                    "example": 0.95
                  },
                  "detect_gender_input": {
                    "type": "string",
                    "description": "Whether to detect gender from the input video.",
                    "example": "no"
                  },
                  "detect_gender_source": {
                    "type": "string",
                    "description": "Whether to detect gender from the source image.",
                    "example": "no"
                  },
                  "frame_load_cap": {
                    "type": "integer",
                    "description": "Frame load cap to limit the number of frames processed.",
                    "example": 0
                  },
                  "base_64": {
                    "type": "boolean",
                    "description": "Whether to return the video in Base64 format.",
                    "example": true
                  },
                  "api_key": {
                    "type": "string",
                    "description": "API Key for the Video FaceSwap API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Custom response key for the output data.",
                    "example": "videoFaceSwapResult"
                  }
                },
                "required": ["source_img", "video_input", "api_key"]
              },  
          "SDXLRealDreamLightningParameters": {
              "type": "object",
              "description": "Parameters for the SDXL1.0 RealDream Lightning API integration.",
              "properties": {
                "prompt": {
                  "type": "string",
                  "description": "The main prompt to generate the image.",
                  "example": "girl in a hat, in a dress Russian patterns, freckles, cornfield, nature background, beautiful landscape, retro style, fashion, magazine cover, professional quality, aesthetics, gentle, beautiful, realism,high detail,high quality, 64k, high resolution, professional photo"
                },
                "negative_prompt": {
                  "type": "string",
                  "description": "Negative prompt to exclude certain features from the generated image.",
                  "example": "blemishes,(worst quality, low quality, illustration, 3d, 2d, painting, cartoons, sketch), open mouth"
                },
                "samples": {
                  "type": "integer",
                  "description": "Number of image samples to generate.",
                  "example": 1
                },
                "scheduler": {
                  "type": "string",
                  "description": "Scheduler to use for inference.",
                  "example": "DPM++ SDE"
                },
                "num_inference_steps": {
                  "type": "integer",
                  "description": "Number of inference steps.",
                  "example": 8
                },
                "guidance_scale": {
                  "type": "number",
                  "description": "Guidance scale for image generation.",
                  "example": 1.2
                },
                "seed": {
                  "type": "integer",
                  "description": "Random seed for reproducibility.",
                  "example": 968875
                },
                "img_width": {
                  "type": "integer",
                  "description": "Width of the generated image.",
                  "example": 768
                },
                "img_height": {
                  "type": "integer",
                  "description": "Height of the generated image.",
                  "example": 1152
                },
                "base64": {
                  "type": "boolean",
                  "description": "Whether to return the image in Base64 format.",
                  "example": true
                },
                "api_key": {
                  "type": "string",
                  "description": "API Key for the SDXL1.0 RealDream Lightning API.",
                  "example": "YOUR_API_KEY"
                },
                "responseKey": {
                  "type": "string",
                  "description": "Custom response key for the output data.",
                  "example": "realDreamResult"
                }
              },
              "required": ["prompt", "api_key"]
            },  
            "RunwayGen3AlphaTurboParameters": {
                "type": "object",
                "description": "Parameters for the Runway Gen3 Alpha Turbo API integration.",
                "properties": {
                  "promptText": {
                    "type": "string",
                    "description": "Textual description of the scene to be generated.",
                    "example": "an astronaut with a mirrored helmet running in the field of sunflowers"
                  },
                  "promptImage": {
                    "type": "string",
                    "description": "URL of the image to be used as a prompt.",
                    "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/runway-gen3-input.png"
                  },
                  "seed": {
                    "type": "integer",
                    "description": "Random seed for reproducibility.",
                    "example": 56698
                  },
                  "ratio": {
                    "type": "string",
                    "description": "Aspect ratio for the generated video.",
                    "example": "16:9"
                  },
                  "duration": {
                    "type": "integer",
                    "description": "Duration of the generated video in seconds.",
                    "example": 5
                  },
                  "api_key": {
                    "type": "string",
                    "description": "API Key for the Runway Gen3 Alpha Turbo API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Custom response key for the output data.",
                    "example": "runwayGen3Result"
                  }
                },
                "required": ["promptText", "promptImage", "api_key"]
            }, 
            "MusicGenerationPiapiParameters": {
                "type": "object",
                "description": "Parameters for music generation using Piapi.",
                "properties": {
                  "model": {
                    "type": "string",
                    "description": "Model to use for music generation.",
                    "example": "music-u",
                    "default": "music-u"
                  },
                  "task_type": {
                    "type": "string",
                    "description": "Type of task to perform.",
                    "example": "generate_music",
                    "default": "generate_music"
                  },
                  "negative_tags": {
                    "type": "string",
                    "description": "Negative tags to avoid in the generation.",
                    "example": "veritatis",
                    "default": "veritatis"
                  },
                  "gpt_description_prompt": {
                    "type": "string",
                    "description": "Description prompt for music generation.",
                    "example": "magna in id in eu"
                  },
                  "lyrics_type": {
                    "type": "string",
                    "description": "Type of lyrics for the generated music.",
                    "example": "instrumental",
                    "default": "instrumental"
                  },
                  "seed": {
                    "type": "integer",
                    "description": "Seed for randomization.",
                    "example": -25443934
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Key to use for the response structure.",
                    "example": "musicGenerationResult"
                  }
                },
                "required": ["model", "task_type", "gpt_description_prompt"]
              }, 
              "SadTalkerParameters": {
                  "type": "object",
                  "description": "Parameters for the SadTalker API integration.",
                  "properties": {
                    "input_image": {
                      "type": "string",
                      "description": "URL of the input image.",
                      "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/sad_talker/sad-talker-input.png"
                    },
                    "input_audio": {
                      "type": "string",
                      "description": "URL of the input audio.",
                      "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/sad_talker/sad_talker_audio_input.mp3"
                    },
                    "pose_style": {
                      "type": "integer",
                      "description": "Pose style for the animation.",
                      "example": 4
                    },
                    "expression_scale": {
                      "type": "number",
                      "description": "Scale for expressions in the animation.",
                      "example": 1.4
                    },
                    "preprocess": {
                      "type": "string",
                      "description": "Preprocessing method.",
                      "example": "full"
                    },
                    "image_size": {
                      "type": "integer",
                      "description": "Size of the generated image.",
                      "example": 256
                    },
                    "enhancer": {
                      "type": "boolean",
                      "description": "Whether to enhance the output.",
                      "example": true
                    },
                    "base64": {
                      "type": "boolean",
                      "description": "Whether to return the image as Base64.",
                      "default": true
                    },
                    "api_key": {
                      "type": "string",
                      "description": "API Key for the SadTalker API.",
                      "example": "YOUR_API_KEY"
                    },
                    "responseKey": {
                      "type": "string",
                      "description": "Key to use for the response structure.",
                      "example": "sadTalkerResult"
                    }
                  },
                  "required": ["input_image", "input_audio"]
                },    
              "MiniMaxAIParameters": {
                  "type": "object",
                  "description": "Parameters for the MiniMax AI video generation integration.",
                  "properties": {
                    "prompt": {
                      "type": "string",
                      "description": "Text description for video generation.",
                      "example": "A woman with long brown hair smiles at another woman with blonde hair in natural lighting."
                    },
                    "prompt_optimizer": {
                      "type": "boolean",
                      "description": "Whether to optimize the text prompt for better video generation.",
                      "example": true
                    },
                    "first_frame_image": {
                      "type": ["string", "null"],
                      "description": "Optional first frame image URL or null.",
                      "example": "https://example.com/first_frame_image.jpg"
                    },
                    "api_key": {
                      "type": "string",
                      "description": "API Key for the MiniMax AI API.",
                      "example": "YOUR_API_KEY"
                    },
                    "responseKey": {
                      "type": "string",
                      "description": "Key to use for the response structure.",
                      "example": "miniMaxResult"
                    }
                  },
                  "required": ["prompt"]
                },        
                "HunyuanVideoParameters": {
                    "type": "object",
                    "description": "Parameters for the Hunyuan AI Video Generator integration with ImageRepo storage.",
                    "properties": {
                      "seed": {
                        "type": "integer",
                        "description": "Seed value for the video generation.",
                        "example": 96501778
                      },
                      "width": {
                        "type": "integer",
                        "description": "Width of the generated video in pixels.",
                        "example": 854
                      },
                      "height": {
                        "type": "integer",
                        "description": "Height of the generated video in pixels.",
                        "example": 480
                      },
                      "prompt": {
                        "type": "string",
                        "description": "Text description for video generation.",
                        "example": "A cat walks on the grass, realistic style."
                      },
                      "flow_shift": {
                        "type": "integer",
                        "description": "Flow shift parameter for video generation.",
                        "example": 7
                      },
                      "infer_steps": {
                        "type": "integer",
                        "description": "Number of inference steps for video generation.",
                        "example": 40
                      },
                      "video_length": {
                        "type": "integer",
                        "description": "Length of the generated video in frames.",
                        "example": 77
                      },
                      "negative_prompt": {
                        "type": "string",
                        "description": "Negative prompt to exclude specific features from the video.",
                        "example": "Aerial view, overexposed, low quality, deformation"
                      },
                      "embedded_guidance_scale": {
                        "type": "number",
                        "description": "Scale factor for embedded guidance during video generation.",
                        "example": 6.0
                      },
                      "api_key": {
                        "type": "string",
                        "description": "API Key for the Hunyuan AI Video Generator API.",
                        "example": "YOUR_API_KEY"
                      },
                      "responseKey": {
                        "type": "string",
                        "description": "Key to use for the response structure.",
                        "example": "hunyuanVideoResult"
                      }
                    },
                    "required": ["prompt"]
                  },        
                  "ConsistentCharacterParameters": {
                      "type": "object",
                      "description": "Parameters for the Consistent Character API integration with ImageRepo storage.",
                      "properties": {
                        "seed": {
                          "type": "integer",
                          "description": "Seed value for consistent character generation.",
                          "example": 42
                        },
                        "prompt": {
                          "type": "string",
                          "description": "Text description for the character generation.",
                          "example": "A photo of a man at a beach, wearing a Hawaiian shirt, looking directly at the camera."
                        },
                        "subject": {
                          "type": "string",
                          "description": "URL of the subject image.",
                          "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/consistent-character-ip.png"
                        },
                        "output_format": {
                          "type": "string",
                          "description": "Format of the output image.",
                          "example": "webp"
                        },
                        "output_quality": {
                          "type": "integer",
                          "description": "Quality of the output image (1-100).",
                          "example": 80
                        },
                        "negative_prompt": {
                          "type": "string",
                          "description": "Negative prompt to exclude specific features from the image.",
                          "example": "low quality,blur"
                        },
                        "randomise_poses": {
                          "type": "boolean",
                          "description": "Whether to randomize character poses.",
                          "example": true
                        },
                        "number_of_outputs": {
                          "type": "integer",
                          "description": "Number of output images to generate.",
                          "example": 1
                        },
                        "number_of_images_per_pose": {
                          "type": "integer",
                          "description": "Number of images per pose to generate.",
                          "example": 1
                        },
                        "api_key": {
                          "type": "string",
                          "description": "API Key for the Consistent Character API.",
                          "example": "YOUR_API_KEY"
                        },
                        "responseKey": {
                          "type": "string",
                          "description": "Key to use for the response structure.",
                          "example": "consistentCharacterResult"
                        }
                      },
                      "required": ["prompt", "subject"]
                    },        
                    "TextOverlayParameters": {
                        "type": "object",
                        "description": "Parameters for the Text Overlay API integration with ImageRepo storage.",
                        "properties": {
                          "align": {
                            "type": "string",
                            "description": "Alignment of the text on the image.",
                            "example": "right"
                          },
                          "base64": {
                            "type": "boolean",
                            "description": "Whether the result should be returned as Base64.",
                            "example": false
                          },
                          "blend_mode": {
                            "type": "string",
                            "description": "Blend mode for the text overlay.",
                            "example": "normal"
                          },
                          "color": {
                            "type": "string",
                            "description": "Color of the text.",
                            "example": "#FFF"
                          },
                          "font": {
                            "type": "string",
                            "description": "Font of the text.",
                            "example": "JosefinSans-Bold"
                          },
                          "font_size": {
                            "type": "integer",
                            "description": "Font size of the text.",
                            "example": 150
                          },
                          "graphspace": {
                            "type": "integer",
                            "description": "Graph space for text placement.",
                            "example": 0
                          },
                          "image": {
                            "type": "string",
                            "description": "URL of the image to overlay text on.",
                            "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/txt_overlay_in.png.jpeg"
                          },
                          "image_format": {
                            "type": "string",
                            "description": "Format of the output image.",
                            "example": "jpeg"
                          },
                          "image_quality": {
                            "type": "integer",
                            "description": "Quality of the output image (1-100).",
                            "example": 90
                          },
                          "linespace": {
                            "type": "integer",
                            "description": "Line spacing for the text.",
                            "example": 10
                          },
                          "margin_x": {
                            "type": "integer",
                            "description": "Horizontal margin for text placement.",
                            "example": 97
                          },
                          "margin_y": {
                            "type": "integer",
                            "description": "Vertical margin for text placement.",
                            "example": 300
                          },
                          "outline_color": {
                            "type": "string",
                            "description": "Color of the text outline.",
                            "example": "#11ff00"
                          },
                          "outline_size": {
                            "type": "integer",
                            "description": "Size of the text outline.",
                            "example": 0
                          },
                          "text": {
                            "type": "string",
                            "description": "The text to overlay on the image.",
                            "example": "TRAVEL\n TODAY"
                          },
                          "text_underlay": {
                            "type": "boolean",
                            "description": "Whether to add an underlay for the text.",
                            "example": true
                          },
                          "wrap": {
                            "type": "integer",
                            "description": "Maximum line width for text wrapping.",
                            "example": 50
                          },
                          "api_key": {
                            "type": "string",
                            "description": "API Key for the Text Overlay API.",
                            "example": "YOUR_API_KEY"
                          },
                          "responseKey": {
                            "type": "string",
                            "description": "Key to use for the response structure.",
                            "example": "textOverlayResult"
                          }
                        },
                        "required": ["image", "text"]},   
          "SD3Img2ImgParameters": {
              "type": "object",
              "description": "Parameters for the Stable Diffusion 3 Medium Image-to-Image API integration with ImageRepo storage.",
              "properties": {
                "prompt": {
                  "type": "string",
                  "description": "Text prompt describing the transformation.",
                  "example": "photo of a boy holding phone on table, 3d pixar style"
                },
                "negative_prompt": {
                  "type": "string",
                  "description": "Text prompt for features to avoid.",
                  "example": "low quality, less details"
                },
                "image": {
                  "type": "string",
                  "description": "URL of the input image.",
                  "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/sd3-img2img-ip.jpg"
                },
                "num_inference_steps": {
                  "type": "integer",
                  "description": "Number of inference steps for the transformation.",
                  "example": 20
                },
                "guidance_scale": {
                  "type": "number",
                  "description": "Guidance scale to control the effect strength.",
                  "example": 5
                },
                "seed": {
                  "type": "integer",
                  "description": "Seed for reproducibility.",
                  "example": 698845
                },
                "samples": {
                  "type": "integer",
                  "description": "Number of samples to generate.",
                  "example": 1
                },
                "strength": {
                  "type": "number",
                  "description": "Strength of the transformation (0 to 1).",
                  "example": 0.7
                },
                "sampler": {
                  "type": "string",
                  "description": "Sampler to use for the transformation.",
                  "example": "dpmpp_2m"
                },
                "scheduler": {
                  "type": "string",
                  "description": "Scheduler to use for the transformation.",
                  "example": "sgm_uniform"
                },
                "base64": {
                  "type": "boolean",
                  "description": "Whether to return the result as Base64.",
                  "example": false
                },
                "api_key": {
                  "type": "string",
                  "description": "API Key for the Stable Diffusion 3 API.",
                  "example": "YOUR_API_KEY"
                },
                "responseKey": {
                  "type": "string",
                  "description": "Key to use for the response structure.",
                  "example": "sd3Img2ImgResult"
                }
              },
              "required": ["prompt", "image"]
            },
            "ImageSuperimposeParameters": {
                "type": "object",
                "description": "Parameters for the Image Superimpose API integration with ImageRepo storage.",
                "properties": {
                  "base_image": {
                    "type": "string",
                    "description": "URL of the base image.",
                    "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/tshirt+mock.jpg"
                  },
                  "overlay_image": {
                    "type": "string",
                    "description": "URL of the overlay image.",
                    "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/tshirt+logo.png"
                  },
                  "rescale_factor": {
                    "type": "number",
                    "description": "Factor to rescale the overlay image.",
                    "example": 0.4
                  },
                  "resize_method": {
                    "type": "string",
                    "description": "Method used to resize the overlay image.",
                    "example": "nearest-exact"
                  },
                  "overlay_resize": {
                    "type": "string",
                    "description": "Resize method for the overlay image.",
                    "example": "Resize by rescale_factor"
                  },
                  "opacity": {
                    "type": "number",
                    "description": "Opacity of the overlay image (0 to 1).",
                    "example": 1
                  },
                  "height": {
                    "type": "integer",
                    "description": "Height of the output image.",
                    "example": 1024
                  },
                  "width": {
                    "type": "integer",
                    "description": "Width of the output image.",
                    "example": 1024
                  },
                  "x_offset": {
                    "type": "integer",
                    "description": "X offset for the overlay image.",
                    "example": 320
                  },
                  "y_offset": {
                    "type": "integer",
                    "description": "Y offset for the overlay image.",
                    "example": 620
                  },
                  "rotation": {
                    "type": "integer",
                    "description": "Rotation angle for the overlay image.",
                    "example": 0
                  },
                  "base64": {
                    "type": "boolean",
                    "description": "Whether to return the result as Base64.",
                    "example": false
                  },
                  "api_key": {
                    "type": "string",
                    "description": "API Key for the Image Superimpose API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Key to use for the response structure.",
                    "example": "superimposeResult"
                  }
                },
                "required": ["base_image", "overlay_image"]
              },   
              "CamilaModelParameters": {
                  "type": "object",
                  "description": "Parameters for the Camila Model API integration with ImageRepo storage.",
                  "properties": {
                    "prompt": {
                      "type": "string",
                      "description": "Prompt text for generating Instagram-style model photos.",
                      "example": "camila"
                    },
                    "steps": {
                      "type": "integer",
                      "description": "Number of inference steps for the model.",
                      "example": 25
                    },
                    "seed": {
                      "type": "integer",
                      "description": "Seed for reproducibility.",
                      "example": 6652105
                    },
                    "scheduler": {
                      "type": "string",
                      "description": "Scheduler type for the model.",
                      "example": "simple"
                    },
                    "sampler_name": {
                      "type": "string",
                      "description": "Sampler name for the model.",
                      "example": "euler"
                    },
                    "aspect_ratio": {
                      "type": "string",
                      "description": "Aspect ratio of the generated image.",
                      "example": "1:1"
                    },
                    "lora_strength": {
                      "type": "number",
                      "description": "Strength of the LoRA adjustments.",
                      "example": 1.5
                    },
                    "api_key": {
                      "type": "string",
                      "description": "API Key for the Camila Model API.",
                      "example": "YOUR_API_KEY"
                    },
                    "responseKey": {
                      "type": "string",
                      "description": "Key to use for the response structure.",
                      "example": "camilaModelResult"
                    }
                  },
                  "required": ["prompt"]
                },  
                "VideoAudioMergeParameters": {
                    "type": "object",
                    "description": "Parameters for the Video Audio Merge API integration with ImageRepo storage.",
                    "properties": {
                      "input_video": {
                        "type": "string",
                        "description": "URL of the input video.",
                        "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/video-audio-merge-input.mp4"
                      },
                      "input_audio": {
                        "type": "string",
                        "description": "URL of the input audio.",
                        "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/audio-merge-input-aud.mp3"
                      },
                      "video_start": {
                        "type": "integer",
                        "description": "Start time (in seconds) for the video.",
                        "example": 0
                      },
                      "video_end": {
                        "type": "integer",
                        "description": "End time (in seconds) for the video. Use -1 for the entire video.",
                        "example": -1
                      },
                      "audio_start": {
                        "type": "integer",
                        "description": "Start time (in seconds) for the audio.",
                        "example": 0
                      },
                      "audio_end": {
                        "type": "integer",
                        "description": "End time (in seconds) for the audio. Use -1 for the entire audio.",
                        "example": -1
                      },
                      "audio_fade_in": {
                        "type": "integer",
                        "description": "Fade-in duration (in seconds) for the audio.",
                        "example": 0
                      },
                      "audio_fade_out": {
                        "type": "integer",
                        "description": "Fade-out duration (in seconds) for the audio.",
                        "example": 0
                      },
                      "override_audio": {
                        "type": "boolean",
                        "description": "Whether to override existing audio in the video.",
                        "example": false
                      },
                      "merge_intensity": {
                        "type": "number",
                        "description": "Intensity of the audio-video merge.",
                        "example": 0.5
                      },
                      "api_key": {
                        "type": "string",
                        "description": "API Key for the Video Audio Merge API.",
                        "example": "YOUR_API_KEY"
                      },
                      "responseKey": {
                        "type": "string",
                        "description": "Key to use for the response structure.",
                        "example": "videoAudioMergeResult"
                      }
                    },
                    "required": ["input_video", "input_audio"]
                  },        
                  "VideoCaptionerParameters": {
                      "type": "object",
                      "description": "Parameters for the Video Captioner API integration with ImageRepo storage.",
                      "properties": {
                        "MaxChars": {
                          "type": "integer",
                          "description": "Maximum number of characters per line in subtitles.",
                          "example": 10
                        },
                        "bg_blur": {
                          "type": "boolean",
                          "description": "Whether to blur the background.",
                          "example": false
                        },
                        "bg_color": {
                          "type": "string",
                          "description": "Background color of subtitles.",
                          "example": "null"
                        },
                        "color": {
                          "type": "string",
                          "description": "Color of the subtitle text.",
                          "example": "white"
                        },
                        "font": {
                          "type": "string",
                          "description": "Font used for the subtitles.",
                          "example": "Poppins/Poppins-ExtraBold.ttf"
                        },
                        "fontsize": {
                          "type": "integer",
                          "description": "Font size of the subtitles.",
                          "example": 7
                        },
                        "highlight_color": {
                          "type": "string",
                          "description": "Color used for subtitle highlights.",
                          "example": "yellow"
                        },
                        "input_video": {
                          "type": "string",
                          "description": "URL of the input video.",
                          "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/hallo_output.mp4"
                        },
                        "kerning": {
                          "type": "integer",
                          "description": "Kerning value for subtitle text.",
                          "example": -2
                        },
                        "opacity": {
                          "type": "number",
                          "description": "Opacity of the subtitle text.",
                          "example": 0
                        },
                        "right_to_left": {
                          "type": "boolean",
                          "description": "Set to true for right-to-left text direction.",
                          "example": false
                        },
                        "stroke_color": {
                          "type": "string",
                          "description": "Stroke color for subtitle text.",
                          "example": "black"
                        },
                        "stroke_width": {
                          "type": "integer",
                          "description": "Stroke width for subtitle text.",
                          "example": 2
                        },
                        "subs_position": {
                          "type": "string",
                          "description": "Subtitle position in the video.",
                          "example": "bottom75"
                        },
                        "api_key": {
                          "type": "string",
                          "description": "API Key for the Video Captioner API.",
                          "example": "YOUR_API_KEY"
                        },
                        "responseKey": {
                          "type": "string",
                          "description": "Key to use for the response structure.",
                          "example": "videoCaptionerResult"
                        }
                      },
                      "required": ["input_video"]
                    },    
            "AIProductPhotoEditorParameters": {
                "type": "object",
                "description": "Parameters for the AI Product Photo Editor API integration with ImageRepo storage.",
                "properties": {
                  "product_image": {
                    "type": "string",
                    "description": "URL of the product image.",
                    "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/ppv3-test/main-ip.jpeg"
                  },
                  "background_image": {
                    "type": "string",
                    "description": "URL of the background image.",
                    "example": "https://segmind-sd-models.s3.amazonaws.com/display_images/ppv3-test/bg6.png"
                  },
                  "prompt": {
                    "type": "string",
                    "description": "Text prompt describing the image.",
                    "example": "photo of a mixer grinder in modern kitchen"
                  },
                  "negative_prompt": {
                    "type": "string",
                    "description": "Negative prompt to filter undesired features.",
                    "example": "illustration, bokeh, low resolution"
                  },
                  "num_inference_steps": {
                    "type": "integer",
                    "description": "Number of inference steps.",
                    "example": 21
                  },
                  "guidance_scale": {
                    "type": "number",
                    "description": "Guidance scale for the image generation.",
                    "example": 6
                  },
                  "seed": {
                    "type": "integer",
                    "description": "Seed for randomization.",
                    "example": 2566965
                  },
                  "sampler": {
                    "type": "string",
                    "description": "Sampler to use for the generation process.",
                    "example": "dpmpp_3m_sde_gpu"
                  },
                  "scheduler": {
                    "type": "string",
                    "description": "Scheduler to use for the generation process.",
                    "example": "karras"
                  },
                  "samples": {
                    "type": "integer",
                    "description": "Number of output samples.",
                    "example": 1
                  },
                  "ipa_weight": {
                    "type": "number",
                    "description": "Weight for IPA embeddings.",
                    "example": 0.3
                  },
                  "ipa_weight_type": {
                    "type": "string",
                    "description": "Type of IPA weight scaling.",
                    "example": "linear"
                  },
                  "ipa_start": {
                    "type": "number",
                    "description": "Start value for IPA scaling.",
                    "example": 0
                  },
                  "ipa_end": {
                    "type": "number",
                    "description": "End value for IPA scaling.",
                    "example": 0.5
                  },
                  "ipa_embeds_scaling": {
                    "type": "string",
                    "description": "Scaling type for IPA embeddings.",
                    "example": "V only"
                  },
                  "cn_strenght": {
                    "type": "number",
                    "description": "ControlNet strength.",
                    "example": 0.85
                  },
                  "cn_start": {
                    "type": "number",
                    "description": "ControlNet start value.",
                    "example": 0
                  },
                  "cn_end": {
                    "type": "number",
                    "description": "ControlNet end value.",
                    "example": 0.8
                  },
                  "dilation": {
                    "type": "integer",
                    "description": "Dilation value for processing.",
                    "example": 10
                  },
                  "mask_threshold": {
                    "type": "integer",
                    "description": "Threshold for masking.",
                    "example": 220
                  },
                  "gaussblur_radius": {
                    "type": "number",
                    "description": "Gaussian blur radius.",
                    "example": 8
                  },
                  "base64": {
                    "type": "boolean",
                    "description": "Whether to return the output as Base64.",
                    "example": false
                  },
                  "api_key": {
                    "type": "string",
                    "description": "API Key for the AI Product Photo Editor API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Key to use for the response structure.",
                    "example": "aiProductPhotoResult"
                  }
                },
                "required": ["product_image", "background_image", "prompt", "api_key"]
              },    
          "StableDiffusion35Parameters": {
              "type": "object",
              "description": "Parameters for the Stable Diffusion 3.5 Large Text-to-Image API integration with ImageRepo storage.",
              "properties": {
                "prompt": {
                  "type": "string",
                  "description": "Text prompt for image generation.",
                  "example": "aesthetic ~*~ #boho #fashion full-body 30-something woman laying on microfloral grass, candid pose, cheerful cursive typography font."
                },
                "negative_prompt": {
                  "type": "string",
                  "description": "Negative prompt to filter undesired features.",
                  "example": "low quality, blurry"
                },
                "steps": {
                  "type": "integer",
                  "description": "Number of inference steps.",
                  "example": 25
                },
                "guidance_scale": {
                  "type": "number",
                  "description": "Guidance scale for the image generation.",
                  "example": 5.5
                },
                "seed": {
                  "type": "integer",
                  "description": "Seed for randomization.",
                  "example": 98552302
                },
                "sampler": {
                  "type": "string",
                  "description": "Sampler to use for the generation process.",
                  "example": "euler"
                },
                "scheduler": {
                  "type": "string",
                  "description": "Scheduler to use for the generation process.",
                  "example": "sgm_uniform"
                },
                "width": {
                  "type": "integer",
                  "description": "Width of the generated image.",
                  "example": 1024
                },
                "height": {
                  "type": "integer",
                  "description": "Height of the generated image.",
                  "example": 1024
                },
                "aspect_ratio": {
                  "type": "string",
                  "description": "Aspect ratio for the generated image.",
                  "example": "custom"
                },
                "batch_size": {
                  "type": "integer",
                  "description": "Number of output images in a batch.",
                  "example": 1
                },
                "image_format": {
                  "type": "string",
                  "description": "Output image format.",
                  "example": "jpeg"
                },
                "image_quality": {
                  "type": "integer",
                  "description": "Output image quality (1-100).",
                  "example": 95
                },
                "base64": {
                  "type": "boolean",
                  "description": "Whether to return the output as Base64.",
                  "example": false
                },
                "api_key": {
                  "type": "string",
                  "description": "API Key for the Stable Diffusion 3.5 Large Text-to-Image API.",
                  "example": "YOUR_API_KEY"
                },
                "responseKey": {
                  "type": "string",
                  "description": "Key to use for the response structure.",
                  "example": "stableDiffusion35Result"
                }
              },
              "required": ["prompt"]
            },        
          "FluxRealismLoraParameters": {
              "type": "object",
              "description": "Parameters for the Flux Realism Lora with Upscale API integration with ImageRepo storage.",
              "properties": {
                "prompt": {
                  "type": "string",
                  "description": "Text prompt for image generation.",
                  "example": "a young woman smiling while speaking onstage from segmind, white background with corporate logos blurred out, tech conference"
                },
                "steps": {
                  "type": "integer",
                  "description": "Number of inference steps.",
                  "example": 20
                },
                "seed": {
                  "type": "integer",
                  "description": "Seed for randomization.",
                  "example": 6652105
                },
                "scheduler": {
                  "type": "string",
                  "description": "Scheduler to use for the generation process.",
                  "example": "simple"
                },
                "sampler_name": {
                  "type": "string",
                  "description": "Sampler to use for the generation process.",
                  "example": "euler"
                },
                "aspect_ratio": {
                  "type": "string",
                  "description": "Aspect ratio for the generated image.",
                  "example": "2:3"
                },
                "width": {
                  "type": "integer",
                  "description": "Width of the generated image.",
                  "example": 1024
                },
                "height": {
                  "type": "integer",
                  "description": "Height of the generated image.",
                  "example": 1024
                },
                "upscale_value": {
                  "type": "integer",
                  "description": "Upscale value for the image.",
                  "example": 2
                },
                "lora_strength": {
                  "type": "number",
                  "description": "Strength of the LoRA model.",
                  "example": 0.8
                },
                "samples": {
                  "type": "integer",
                  "description": "Number of output images in a batch.",
                  "example": 1
                },
                "upscale": {
                  "type": "boolean",
                  "description": "Whether to upscale the image.",
                  "example": false
                },
                "api_key": {
                  "type": "string",
                  "description": "API Key for the Flux Realism Lora API.",
                  "example": "YOUR_API_KEY"
                },
                "responseKey": {
                  "type": "string",
                  "description": "Key to use for the response structure.",
                  "example": "fluxRealismResult"
                }
              },
              "required": ["prompt"]
            },        
            "RealdreamPonyV9Parameters": {
                "type": "object",
                "description": "Parameters for the Realdream Pony V9 API integration with ImageRepo storage.",
                "properties": {
                  "prompt": {
                    "type": "string",
                    "description": "Text prompt for image generation.",
                    "example": "score_9, score_8_up, score_7_up, portrait photo of mature woman from brasil, sitting in restaurant, sun set"
                  },
                  "negative_prompt": {
                    "type": "string",
                    "description": "Negative prompt to exclude certain features.",
                    "example": "worst quality, low quality,cleavage,nfsw,naked, illustration, 3d, 2d, painting, cartoons, sketch"
                  },
                  "samples": {
                    "type": "integer",
                    "description": "Number of output images in a batch.",
                    "example": 1
                  },
                  "scheduler": {
                    "type": "string",
                    "description": "Scheduler to use for the generation process.",
                    "example": "DPM++ 2M SDE Karras"
                  },
                  "num_inference_steps": {
                    "type": "integer",
                    "description": "Number of inference steps.",
                    "example": 25
                  },
                  "guidance_scale": {
                    "type": "number",
                    "description": "Guidance scale for generation.",
                    "example": 7
                  },
                  "seed": {
                    "type": "integer",
                    "description": "Seed for randomization.",
                    "example": 968875
                  },
                  "img_width": {
                    "type": "integer",
                    "description": "Width of the generated image.",
                    "example": 768
                  },
                  "img_height": {
                    "type": "integer",
                    "description": "Height of the generated image.",
                    "example": 1152
                  },
                  "base64": {
                    "type": "boolean",
                    "description": "Whether to return the image as Base64.",
                    "example": false
                  },
                  "api_key": {
                    "type": "string",
                    "description": "API Key for the Realdream Pony V9 API.",
                    "example": "YOUR_API_KEY"
                  },
                  "responseKey": {
                    "type": "string",
                    "description": "Key to use for the response structure.",
                    "example": "realdreamPonyV9Result"
                  }
                },
                "required": ["prompt"]},    
                "FtpIntegrationParameters": {
                    "type": "object",
                    "description": "Parameters for FTP integration to upload files and return an HTTP-accessible URL. Includes root directory support.",
                    "properties": {
                      "ftpHost": {
                        "type": "string",
                        "description": "Hostname or IP address of the FTP server.",
                        "example": "ftp.example.com"
                      },
                      "ftpPort": {
                        "type": "integer",
                        "description": "Port of the FTP server (default: 21).",
                        "example": 21
                      },
                      "ftpUser": {
                        "type": "string",
                        "description": "Username for FTP authentication.",
                        "example": "ftp_user"
                      },
                      "ftpPassword": {
                        "type": "string",
                        "description": "Password for FTP authentication.",
                        "example": "ftp_password"
                      },
                      "baseDomain": {
                        "type": "string",
                        "description": "Base domain for constructing the HTTP access URL.",
                        "example": "https://mydomain.com"
                      },
                      "rootDir": {
                        "type": "string",
                        "description": "Root directory on the FTP server. All target folders will be relative to this directory.",
                        "example": "/home/ftpuser/uploads"
                      },
                      "targetFolder": {
                        "type": "string",
                        "description": "Target folder on the FTP server where the file will be uploaded, relative to the root directory.",
                        "example": "images"
                      },
                      "fileExtension": {
                        "type": "string",
                        "description": "File extension (e.g., jpg, png, mp4).",
                        "example": "jpg"
                      },
                      "originalFileUrl": {
                        "type": "string",
                        "description": "URL of the original file to be downloaded and uploaded to FTP.",
                        "example": "https://example.com/original-file.jpg"
                      },
                      "base64Content": {
                        "type": "string",
                        "description": "Base64-encoded content of the file to be uploaded to FTP.",
                        "example": "iVBORw0KGgoAAAANSUhEUgAA..."
                      },
                      "plainTextContent": {
                        "type": "string",
                        "description": "Plaintext content of the file to be uploaded to FTP.",
                        "example": "ABCD"
                      },                      
                      "responseKey": {
                        "type": "string",
                        "description": "Key for the response structure.",
                        "example": "ftpUploadResult"
                      }
                    },
                    "required": [
                      "ftpHost",
                      "ftpUser",
                      "ftpPassword",
                      "baseDomain",
                      "rootDir",
                      "targetFolder",
                      "fileExtension"
                    ]
                  }, 
                  "TheNewBlackAIEditParameters": {
                      "type": "object",
                      "description": "Parameters for The New Black AI Edit API to edit an image by removing and replacing elements.",
                      "properties": {
                        "email": {
                          "type": "string",
                          "description": "User email for authentication.",
                          "example": "your@email.com"
                        },
                        "password": {
                          "type": "string",
                          "description": "User password for authentication.",
                          "example": "yourpassword"
                        },
                        "image": {
                          "type": "string",
                          "description": "URL of the image to be edited.",
                          "example": "https://example.com/image.jpg"
                        },
                        "remove": {
                          "type": "string",
                          "description": "Element to be removed from the image.",
                          "example": "blue dress"
                        },
                        "replace": {
                          "type": "string",
                          "description": "Element to replace the removed element.",
                          "example": "green dress"
                        },
                        "negative": {
                          "type": "string",
                          "description": "Optional parameter to specify negative prompts for better results.",
                          "example": "poor details"
                        },
                        "responseKey": {
                          "type": "string",
                          "description": "Key for the response structure.",
                          "example": "editResult"
                        }
                      },
                      "required": ["email", "password", "image", "remove", "replace"]
                    },    
                    "ConsistentCharacterWithPoseParameters": {
                        "type": "object",
                        "description": "Parameters for Consistent Character With Pose API integration.",
                        "properties": {
                          "api_key": {
                            "type": "string",
                            "description": "API key for authentication.",
                            "example": "your-api-key"
                          },
                          "base_64": {
                            "type": "boolean",
                            "description": "Whether to return the output in Base64 format.",
                            "default": false
                          },
                          "custom_height": {
                            "type": "integer",
                            "description": "Custom height of the output image.",
                            "default": 1024,
                            "example": 1024
                          },
                          "custom_width": {
                            "type": "integer",
                            "description": "Custom width of the output image.",
                            "default": 1024,
                            "example": 1024
                          },
                          "face_image": {
                            "type": "string",
                            "description": "URL of the face image.",
                            "example": "https://example.com/face_image.png"
                          },
                          "output_format": {
                            "type": "string",
                            "description": "Output format of the image (e.g., 'png').",
                            "default": "png",
                            "example": "png"
                          },
                          "pose_image": {
                            "type": "string",
                            "description": "URL of the pose image.",
                            "example": "https://example.com/pose_image.png"
                          },
                          "prompt": {
                            "type": "string",
                            "description": "Prompt describing the desired output.",
                            "example": "A candid photo of a woman wearing a blue denim shirt and matching jeans."
                          },
                          "quality": {
                            "type": "integer",
                            "description": "Quality of the output image.",
                            "default": 95,
                            "example": 95
                          },
                          "samples": {
                            "type": "integer",
                            "description": "Number of image samples to generate.",
                            "default": 1,
                            "example": 1
                          },
                          "seed": {
                            "type": "integer",
                            "description": "Seed for random number generation.",
                            "example": 2778725438
                          },
                          "use_input_img_dimension": {
                            "type": "boolean",
                            "description": "Whether to use the input image dimensions for the output.",
                            "default": true
                          },
                          "responseKey": {
                            "type": "string",
                            "description": "Key for the response structure.",
                            "example": "consistentCharacterResponse"
                          }
                        },
                        "required": ["face_image", "pose_image", "prompt"]
                      },        
            DefaultModelParameters: {
              type: 'object',
              description: 'Parâmetros genéricos para outras engines',
              properties: {}
            },        
      },
    },    
    servers: [
      {
        url: 'https://promptexec-api.glitch.me', // URL base da API
        description: 'Servidor',
      },
    ],
  },
  apis: ['./src/routes/*.js','./src/controllers/*.js'], // Arquivo(s) onde estão os comentários @swagger
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const app = express();
// Configuração global do CORS
app.use(cors());
app.use(express.json());
app.use(router);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

const PORT = process.env.PORT || 3000;


cron.schedule('0 0 1 * *', async () => {
    try {
        console.log('Iniciando limpeza das tabelas...');
        await tableCleanerService.cleanTables();
    } catch (error) {
        console.error('Erro durante o agendamento:', error);
    } finally {
        await dbRepository.closeConnection();
    }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});