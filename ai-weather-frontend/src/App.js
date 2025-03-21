import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setResponseMessage("Thinking... 🤖");

    try {
      const { data: nlp } = await axios.post("http://localhost:3001/analyze", { text });
      const city = nlp.city;
      const sentiment = nlp.sentiment;

      if (!city || city === "unknown") {
        let fallback;
        if (sentiment === "NEGATIVE") {
          fallback = "I sense you’re feeling a bit down 😕. Tell me which city’s weather you’d like to know (for example: “What’s the weather in Toronto?”).";
        } else if (sentiment === "POSITIVE") {
          fallback = "Love the enthusiasm! 🎉 Which city’s weather should I look up for you?";
        } else {
          fallback = "I’m here to help — just ask me about the weather in any city (e.g., “Is it raining in London?”).";
        }
        setResponseMessage(fallback);
        setLoading(false);
        return;
      }

      const { data: weather } = await axios.get(`http://localhost:3001/weather?city=${city}`);
      const condition = weather.weather[0].main.toLowerCase();
      const temp = weather.main.temp;

      let aiResponse = "";

      if (nlp.intent?.toLowerCase().includes("cold")) {
        aiResponse = temp < 15
          ? `Yes — it’s quite cold in ${city} (${temp}°C). Bundle up if you head outside!`
          : `No — it’s not really cold in ${city} (${temp}°C). You’ll be comfortable.`;
      } else if (nlp.intent?.toLowerCase().includes("hot")) {
        aiResponse = temp > 25
          ? `Yes — it’s hot in ${city} (${temp}°C). Stay hydrated and wear light clothes!`
          : `No — it’s not especially hot in ${city} (${temp}°C). It’s quite pleasant.`;
      } else {
        switch (condition) {
          case "rain":
          case "drizzle":
            aiResponse = `It’s raining in ${city} (${temp}°C) 🌧️ — grab an umbrella and waterproof shoes.`;
            break;
          case "snow":
            aiResponse = `Snow is falling in ${city} (${temp}°C) ❄️ — bundle up in a warm coat and boots!`;
            break;
          case "thunderstorm":
            aiResponse = `There’s a thunderstorm in ${city} (${temp}°C) ⚡ — stay indoors and stay safe.`;
            break;
          case "clouds":
            aiResponse = `It’s cloudy in ${city} (${temp}°C) ☁️ — a light jacket should be fine.`;
            break;
          case "clear":
            aiResponse = `It’s clear and sunny in ${city} (${temp}°C) ☀️ — perfect for outdoor plans!`;
            break;
          default:
            aiResponse = `The weather in ${city} is ${weather.weather[0].description} (${temp}°C).`;
        }
      }

      setResponseMessage(aiResponse);
    } catch (error) {
      console.error(error);
      setResponseMessage("Oops! Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
        background: "linear-gradient(to bottom, #ece9e6, #ffffff)"
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          padding: "30px 40px",
          maxWidth: 600,
          width: "90%",
          textAlign: "center"
        }}
      >
        <h1 style={{ marginBottom: 20 }}>AI Weather Assistant 🤖</h1>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask me about the weather! (e.g., 'Is it cold in London?')"
            style={{
              flex: 1,
              padding: 10,
              fontSize: 16,
              border: "1px solid #ccc",
              borderRadius: 4
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: "10px 20px",
              fontSize: 16,
              borderRadius: 4,
              border: "none",
              backgroundColor: "#007bff",
              color: "#fff",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Processing..." : "Ask"}
          </button>
        </div>

        {responseMessage && (
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: 15,
              textAlign: "left",
              borderRadius: 6,
              marginTop: 20,
              border: "1px solid #eee"
            }}
          >
            <h3 style={{ marginTop: 0 }}>AI Assistant:</h3>
            <p style={{ fontSize: 16, margin: 0 }}>{responseMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
