const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const FtpRepoService = require('../services/FtpRepoService'); // Ajuste o caminho conforme necessário

// Configuração fixa do FTP
const ftpConfig = {
  ftpHost: 'ftp.travelzviagensturismo.com',
  ftpPort: 21,
  ftpUser: 'pddidg3z',
  ftpPassword: 'q9VB0fdr28',
  baseDomain: 'https://travelzviagensturismo.com',
  rootDir: '/public_html/',
};

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const {
      user,
      password,
      host,
      port,
      tls,
      responseKey,
      searchCriteria = { seen: false },
      fetchOptions = { envelope: true, source: true },
      download_attachments = false,
    } = modelParameters;

    try {
      console.log("Iniciando integração com o servidor IMAP...");

      if (!user || !password || !host || !port || !responseKey) {
        throw new Error('Os parâmetros "user", "password", "host", "port" e "responseKey" são obrigatórios.');
      }

      const client = new ImapFlow({
        host,
        port,
        secure: tls !== undefined ? tls : true,
        auth: {
          user,
          pass: password,
        },
      });

      var messages = [];

      await client.connect();
      console.log("Conexão com o servidor IMAP estabelecida.");

      let lock = await client.getMailboxLock("INBOX");
      try {
        console.log("Caixa de entrada aberta.");

        const emailIds = await client.search(searchCriteria);
        console.log(`Mensagens encontradas: ${emailIds.length}`);
        console.log(searchCriteria);
        if (emailIds.length === 0) {
          console.log("Nenhuma mensagem encontrada com os critérios fornecidos.");
          return {
            [responseKey]: {
              success: true,
              messages: [],
            },
          };
        }

        console.log("Iniciando busca por conteúdo das mensagens..." + fetchOptions);
        for await (let message of client.fetch(emailIds, { source: true })) {
          try {
            const mail = await simpleParser(message.source);
            const messageData = {
              id: message.uid,
              from: mail.from?.text || "Sem remetente",
              subject: mail.subject || "Sem assunto",
              text: mail.text || "",
              date: mail.date || "Sem data",
              attachments: [],
            };

            if (download_attachments && mail.attachments) {
              const ftpRepoService = new FtpRepoService(ftpConfig);
              for (let attachment of mail.attachments) {
                const filePath = await ftpRepoService.createImage(
                  attachment.content.toString('base64'),
                  { targetFolder: 'email_attachments' },
                  attachment.filename,
                  null,
                  null,
                  true
                );

                messageData.attachments.push({
                  attachment: filePath
                });
              }
            }

            messages.push(messageData);
            
            //await client.messageFlagsAdd(message.uid, ['\\Seen']);
          } catch (parseError) {
            console.error("Erro ao analisar a mensagem:", parseError);
          }
        }
        console.log("Busca de emails concluída.");
      } finally {
        lock.release();
      }

      await client.logout();
      console.log("Conexão com o servidor encerrada.");

      return {
        [responseKey]: {
          success: true,
          messages,
        },
      };
    } catch (error) {
      console.error("Erro ao integrar com o servidor IMAP:", error);
      return {
        [responseKey]: {
          success: false,
          messages: [],
          error: error.message,
        },
      };
    }
  },
};