const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());


app.post('/stock', async (req, res) => {
      const { stockCode } = req.body;
  
      // Log the data being sent to the backend
      console.log('Data received:', stockCode);
  
      // Make the request to the external URL with the provided stock code
      const response = await axios.get(`https://www.marketscreener.com/charting/afDataFeed.php?codeZB=${stockCode}&t=rev&sub_t=bna&iLang=2`);
  
      // Load the response HTML using Cheerio
      const $ = cheerio.load(response.data);
  
      // Extract the text content from the HTML
      const textContent = $('body').text();
  
      // Log the extracted text content
      console.log('Text content:', textContent);
  
      // Handle the text content here
      res.send(textContent);
      // Handle any errors that occur during the request
      res.status(500).json({ error: 'An error occurred' });
  });
  
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
