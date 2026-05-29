const { GoogleGenerativeAI } = require('@google/generative-ai');

const PROMPT = `You are a clothing cataloguer. Carefully examine all provided images and identify every distinct clothing item visible.

For each item return a JSON object with these exact fields:
- name: short descriptive name, e.g. "White Oxford Shirt", "Navy Slim Chinos", "Black Leather Sneakers"
- category: exactly one of: tops, bottoms, outerwear, shoes, accessories, dresses
- color: primary color as a simple word, e.g. "white", "navy", "black", "olive"
- tags: array of 2-4 relevant tags chosen from: casual, formal, business, sport, outdoor, party, summer, winter, spring, fall, light, heavy
- imageIndex: zero-based index of the image this item appears in (0 for first image, 1 for second, etc.)
- boundingBox: object with x, y, w, h — each a percentage (0-100) of image dimensions representing where the item is located. x/y = top-left corner. Be generous with the bounds to capture the full item.

Return ONLY a valid JSON array. No markdown fences, no explanation, no extra text.
If no clothing is visible return: []

Example output:
[{"name":"White Oxford Shirt","category":"tops","color":"white","tags":["formal","business"],"imageIndex":0,"boundingBox":{"x":15,"y":10,"w":35,"h":55}}]`;

async function scanClothingItems(imageBuffers, mimeTypes) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const imageParts = imageBuffers.map((buf, i) => ({
    inlineData: {
      data: buf.toString('base64'),
      mimeType: mimeTypes?.[i] || 'image/jpeg',
    },
  }));

  const result = await model.generateContent([PROMPT, ...imageParts]);
  const text = result.response.text().trim();

  // Extract JSON array robustly — handles any surrounding whitespace or accidental text
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];

  const items = JSON.parse(match[0]);

  // Validate + clamp each item
  return items
    .filter(item => item && typeof item.name === 'string' && item.name.trim())
    .map(item => ({
      name: String(item.name).trim(),
      category: ['tops', 'bottoms', 'outerwear', 'shoes', 'accessories', 'dresses'].includes(item.category)
        ? item.category
        : 'tops',
      color: String(item.color || '').trim(),
      tags: Array.isArray(item.tags) ? item.tags.slice(0, 6) : [],
      imageIndex: Math.max(0, parseInt(item.imageIndex) || 0),
      boundingBox: {
        x: clamp(item.boundingBox?.x ?? 5),
        y: clamp(item.boundingBox?.y ?? 5),
        w: clamp(item.boundingBox?.w ?? 90, 5, 100),
        h: clamp(item.boundingBox?.h ?? 90, 5, 100),
      },
    }));
}

function clamp(v, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(v) || 0));
}

module.exports = { scanClothingItems };
