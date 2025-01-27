const axios = require("axios");
const { JSDOM } = require("jsdom"); // Biblioteca para parsing avançado de HTML
const moment = require("moment");

module.exports = {
  /**
   * Process the Function Execution Integration based on predefined functions.
   * @param {string} prompt - Unused but maintained for consistency with other integrations.
   * @param {string} model - Unused but maintained for consistency with other integrations.
   * @param {Object} modelParameters - Parameters required for function execution.
   * @returns {Promise<Object>} - Response with the result of the executed function.
   */
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || "functionExecutionResult";

    try {
      // Validate required parameters
      const { functionName, args } = modelParameters;
      if (!functionName) {
        throw new Error("The 'functionName' parameter is required.");
      }

      console.log(`Executing function: ${functionName} with args:`, args);

      //const fargs = eval(args);
      // Execute the function
      const result = await this.executeFunctionPlaceholder(functionName, args);

      if (result === null) {
        throw new Error(`Function "${functionName}" execution failed or returned null.`);
      }

      return {
        [responseKey]: {
          success: true,
          data: result,
        },
      };
    } catch (error) {
      console.error("Error in Function Execution Integration:", error.message);

      return {
        [responseKey]: {
          success: false,
          error: error.message,
        },
      };
    }
  },

  /**
   * Execute a predefined function based on the function map.
   * @param {string} functionName - Name of the function to execute.
   * @param {Array} args - Arguments to pass to the function.
   * @returns {Promise<any>} - Result of the function execution.
   */
  async executeFunctionPlaceholder(functionName, args) {
    const functionMap = {
      now: this.now,
      html_data: this.html_data,
      adjustDate: this.adjustDate, // Nova função adicionada
      extractTextLinksAndImages: this.extractTextLinksAndImages, // New function added
    };

    if (functionMap[functionName]) {
      return await functionMap[functionName](...args);
    } else {
      console.error(`Function "${functionName}" is not supported.`);
      return null;
    }
  },

  /**
   * Return the current date and time in the specified format.
   * @param {string} format - Format of the date/time.
   * @returns {string} - Formatted date/time string.
   */
  now(format) {
    return moment().format(format || "YYYY-MM-DD HH:mm:ss");
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
