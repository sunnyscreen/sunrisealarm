module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Call OpenAI API to generate weather recommendations
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that provides clothing recommendations based on weather conditions.'
          },
          {
            role: 'user',
            content: 'Generate a JSON array of exactly 100 weather conditions with clothing recommendations. Each item should have: "condition" (a brief weather description including temperature, precipitation, and wind), and "recommendation" (one sentence recommending ideal clothing). Format: [{"condition": "...", "recommendation": "..."}]. Make them diverse and realistic.'
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to generate weather recommendations',
        details: errorData
      });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse the JSON from the response
    let weatherRecommendations;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      weatherRecommendations = JSON.parse(jsonMatch[1]);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return res.status(500).json({ error: 'Failed to parse weather recommendations' });
    }

    // Validate that we have an array
    if (!Array.isArray(weatherRecommendations)) {
      return res.status(500).json({ error: 'Invalid response format from OpenAI' });
    }

    return res.status(200).json({
      success: true,
      recommendations: weatherRecommendations
    });
  } catch (error) {
    console.error('Weather recommendations error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
