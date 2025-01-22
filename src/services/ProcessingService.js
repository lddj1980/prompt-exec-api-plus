const moment = require("moment"); // Biblioteca para manipulação de datas
const axios = require("axios"); // Biblioteca para fazer requisições HTTP
const { parse } = require("node-html-parser");

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
              substituicoes
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
            substituicoes
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

  replacePlaceholders(content, substituicoes) {
    if (!content) return null;

    return content.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      const placeholder = key.trim();

      // Verifica se é uma chamada de função (e.g., `now('DD-MM-YYYY HH:mm:ss')`)
      const functionMatch = placeholder.match(/^(\w+)\((.*)\)$/);
      if (functionMatch) {
        const functionName = functionMatch[1];
        const args = functionMatch[2]
          .split(",")
          .map((arg) => arg.trim().replace(/^['"]|['"]$/g, "")); // Remove aspas de strings

        // Executa a função correspondente
        return this.executeFunctionPlaceholder(functionName, args) || "";
      }

      const value = substituicoes[placeholder];
      if (
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
      ) {
        return JSON.stringify(value);
      }
      return value || "";
    });
  },

  replacePlaceholdersInJson(json, substituicoes) {
    if (Array.isArray(json)) {
      return json.map((item) =>
        this.replacePlaceholdersInJson(item, substituicoes)
      );
    } else if (typeof json === "object" && json !== null) {
      const updatedJson = {};
      for (const [key, value] of Object.entries(json)) {
        updatedJson[key] = this.replacePlaceholdersInJson(value, substituicoes);
      }
      return updatedJson;
    } else if (typeof json === "string") {
      return this.replacePlaceholders(json, substituicoes);
    } else {
      return json;
    }
  },

  executeFunctionPlaceholder(functionName, args) {
    const functionMap = {
      now: this.now,
      html_data: this.html_data, // Nova função adicionada
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
      console.error(`Erro ao acessar a URL ${url}:`, error);
      return null;
    }
  },
};
