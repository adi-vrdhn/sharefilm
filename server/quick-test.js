require("dotenv").config();
const axios = require("axios");

async function test() {
  const apiKey = process.env.TMDB_API_KEY;
  console.log("Testing TMDB...");
  console.log("API Key set:", !!apiKey);
  
  if (!apiKey) {
    console.error("❌ No TMDB_API_KEY");
    process.exit(1);
  }
  
  try {
    const res = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: apiKey, query: "La La Land" }
    });
    console.log("✓ TMDB works!");
    console.log("Found", res.data.results.length, "movies");
  } catch (err) {
    console.error("❌ TMDB error:", err.message);
  }
}

test();
