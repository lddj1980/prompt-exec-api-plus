const axios = require("axios");
const FtpRepoService = require("../services/FtpRepoService"); // Adjust the path to the FtpRepoService class

module.exports = {
  async process(prompt, model, modelParameters = {}) {
    const responseKey = modelParameters.responseKey || "response";

    try {
      console.log("Starting integration with The New Black AI Edit API...");

      // Extract required parameters
      const { email, password, image, remove, replace, negative } = modelParameters;

      if (!email || !password || !image || !remove || !replace) {
        throw new Error(
          "The parameters 'email', 'password', 'image', 'remove', and 'replace' are required."
        );
      }

      // Construct the form data for the request
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("image", image);
      formData.append("remove", remove);
      formData.append("replace", replace);

      if (negative) {
        formData.append("negative", negative);
      }

      // Set up the request headers
      const headers = {
        ...formData.getHeaders(),
      };

      // API endpoint
      const endpoint = "https://thenewblack.ai/api/1.1/wf/edit";

      console.log("Sending request to The New Black AI Edit API...");
      const response = await axios.post(endpoint, formData, { headers });

      if (response.status === 200 && response.data) {
        console.log("Request completed successfully.");

        const base64Image = response.data.edited_image; // Assume the API response includes the image in Base64 format
        console.log("Size of Base64 image:", calculateBase64Size(base64Image));

        // FTP configuration
        const ftpConfig = {
          ftpHost: "ftp.travelzviagensturismo.com",
          ftpPort: 21,
          ftpUser: "pddidg3z",
          ftpPassword: "q9VB0fdr28",
          baseDomain: "https://travelzviagensturismo.com",
          rootDir: "/public_html/",
        };

        // Instantiate FtpRepoService
        const ftpRepoService = new FtpRepoService(ftpConfig);

        console.log("Uploading edited image to FTP...");
        const savedImage = await ftpRepoService.createImage(
          base64Image, // Content in Base64
          {
            description: "Image edited using The New Black AI Edit API",
            tags: ["image_edit", "AI", "TheNewBlack"],
            targetFolder: "edited_images", // Folder to save the image
          },
          ".jpg", // File extension
          null,
          null,
          true // Specify that the content is Base64
        );

        return {
          [responseKey]: {
            success: true,
            data: savedImage,
          },
        };
      } else {
        throw new Error(`Error processing with The New Black AI Edit API: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error in integration with The New Black AI Edit API:", error);

      return {
        [responseKey]: {
          success: false,
          error: error.message,
          details: error.response?.data || null,
        },
      };
    }

    // Helper function to calculate Base64 size
    function calculateBase64Size(base64String) {
      const base64 = base64String.split(",").pop(); // Remove header, if any
      const padding = (base64.match(/=/g) || []).length;
      return (base64.length * 3) / 4 - padding;
    }
  },
};