const express = require('express');
const cors = require('cors');
const multer = require('multer');
const OpenAI = require('openai');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/cards', express.static(path.join(__dirname, 'cards')));

const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function generateGrendalName(trait, style) {
  const traitWords = {
    muscular: ["Flex", "Bulk", "Ripped", "Brawn"],
    slimy: ["Sludge", "Goop", "Gloop", "Grease"],
    sneaky: ["Skulk", "Creep", "Shade", "Whisp"]
  };
  const styleWords = {
    "90's rapper": ["Mic", "G", "Fresh", "Rhymes"],
    goth: ["Hex", "Fade", "Grave"],
    punk: ["Spit", "Crash", "Stitch"]
  };
  const t = traitWords[trait.toLowerCase()] || [trait];
  const s = styleWords[style.toLowerCase()] || [style];
  const first = t[Math.floor(Math.random() * t.length)];
  const last = s[Math.floor(Math.random() * s.length)];
  return `${first} ${last}`;
}

async function getAverageSkinTone(buffer) {
  const { data, info } = await sharp(buffer).resize(10, 10).raw().toBuffer({ resolveWithObject: true });
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  const total = data.length / 3;
  return {
    r: Math.round(r / total),
    g: Math.round(g / total),
    b: Math.round(b / total)
  };
}

function rgbToTone({ r, g, b }) {
  const brightness = (r + g + b) / 3;
  if (brightness < 80) return "dark skin tone";
  if (brightness < 150) return "medium skin tone";
  return "light skin tone";
}

async function composeGrendalCard(baseImgUrl, name, outputFile = "final-card.png") {
  const canvasWidth = 768;
  const canvasHeight = 1343;
  const imageX = 49;
  const imageY = 334;
  const imageWidth = 670;
  const imageHeight = 670;

  const response = await fetch(baseImgUrl);
  const originalBuffer = Buffer.from(await response.arrayBuffer());
  const resizedBuffer = await sharp(originalBuffer)
    .resize(imageWidth, imageHeight, { fit: "cover" })
    .toBuffer();

  const svgText = `
    <svg width="${canvasWidth}" height="${canvasHeight}">
      <style>
        .title {
          font-family: 'Impact', sans-serif;
          font-size: 48px;
          font-weight: bold;
          fill: #ff0000;
          stroke: #000000;
          stroke-width: 2px;
          paint-order: stroke;
        }
      </style>
      <text x="50%" y="1275" text-anchor="middle" class="title">${name}</text>
    </svg>
  `;

  const finalBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: resizedBuffer, top: imageY, left: imageX },
      { input: "Grendalstt.png", top: 0, left: 0 },
      { input: Buffer.from(svgText), top: 0, left: 0 }
    ])
    .png()
    .toBuffer();

  const outputPath = path.join(__dirname, "cards", outputFile);
  fs.writeFileSync(outputPath, finalBuffer);
  return `/cards/${outputFile}`;
}

const customFields = {
  "Grendals": (req) => {
    const trait = req.body.dominantTrait || "slimy";
    const style = req.body.visualStyle || "punk";
    req.cardName = generateGrendalName(trait, style);
    const skinToneText = req.extractedTone ? `The Grendal should have a ${req.extractedTone}, based on the photo.` : "";
    return `Create a vertical 9:16 trading card image of a grotesque gremlin-like character inspired by the uploaded photo.

- Portrait orientation, black background
- Green mottled border
- Centered bust-level pose
- High-contrast, movie-realistic detailed creature aesthetic

The Grendal should appear ${trait} and have a ${style} aesthetic. ${skinToneText} No text on the image. Leave space above and below for template overlay.`;
  },
  "Operation Bravo": (req) => {
    const weapon = req.body.weaponType || "tactical rifle";
    const style = req.body.combatStyle || "close quarters combat";
    return `The figure is armed with a ${weapon} and specializes in ${style}.`;
  },
  "Trash Can Kids": (req) => {
    const item = req.body.favoriteItem || "soggy sandwich";
    const activity = req.body.favoriteActivity || "dumpster diving";
    return `They love their ${item} and spend most days ${activity}.`;
  }
};

app.post('/generate', upload.single('photo'), async (req, res) => {
  const character = req.body.character || '80s hero';

  try {
    // Extract skin tone
    const tone = await getAverageSkinTone(req.file.buffer);
    req.extractedTone = rgbToTone(tone);
  } catch (err) {
    console.warn("⚠️ Could not extract tone:", err.message);
    req.extractedTone = null;
  }

  const basePrompt = `Create a stylized cartoon character portrait that resembles the uploaded photo.`;
  const themePrompt = {
    "Operation Bravo": "The figure is a classic 1980s military hero with 'Kung Fu Grip', dressed in a retro green combat uniform.",
    "Grendals": "A creepy gremlin-like creature featured on a collectible trading card.",
    "Trash Can Kids": "A satirical, weird cartoon child with exaggerated traits."
  }[character] || "A retro-style collectible toy with bold card art.";

  const extras = (customFields[character]?.(req) || "");
  const prompt = `${basePrompt} ${themePrompt} ${extras}`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = response.data[0]?.url;

    if (character === "Grendals") {
      const filename = `grendal-${Date.now()}.png`;
      const finalPath = await composeGrendalCard(imageUrl, req.cardName, filename);
      res.json({ imageUrl: finalPath });
    } else {
      res.json({ imageUrl });
    }
  } catch (err) {
    console.error("❌ OpenAI API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Image generation failed" });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
