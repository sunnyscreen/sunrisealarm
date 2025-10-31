module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicApiKey) {
      return res.status(500).json({ error: 'Anthropic API key not configured' });
    }

    // Call Anthropic API to generate weather recommendations
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        system: 'You are a helpful assistant that provides clothing recommendations based on weather conditions.',
        messages: [
          {
            role: 'user',
            content: 'Generate a JSON array of exactly 100 weather conditions with clothing recommendations. Each item should have: "condition" (a brief weather description including temperature, precipitation, and wind), and "recommendation" (one sentence recommending ideal clothing). Format: [{"condition": "...", "recommendation": "..."}]. Make them diverse and realistic.'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({
        error: 'Failed to generate weather recommendations',
        details: errorData
      });
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse the JSON from the response
    let weatherRecommendations;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      weatherRecommendations = JSON.parse(jsonMatch[1]);
    } catch (parseError) {
      console.error('Failed to parse Anthropic response:', parseError);
      return res.status(500).json({ error: 'Failed to parse weather recommendations' });
    }

    // Validate that we have an array
    if (!Array.isArray(weatherRecommendations)) {
      return res.status(500).json({ error: 'Invalid response format from Anthropic' });
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
