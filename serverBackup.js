const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

app.post("/search", async (req, res) => {
  try {
    const { query } = req.body;
    const result = await getFirstLinkFromGoogleSearch(query);
    res.status(200).json({ message: "Success", result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

async function getFirstLinkFromGoogleSearch(query) {
  const searchQuery = `${query} marketscreener`;
  const apiKey = "AIzaSyARwDLgkZBMtI-mFiVjzuZiRsnacuqpEsE";
  const searchEngineId = "d4523b55004334059";

  const response = await axios.get(
    "https://www.googleapis.com/customsearch/v1",  {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    },
    {
      params: {
        q: searchQuery,
        cx: searchEngineId,
        key: apiKey,
      },
    }
  );

  const searchResults = response.data.items;
  const firstLink = searchResults.find((result) =>
    result.link.includes("marketscreener.com")
  ).link;

  const firstLinkData = [];
  const firstLinkResponse = await axios.get(firstLink);
  const $ = cheerio.load(firstLinkResponse.data);
  const tableRows = $(".Bord tr");

  // Exclude the last 6 rows
  const rowsToSkip = tableRows.length - 6;

  tableRows.each((index, element) => {
    if (index >= rowsToSkip) {
      return;
    }

    const trText = $(element)
      .text()
      .replace(/[-\s]+/g, " ")
      .trim();
    firstLinkData.push(trText);
  });

  const secondLinkData = [];
  const financialsResponse = await axios.get(`${firstLink}financials/`);
  const $2 = cheerio.load(financialsResponse.data);
  const table = $2(".BordCollapseYear2").closest("table");
  const rows = table.find("tr");

  const totalRows = rows.length;
  const secondLinkRowsToSkip = totalRows - 32;

  rows.each((index, row) => {
    if (index >= secondLinkRowsToSkip || index === 13 || index === 14 || index === 15) {
      return;
    }

    const rowData = $(row)
      .find("td")
      .map((i, cell) => $(cell).text().replace(/\n/g, ""))
      .get();
    secondLinkData.push(rowData);
  });

  return { firstLink, firstLinkData, secondLinkData };
}


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
