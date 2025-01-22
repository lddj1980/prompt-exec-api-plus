const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios");
const FtpRepoService = require('../services/FtpRepoService');
const { PassThrough } = require("stream");

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    
    modelParameters = modelParameters || {};
    
    const { imagens, narracao, musica, tempo_por_imagem = 10, apiKey, responseKey } = modelParameters;

    try {
      console.log("Iniciando integração com o gerador de vídeo...");

      if (!imagens || !Array.isArray(imagens) || imagens.length === 0) {
        throw new Error("O parâmetro 'imagens' deve ser uma lista de URLs.");
      }

      if (!apiKey) {
        throw new Error("O parâmetro 'apiKey' é obrigatório para salvar no ImageRepo.");
      }

      if (!responseKey) {
        throw new Error("O parâmetro 'responseKey' é obrigatório.");
      }

      // Configurando o pipeline de vídeo no ffmpeg
      const ffmpegCommand = ffmpeg();

      // Adiciona cada imagem como entrada separada
      imagens.forEach((url) => {
        ffmpegCommand.input(url).loop(tempo_por_imagem);
      });

      // Adiciona a narração, se disponível
      if (narracao) {
        const narracaoStream = await axios.get(narracao, { responseType: "stream" });
        ffmpegCommand.input(narracaoStream.data);
      }

      // Adiciona a música, se disponível
      if (musica) {
        const musicaStream = await axios.get(musica, { responseType: "stream" });
        ffmpegCommand.input(musicaStream.data);
      }

      console.log("Gerando vídeo com streaming...");

      // Cria um PassThrough para capturar o stream do ffmpeg
      const passThrough = new PassThrough();

      ffmpegCommand
        .outputOptions("-movflags frag_keyframe+empty_moov") // Saída progressiva
        .videoCodec("libx264")
        .audioCodec("aac")
        .format("mp4")
        .pipe(passThrough);

      let videoBase64 = "";

      // Processa o vídeo em chunks e converte para Base64 progressivamente
      await new Promise((resolve, reject) => {
        passThrough.on("data", (chunk) => {
          videoBase64 += chunk.toString("base64");
        });

        passThrough.on("end", async () => {
          try {
            console.log("Salvando vídeo no repositório...");

            const savedVideo = await ftpRepoService.createImage(
            videoBase64, // Conteúdo em Base64
            {targetFolder:'videorepo'}, // Metadados da imagem
            `.mp4`, // Extensão do arquivo
            null, 
            null, 
            true // Define que o conteúdo está em Base64
            );

            console.log("Vídeo salvo no repositório com sucesso:", savedVideo);
            resolve(savedVideo); // Resolve a promessa com o vídeo salvo
          } catch (err) {
            reject(err);
          }
        });

        passThrough.on("error", (err) => {
          console.error("Erro durante o processamento do vídeo:", err);
          reject(err);
        });
      });

      // Retornando com responseKey
      return {
        [responseKey]: {
          success: true,
          video: "savedVideo", // Atualizar com a resposta do repositório
        },
      };
    } catch (error) {
      console.error("Erro durante a integração com o gerador de vídeo:", error.message);

      // Em caso de erro, retorna uma resposta vazia com a responseKey
      return {
        [responseKey]: {
          success: false,
          video: null,
          error: error.message,
        },
      };
    }
  },
};
