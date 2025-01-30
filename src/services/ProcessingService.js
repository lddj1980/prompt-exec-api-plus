const moment = require("moment"); // Biblioteca para manipulação de datas
const axios = require("axios"); // Biblioteca para fazer requisições HTTP
const { parse } = require("node-html-parser");
const { JSDOM } = require("jsdom"); // Biblioteca para parsing avançado de HTML

const SolicitacaoRepository = require("../data/SolicitacaoRepository");
const PromptRepository = require("../data/PromptRepository");
const ParametroRepository = require("../data/ParametroRepository");
const PromptResultadoRepository = require("../data/PromptResultadoRepository");
const PromptProcessorService = require("./PromptProcessorService");

module.exports = {
  async resume(protocoloUid) {
    return new Promise(async (resolve, reject) => {
      try {
        // Obter a solicitação pelo protocolo UID
        const solicitacao =
          await SolicitacaoRepository.getSolicitacaoByProtocolo(protocoloUid);
        if (!solicitacao) {
          throw new Error("Solicitação não encontrada.");
        }

        //console.log(
        //  `Retomando processamento da solicitação com protocolo ${protocoloUid}`
        //);

        // Obter todos os prompts associados à solicitação, incluindo os já processados
        const promptsComResultado =
          await PromptRepository.getPromptsBySolicitacaoSuccess(solicitacao.id);
        const promptsPendentes =
          await PromptRepository.getPromptsBySolicitacaoNoResultOrFailure(
            solicitacao.id
          );

        // Reconstruir o resultadoGlobal a partir dos prompts já processados
        const resultadoGlobal = {};
        for (const prompt of promptsComResultado) {
          if (prompt.resultado) {
            //console.log(prompt.resultado);
            const resultado = prompt.resultado;
            this.processNestedResult(resultadoGlobal, resultado);
          }
        }

        //console.log(resultadoGlobal);
        //console.log('contexto global');
        //console.log(promptsPendentes);
        //console.log("prompts pendentes");
        // Processar os prompts pendentes
        const resultadoBd = {};
        for (const prompt of promptsPendentes) {
          try {
            const parametros = await ParametroRepository.getParametrosByPrompt(
              prompt.id
            );
            const substituicoes = this.prepareSubstituicoes(
              parametros,
              resultadoGlobal
            );

            const promptConteudo = this.replacePlaceholders(
              prompt.prompt,
              substituicoes,
              prompt.ignorePlaceholders
            );
            const parametrosModeloAtualizados = this.replacePlaceholdersInJson(
              prompt.parametros_modelo,
              substituicoes
            );
            
            console.log("prompt conteudo:"+promptConteudo);
            console.log("prompt engine:"+prompt.engine);
            console.log("prompt modelo:"+prompt.modelo);
            console.log("parametros:"+JSON.stringify(parametrosModeloAtualizados));
            const resultado = await PromptProcessorService.processPrompt(
              promptConteudo,
              prompt.engine,
              prompt.modelo,
              parametrosModeloAtualizados
            );

            Object.assign(resultadoBd, resultado);
            this.processNestedResult(resultadoGlobal, resultado);

            await PromptResultadoRepository.insertPromptResultado(
              solicitacao.id,
              prompt.id,
              JSON.stringify(resultado)
            );
          } catch (error) {
            console.error(`Erro ao processar o prompt ${prompt.id}:`, error);
            // Registra o erro no banco de dados, mas continua o processamento
            await PromptResultadoRepository.insertPromptResultado(
              solicitacao.id,
              prompt.id,
              JSON.stringify({ error: error.message })
            );
          }
        }

        // Atualizar o status da solicitação para concluído
        await SolicitacaoRepository.updateSolicitacaoStatus(
          protocoloUid,
          "concluido",
          JSON.stringify(resultadoBd)
        );
        //console.log(`Solicitação ${protocoloUid} concluída com sucesso.`);
        resolve();
      } catch (error) {
        console.error(`Erro ao retomar a solicitação ${protocoloUid}:`, error);
        await SolicitacaoRepository.updateSolicitacaoStatus(
          protocoloUid,
          "erro"
        );
        reject(error);
      }
    });
  },

  async process(protocoloUid) {
    try {
      const solicitacao = await SolicitacaoRepository.getSolicitacaoByProtocolo(
        protocoloUid
      );
      if (!solicitacao) throw new Error("Solicitação não encontrada.");

      await SolicitacaoRepository.updateSolicitacaoStatus(
        protocoloUid,
        "em_progresso"
      );

      const prompts = await PromptRepository.getPromptsBySolicitacao(
        solicitacao.id
      );
      const resultadoGlobal = {};
      const resultadoBd = {};
      let resultadoFinal = {};

      for (const prompt of prompts) {
        try {
          //console.log(resultadoGlobal);
          const parametros = await ParametroRepository.getParametrosByPrompt(
            prompt.id
          );
          const substituicoes = this.prepareSubstituicoes(
            parametros,
            resultadoGlobal
          );

          const promptConteudo = this.replacePlaceholders(
            prompt.prompt,
            substituicoes,
            prompt.ignorePlaceholders
          );
          const parametrosModeloAtualizados = this.replacePlaceholdersInJson(
            prompt.parametros_modelo,
            substituicoes
          );

          const resultado = await PromptProcessorService.processPrompt(
            promptConteudo,
            prompt.engine,
            prompt.modelo,
            parametrosModeloAtualizados
          );

          Object.assign(resultadoBd, resultado);
          this.processNestedResult(resultadoGlobal, resultado);

          await PromptResultadoRepository.insertPromptResultado(
            solicitacao.id,
            prompt.id,
            JSON.stringify(resultado)
          );
          resultadoFinal = JSON.stringify(resultado);
        } catch (error) {
          console.error(`Erro ao processar o prompt ${prompt.id}:`, error);
          // Registra o erro no banco de dados, mas continua o processamento
          await PromptResultadoRepository.insertPromptResultado(
            solicitacao.id,
            prompt.id,
            JSON.stringify({ error: error.message })
          );
        }
      }

      await SolicitacaoRepository.updateSolicitacaoStatus(
        protocoloUid,
        "concluido",
        resultadoFinal
      );
    } catch (error) {
      console.error("Erro no processamento:", error);
      await SolicitacaoRepository.updateSolicitacaoStatus(protocoloUid, "erro");
    }
  },

  processNestedResult(resultadoGlobal, resultado, prefix = "") {
    for (const [key, value] of Object.entries(resultado)) {
      const prefixedKey = prefix ? `${prefix}.${key}` : key;

      if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        resultadoGlobal[prefixedKey] = value;

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === "object" && item !== null) {
              this.processNestedResult(
                resultadoGlobal,
                item,
                `${prefixedKey}.${index}`
              );
            }
          });
        } else {
          this.processNestedResult(resultadoGlobal, value, prefixedKey);
        }
      } else {
        resultadoGlobal[prefixedKey] = value;
      }
    }
  },

  prepareSubstituicoes(parametros, resultadoGlobal) {
    const substituicoes = { ...resultadoGlobal };
    for (const parametro of parametros) {
      substituicoes[parametro.nome] = parametro.valor;
    }
    return substituicoes;
  },

  replacePlaceholders(content, substituicoes, ignorePlaceholders = []) {
  if (!content) return null;

  // Função recursiva para resolver placeholders aninhados
  const resolvePlaceholder = (placeholder) => {
    // Verifica se o placeholder deve ser ignorado
    if (ignorePlaceholders && ignorePlaceholders.includes(placeholder)) {
      return `{{${placeholder}}}`; // Mantém o placeholder intacto
    }

    // Verifica se é uma chamada de função (e.g., `now('DD-MM-YYYY HH:mm:ss')`)
    const functionMatch = placeholder.match(/^(\w+)\((.*)\)$/);
    if (functionMatch) {
      const functionName = functionMatch[1];
      const argsString = functionMatch[2];

      // Resolve os argumentos recursivamente
      const args = argsString
        .split(",")
        .map((arg) => {
          const trimmedArg = arg.trim();
          // Se o argumento for um placeholder ou outra função, resolve recursivamente
          if (trimmedArg.startsWith("{{") && trimmedArg.endsWith("}}")) {
            return resolvePlaceholder(trimmedArg.slice(2, -2).trim());
          }
          return trimmedArg.replace(/^['"]|['"]$/g, ""); // Remove aspas de strings
        });

      // Executa a função correspondente
      return this.executeFunctionPlaceholder(functionName, args) || "";
    }

    // Se não for uma função, busca no objeto de substituições
    const value = substituicoes[placeholder];
    if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
      return JSON.stringify(value);
    }
    return value || "";
  };

  // Substitui todos os placeholders no conteúdo
  return content.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const placeholder = key.trim();
    return resolvePlaceholder(placeholder);
  });
},

