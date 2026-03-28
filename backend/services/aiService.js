import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const callAI = async (prompt) => {
  const response = await openai.chat.completions.create({
    model: "google/gemma-3-4b-it:free",
    messages: [{ role: "user", content: prompt }],
  });

  return response.choices[0].message.content;
};
