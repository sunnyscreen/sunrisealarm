/**
 * Weather Client
 * Fetches and caches weather recommendations with clothing advice
 */

const CACHE_KEY = 'sunnyscreen-weather-recommendations';
const CACHE_EXPIRY_KEY = 'sunnyscreen-weather-cache-expiry';
const CACHE_DURATION_DAYS = 30; // Cache for 30 days

/**
 * Fetch weather recommendations from the API
 * @returns {Promise<Array>} Array of weather recommendations
 */
async function fetchWeatherRecommendations() {
  try {
    const response = await fetch('/api/weather/recommendations');
    const data = await response.json();

    if (!data.success || !data.recommendations) {
      throw new Error('Failed to fetch weather recommendations');
    }

    return data.recommendations;
  } catch (error) {
    console.error('Error fetching weather recommendations:', error);
    // Return a fallback set of recommendations
    return getFallbackRecommendations();
  }
}

/**
 * Get cached weather recommendations or fetch new ones
 * @returns {Promise<Array>} Array of weather recommendations
 */
async function getWeatherRecommendations() {
  const cached = localStorage.getItem(CACHE_KEY);
  const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

  // Check if cache is valid
  if (cached && expiry) {
    const expiryDate = new Date(parseInt(expiry));
    if (expiryDate > new Date()) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Failed to parse cached weather data:', e);
      }
    }
  }

  // Fetch new recommendations
  const recommendations = await fetchWeatherRecommendations();

  // Cache the recommendations
  const expiryTime = Date.now() + (CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000);
  localStorage.setItem(CACHE_KEY, JSON.stringify(recommendations));
  localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString());

  return recommendations;
}

/**
 * Get a random weather recommendation for today
 * Uses a deterministic random selection based on the current date
 * @returns {Promise<Object>} Weather recommendation with condition and clothing advice
 */
async function getTodayWeatherRecommendation() {
  const recommendations = await getWeatherRecommendations();

  // Use today's date as a seed for deterministic randomness
  const today = new Date();
  const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

  // Simple hash function to get consistent index for today
  const index = daysSinceEpoch % recommendations.length;

  return recommendations[index];
}

/**
 * Fallback recommendations in case API fails
 * @returns {Array} Array of fallback weather recommendations
 */
