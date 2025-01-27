const ftp = require('basic-ftp');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || "ftpUploadResult";

    try {
      const {
        ftpHost,
        ftpPort,
        ftpUser,
        ftpPassword,
        baseDomain,
        rootDir,
        targetFolder,
        fileExtension,
        originalFileUrl,
        base64Content,
        plainTextContent, // Novo parâmetro para conteúdo em texto plano
      } = modelParameters;

      // Validate mandatory parameters
      if (!ftpHost || !ftpUser || !ftpPassword || !baseDomain || !targetFolder || !fileExtension || !rootDir) {
        throw new Error("Missing required parameters: ftpHost, ftpUser, ftpPassword, baseDomain, rootDir, targetFolder, and fileExtension are mandatory.");
      }

      if (!originalFileUrl && !base64Content && !plainTextContent) {
        throw new Error("Either 'originalFileUrl', 'base64Content', or 'plainTextContent' must be provided.");
      }

      // Generate a unique file name
      const fileName = `${uuidv4()}.${fileExtension}`;

      // Connect to FTP server
      const client = new ftp.Client();
      client.ftp.verbose = true;
      await client.access({
        host: ftpHost,
        port: ftpPort || 21,
        user: ftpUser,
        password: ftpPassword,
        secure: false, // Set to true if your FTP server uses TLS
      });

      // Navigate to the root directory
      await client.ensureDir(rootDir);

      // Ensure the target folder exists within the root directory
      const fullTargetPath = `${rootDir}/${targetFolder}`;
      await client.ensureDir(fullTargetPath);

      if (originalFileUrl) {
        // If originalFileUrl is provided, download the file as a stream
        const response = await axios({
          method: 'get',
          url: originalFileUrl,
          responseType: 'stream',
        });

        // Upload the stream to the FTP server
        console.log("Uploading file from URL to FTP...");
        await client.uploadFrom(response.data, `${fullTargetPath}/${fileName}`);
      } else if (base64Content) {
        // If base64Content is provided, decode it and use a stream
        const buffer = Buffer.from(base64Content, 'base64');
        const readableStream = Readable.from(buffer);

        console.log("Uploading Base64 content to FTP...");
        await client.uploadFrom(readableStream, `${fullTargetPath}/${fileName}`);
      } else if (plainTextContent) {
          // Adicionar quebras de linha para o texto em formato legível
          const formattedContent = plainTextContent.replace(/\\n/g, '\n'); // Substituir "\n" pela quebra de linha real
          console.log(formattedContent);
          const buffer = Buffer.from(formattedContent, 'utf8'); // Converte o texto formatado para Buffer
          const readableStream = Readable.from(buffer); // Cria um stream a partir do Buffer

          console.log("Uploading plain text content to FTP...");
          await client.uploadFrom(readableStream, `${fullTargetPath}/${fileName}`);//
      }

      // Close the FTP connection
      client.close();

      // Construct the access URL
      const accessUrl = `${baseDomain}/${targetFolder}/${fileName}`;

      return {
        [responseKey]: {
          success: true,
          accessUrl,
        },
      };
    } catch (error) {
      console.error("Error in FTP integration:", error.message);

      return {
        [responseKey]: {
          success: false,
          error: error.message,
        },
      };
    }
  },
};