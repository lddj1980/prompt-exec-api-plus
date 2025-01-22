const ftp = require('basic-ftp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const axios = require('axios');

class FtpRepoService {
  /**
   * Inicializa o serviço de FTP com configurações predefinidas.
   * @param {object} config - Configuração para o serviço de FTP.
   * @param {string} config.ftpHost - Hostname ou endereço IP do servidor FTP.
   * @param {number} config.ftpPort - Porta do servidor FTP (padrão: 21).
   * @param {string} config.ftpUser - Nome de usuário para autenticação FTP.
   * @param {string} config.ftpPassword - Senha para autenticação FTP.
   * @param {string} config.baseDomain - Domínio base para construção da URL de acesso HTTP.
   * @param {string} config.rootDir - Diretório raiz para uploads no servidor FTP.
   */
  constructor(config = {}) {
    this.ftpHost = config.ftpHost || 'ftp.example.com';
    this.ftpPort = config.ftpPort || 21;
    this.ftpUser = config.ftpUser || 'ftp_user';
    this.ftpPassword = config.ftpPassword || 'ftp_password';
    this.baseDomain = config.baseDomain || 'https://mydomain.com';
    this.rootDir = config.rootDir || '/uploads';
  }

  /**
   * Faz upload de um arquivo para o FTP diretamente de uma stream de leitura.
   * @param {object} params - Parâmetros do upload.
   * @param {string} params.imageUrl - URL do arquivo a ser carregado (ou conteúdo em Base64).
   * @param {object} params.metadata - Metadados associados ao arquivo.
   * @param {string} params.fileExtension - Extensão do arquivo (e.g., '.jpg', '.png').
   * @param {boolean} params.base64 - Indica se o conteúdo é em Base64.
   * @returns {Promise<object>} - Resposta contendo a URL de acesso ao arquivo.
   */
  async createImage(imageUrl, metadata, fileExtension, apiKey, ftpConfigId, base64 = false) {
    if (!imageUrl || !fileExtension) {
      throw new Error('Os parâmetros "imageUrl" e "fileExtension" são obrigatórios.');
    }

    const client = new ftp.Client();
    client.ftp.verbose = true;

    const targetFolder = metadata?.targetFolder || 'default';
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const remoteDir = path.join(this.rootDir, targetFolder);
    const remotePath = path.join(remoteDir, uniqueFileName);
    const accessUrl = `${this.baseDomain}/${targetFolder}/${uniqueFileName}`;

    try {
      await client.access({
        host: this.ftpHost,
        port: this.ftpPort,
        user: this.ftpUser,
        password: this.ftpPassword,
      });

      // Garante que o diretório remoto existe
      await client.ensureDir(remoteDir);

      if (base64) {
        // Converte o conteúdo Base64 em buffer e faz upload como stream
        const buffer = Buffer.from(imageUrl, 'base64');
        const readStream = this.createReadStreamFromBuffer(buffer);
        await client.uploadFrom(readStream, remotePath);
      } else {
        // Faz download do arquivo da URL e faz upload como stream
        const readStream = await this.createReadStreamFromUrl(imageUrl);
        await client.uploadFrom(readStream, remotePath);
      }

      client.close();
      return { success: true, accessUrl };
    } catch (err) {
      client.close();
      throw new Error(`Erro no upload para o FTP: ${err.message}`);
    }
  }

  /**
   * Cria uma stream de leitura a partir de uma URL.
   * @param {string} imageUrl - URL da imagem.
   * @returns {Promise<Readable>} - Stream de leitura da imagem.
   */
  async createReadStreamFromUrl(imageUrl) {
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'stream',
    });
    return response.data; // Retorna a stream de leitura.
  }

  /**
   * Cria uma stream de leitura a partir de um buffer.
   * @param {Buffer} buffer - Conteúdo do arquivo em buffer.
   * @returns {Readable} - Stream de leitura do buffer.
   */
  createReadStreamFromBuffer(buffer) {
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null); // Finaliza a stream
    return stream;
  }
  
   /**
   * Cria uma stream de escrita para o FTP.
   * @param {object} options - Opções para o upload.
   * @param {string} options.targetFolder - Pasta de destino no FTP.
   * @param {object} options.metadata - Metadados associados ao arquivo.
   * @param {string} fileExtension - Extensão do arquivo (e.g., '.mp4').
   * @returns {Promise<Writable>} - Stream de escrita para o FTP.
   */
  async createWriteStream(options, fileExtension) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    const targetFolder = options?.targetFolder || 'default';
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const remoteDir = path.join(this.rootDir, targetFolder);
    const remotePath = path.join(remoteDir, uniqueFileName);

    try {
      await client.access({
        host: this.ftpHost,
        port: this.ftpPort,
        user: this.ftpUser,
        password: this.ftpPassword,
      });

      // Garante que o diretório remoto existe
      await client.ensureDir(remoteDir);

      // Retorna um stream de escrita para o FTP
      return client.uploadFrom(remotePath);
    } catch (err) {
      client.close();
      throw new Error(`Erro ao criar stream de escrita para o FTP: ${err.message}`);
    }
  }

}

module.exports = FtpRepoService;