function getFallbackRecommendations() {
  return [
    { condition: "72°F, Sunny, Light breeze", recommendation: "Wear a light t-shirt and comfortable jeans with sneakers." },
    { condition: "55°F, Partly cloudy, Moderate wind", recommendation: "Layer up with a long-sleeve shirt and a light jacket." },
    { condition: "45°F, Overcast, Strong wind", recommendation: "Wear a warm sweater and windproof jacket with long pants." },
    { condition: "85°F, Hot and humid, No wind", recommendation: "Opt for breathable cotton clothing and stay hydrated." },
    { condition: "32°F, Snowing, Light wind", recommendation: "Bundle up in a heavy coat, scarf, gloves, and warm boots." },
    { condition: "68°F, Clear, Calm", recommendation: "Perfect weather for a light shirt and shorts or a casual dress." },
    { condition: "50°F, Light rain, Breezy", recommendation: "Wear a waterproof jacket with layers underneath." },
    { condition: "40°F, Foggy, Still air", recommendation: "Dress in a warm jacket and consider waterproof shoes." },
    { condition: "78°F, Mostly sunny, Light breeze", recommendation: "Wear light, airy fabrics like linen or cotton." },
    { condition: "25°F, Freezing, Heavy wind", recommendation: "Wear thermal layers, a heavy winter coat, and insulated boots." },
    { condition: "60°F, Cloudy, Moderate breeze", recommendation: "A comfortable hoodie or light sweater should work well." },
    { condition: "90°F, Scorching heat, No breeze", recommendation: "Wear minimal, loose-fitting clothing and a wide-brimmed hat." },
    { condition: "35°F, Sleet, Windy", recommendation: "Layer with a waterproof outer shell and warm inner layers." },
    { condition: "70°F, Warm, Gentle breeze", recommendation: "Perfect for a t-shirt with light pants or a summer dress." },
    { condition: "48°F, Drizzling, Light wind", recommendation: "Wear a rain jacket and consider waterproof footwear." },
    { condition: "65°F, Pleasant, Light wind", recommendation: "A light cardigan or jacket over a casual outfit works great." },
    { condition: "20°F, Very cold, Strong wind", recommendation: "Bundle up in your warmest winter gear including face protection." },
    { condition: "80°F, Humid, Calm", recommendation: "Choose moisture-wicking fabrics and loose-fitting clothes." },
    { condition: "58°F, Partly cloudy, Breezy", recommendation: "Wear a light jacket that you can easily remove if needed." },
    { condition: "42°F, Chilly, Windy", recommendation: "Dress in warm layers with a windbreaker on top." },
    { condition: "75°F, Sunny, Light breeze", recommendation: "Perfect weather for shorts and a t-shirt or light sundress." },
    { condition: "52°F, Overcast, Light rain", recommendation: "Wear a waterproof jacket over a long-sleeve shirt." },
    { condition: "28°F, Cold, Snowing lightly", recommendation: "Wear insulated clothing and waterproof boots." },
    { condition: "82°F, Hot, Humid", recommendation: "Opt for lightweight, breathable fabrics in light colors." },
    { condition: "62°F, Mild, Partly sunny", recommendation: "A light sweater or long-sleeve shirt should be comfortable." },
    { condition: "38°F, Cold, Windy", recommendation: "Wear a warm jacket with thermal underlayers." },
    { condition: "88°F, Very hot, Dry", recommendation: "Wear sun-protective clothing and stay in shade when possible." },
    { condition: "44°F, Cool, Drizzle", recommendation: "Layer with a waterproof outer layer and warm underneath." },
    { condition: "66°F, Comfortable, Clear", recommendation: "Great weather for jeans and a light shirt or blouse." },
    { condition: "30°F, Freezing, Icy", recommendation: "Wear heavy winter coat, insulated pants, and traction boots." },
    { condition: "76°F, Warm, Sunny", recommendation: "Dress in light, comfortable clothing perfect for outdoor activities." },
    { condition: "54°F, Cool, Breezy", recommendation: "Wear a medium-weight jacket or sweater." },
    { condition: "18°F, Extremely cold, Windy", recommendation: "Wear multiple layers including thermal underwear and face protection." },
    { condition: "84°F, Hot, Light breeze", recommendation: "Choose breathable fabrics and consider a sun hat." },
    { condition: "46°F, Chilly, Cloudy", recommendation: "Wear a warm jacket and long pants." },
    { condition: "71°F, Pleasant, Partly cloudy", recommendation: "Perfect for a comfortable t-shirt and casual pants." },
    { condition: "36°F, Cold, Light snow", recommendation: "Bundle up in warm layers with waterproof outerwear." },
    { condition: "92°F, Sweltering, Humid", recommendation: "Wear minimal, loose clothing and stay hydrated." },
    { condition: "56°F, Mild, Light wind", recommendation: "A light jacket or cardigan should be sufficient." },
    { condition: "26°F, Very cold, Blustery", recommendation: "Wear heavy winter clothing and insulated accessories." },
    { condition: "74°F, Warm, Clear", recommendation: "Great weather for shorts and a t-shirt or light dress." },
    { condition: "50°F, Cool, Overcast", recommendation: "Wear a sweater or hoodie with long pants." },
    { condition: "86°F, Hot, Mostly sunny", recommendation: "Opt for light-colored, breathable clothing." },
    { condition: "40°F, Chilly, Rainy", recommendation: "Wear waterproof layers and warm clothing underneath." },
    { condition: "64°F, Mild, Gentle breeze", recommendation: "A light long-sleeve shirt or thin sweater works well." },
    { condition: "22°F, Freezing, Heavy snow", recommendation: "Wear your warmest winter gear including snow boots." },
    { condition: "79°F, Warm, Humid", recommendation: "Choose moisture-wicking fabrics and light layers." },
    { condition: "49°F, Cool, Foggy", recommendation: "Wear a medium jacket and consider visibility gear." },
    { condition: "95°F, Extremely hot, Dry", recommendation: "Wear minimal, sun-protective clothing and seek shade often." },
    { condition: "43°F, Chilly, Windy", recommendation: "Layer up with a windproof jacket and warm clothes." }
  ];
}
