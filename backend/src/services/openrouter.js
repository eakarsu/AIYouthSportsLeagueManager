const axios = require('axios');

async function callOpenRouter(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  const model = process.env.OPENROUTER_MODEL?.trim();
  const baseUrl = process.env.OPENROUTER_BASE_URL?.trim().replace(/\/$/, '');

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    throw new Error('OPENROUTER_API_KEY is not configured. Please set it in your .env file.');
  }
  if (!model) throw new Error('OPENROUTER_MODEL is required.');
  if (baseUrl !== 'https://openrouter.ai/api/v1') {
    throw new Error('OPENROUTER_BASE_URL must be https://openrouter.ai/api/v1.');
  }

  const response = await axios.post(
    `${baseUrl}/chat/completions`,
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Youth Sports League Manager',
      },
    }
  );

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No response content received from OpenRouter');
  }

  // Try to parse as JSON, fall back to raw text
  let parsed;
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[1].trim() : content);
  } catch {
    parsed = { analysis: content };
  }

  return {
    result: parsed,
    model_used: model,
    raw: content,
  };
}

module.exports = { callOpenRouter };
