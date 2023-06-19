const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const port = 3001;

const app = express();

app.use(express.json());
app.use(cors());

app.post("/search", async (req, res) => {
  try {
    // Access the data sent in the request body
    const { query } = req.body;

    const searchQuery = `${query} marketscreener`;
    const apiKey = "AIzaSyARwDLgkZBMtI-mFiVjzuZiRsnacuqpEsE";
    const searchEngineId = "d4523b55004334059";

    // Perform asynchronous operations
    const result = await getFirstLinkFromGoogleSearch(
      searchQuery,
      apiKey,
      searchEngineId
    );

    // Send a response back to the client
    console.log("First Link:", result.firstLink);
    console.log("First Link Data:", result.firstLinkData);
    console.log("Second Link Data:", result.secondLinkData);
    res.status(200).json({ message: "Success", result });
  } catch (error) {
    // Handle any errors that occurred during processing
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

async function getFirstLinkFromGoogleSearch(query, apiKey, searchEngineId) {
  try {
    // Fetch search results from Google Custom Search API
    const response = await axios.get(
      "https://www.googleapis.com/customsearch/v1",
      {
        params: {
          q: query,
          cx: searchEngineId,
          key: apiKey,
        },
      }
    );

    const searchResults = response.data.items;
    const firstLink = searchResults.find((result) =>
      result.link.includes("marketscreener.com")
    ).link;

    // Scrape data from the first link
    const firstLinkResponse = await axios.get(firstLink);
    const $ = cheerio.load(firstLinkResponse.data);
    const firstLinkData = [];

    // Extract data from HTML elements
    $(".Bord tr").each((index, element) => {
      const trText = $(element)
        .text()
        .replace(/[-\s]+/g, " ")
        .trim();
      firstLinkData.push(trText);
    });

    // Scrape data from the financials page of the first link
    const secondLinkData = [];
    const financialsResponse = await axios.get(`${firstLink}financials/`);
    const $2 = cheerio.load(financialsResponse.data);
    const table = $2(".BordCollapseYear2").closest("table");
    const rows = table.find("tr");

    rows.each((index, row) => {
      // Skip specific rows
      if (
        index === 14 ||
        index === 15 ||
        index === 30 ||
        index === 31 ||
        index === 43 ||
        index === 44 ||
        index >= rows.length - 2
      ) {
        return; // Skip the current iteration
      }

      const rowData = $(row)
        .find("td")
        .map((i, cell) => $(cell).text().replace(/\n/g, ""))
        .get();
      secondLinkData.push(rowData);
    });

    return { firstLink, firstLinkData, secondLinkData };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