replacePlaceholdersInJson(json, substituicoes, ignorePlaceholders = []) {
  if (Array.isArray(json)) {
    return json.map((item) =>
      this.replacePlaceholdersInJson(item, substituicoes, ignorePlaceholders)
    );
  } else if (typeof json === "object" && json !== null) {
    const updatedJson = {};
    // Verifica se existe um atributo ignorePlaceholders no mesmo nível
    const currentIgnorePlaceholders = json.ignorePlaceholders
      ? json.ignorePlaceholders.split(";").map((item) => item.trim())
      : ignorePlaceholders;

    for (const [key, value] of Object.entries(json)) {
      if (key === "ignorePlaceholders") continue; // Ignora o próprio atributo ignorePlaceholders
      updatedJson[key] = this.replacePlaceholdersInJson(value, substituicoes, currentIgnorePlaceholders);
    }
    return updatedJson;
  } else if (typeof json === "string") {
    return this.replacePlaceholders(json, substituicoes, ignorePlaceholders);
  } else {
    return json;
  }
},

  executeFunctionPlaceholder(functionName, args) {
    const functionMap = {
      now: this.now,
      html_data: this.html_data,
      adjustDate: this.adjustDate, // Nova função adicionada
      extractTextLinksAndImages: this.extractTextLinksAndImages, // New function added
    };

    if (functionMap[functionName]) {
      return functionMap[functionName](...args);
    } else {
      console.error(`Função "${functionName}" não é suportada.`);
      return null;
    }
  },

  now(format) {
    return moment().format(format || "YYYY-MM-DD HH:mm:ss");
  },

  async html_data(url) {
    try {
      // Faz a requisição HTTP para obter o conteúdo da URL
      const response = await axios.get(url);
      const html = response.data;

      // Usa o node-html-parser para carregar o HTML e extrair o conteúdo
      const root = parse(html);
      return root.text; // Retorna o texto extraído do HTML
    } catch (error) {
      console.error(`Erro ao acessar a URL ${url}:`, error);//
      return null;
    }
  },
  
   /**
   * Fetch and extract plain text, links, and images from a given HTML URL.
   * @param {string} url - URL of the HTML page.
   * @param {string} imageSelector - CSS selector for images (default: "img").
   * @param {string} imageSrc - Attribute name for the image source (default: "src").
   * @returns {Promise<Object|null>} - Object containing textContent, links, and images, or null in case of error.
   */
  async extractTextLinksAndImages(url, imgSelector) {
    try {
      console.log('url:', url);
      const response = await axios.get(url);
      const html = response.data;

      // Use JSDOM to parse the HTML
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Extract plain text (excluding hidden elements like <script>, <style>, etc.)
      const textContent = Array.from(document.body.childNodes)
        .map((node) => node.textContent.trim())
        .filter((text) => text)
        .join(" ")
        .replace(/[\n\t]/g, " "); // Remove \n and \t, replacing with space

      // Extract links
      const links = Array.from(document.querySelectorAll("a"))
        .map((a) => ({
          text: a.textContent.trim().replace(/[\n\t]/g, " "), // Remove \n and \t from link text
          href: a.href,
        }))
        .filter((link) => link.href); // Only keep valid links

      // Extract images based on the optional selector and dynamic imageSrc
      const images = Array.from(document.querySelectorAll(imgSelector.selector)).map((img) => {
        const content = img.getAttribute(imgSelector.src || 'src');
        console.log(content);
        // Safely access the image source attribute dynamically
        const filter = imgSelector.includes;
        const ignore = imgSelector.excludes;
        if (filter && filter.type && filter.args && content){
           const argsIncludes = filter.args;
           const testIncludes = eval(`content.${filter.type}(${argsIncludes})`);
           if (testIncludes){
           
             if (ignore && ignore.type && ignore.args){
               const argsExcludes = ignore.args;
               const testIgnore = eval(`content.${ignore.type}(${argsExcludes})`);
               if (!testIgnore){
                 return content;
               }
             } else {
               return content;
             }
           }
        } else {
          return content;
        }
      }).filter((src) => src); // Filter out null or undefined values

      return {
        textContent,
        links,
        images,
      };
    } catch (error) {
      console.error(`Error accessing URL ${url}:`, error.message);
      return null;
    }
  },

  // Nova função para ajustar datas
  adjustDate(date, days, format = "YYYY-MM-DD") {
    // Verifica se a data é válida
    if (!date || !moment(date).isValid()) {
      console.error("Data inválida fornecida.");
      return null;
    }

    // Adiciona ou subtrai os dias
    const adjustedDate = moment(date).add(days, 'days');

    // Retorna a data no formato especificado
    return adjustedDate.format(format);
  },
};