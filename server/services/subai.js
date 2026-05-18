async function callSubAI(prompt, maxTokens = 100) {
  const apiKey = process.env.AI_SUB_API_KEY || process.env.AI_API_KEY;
  const baseUrl = process.env.AI_SUB_BASE_URL || process.env.AI_BASE_URL;
  const model =
    process.env.AI_SUB_MODEL ||
    process.env.AI_MEMORY_MODEL ||
    process.env.AI_MODEL;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  if (!data.choices || !data.choices[0]) return null;
  return data.choices[0].message.content.trim();
}

module.exports = { callSubAI };
