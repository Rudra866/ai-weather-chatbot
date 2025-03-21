require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// NLP Model for Extracting Intent
app.post("/analyze", async (req, res) => {
  const { text } = req.body;

  try {
    const candidateLabels = ["weather", "temperature", "rain", "sunny", "forecast", "cold", "hot"];
    
    // Hugging Face - intent detection
    const intentResponse = await axios.post(
      "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
      {
        inputs: text,
        parameters: { candidate_labels: candidateLabels }
      },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const intentLabel = intentResponse.data.labels[0];

    // Extract city from user input (improve this regex later if needed)
    const cityMatch = text.match(/in (\w+)/i);
    const city = cityMatch ? cityMatch[1] : "unknown";

    // Hugging Face - sentiment analysis
    const sentimentResponse = await axios.post(
      "https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english",
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const sentimentLabel = sentimentResponse.data[0].label;

    res.json({ intent: intentLabel, city, sentiment: sentimentLabel });
  } catch (error) {
    console.error("Error analyzing text:", error.response?.data || error.message);
    res.status(503).json({ error: "NLP service unavailable" });
  }
});

// Weather API Route
app.get("/weather", async (req, res) => {
  const city = req.query.city || "Toronto";

  try {
    const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
