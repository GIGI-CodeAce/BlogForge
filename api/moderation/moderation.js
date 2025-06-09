import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const HF_API_KEY = process.env.MODERATION_API_KEY;

if (!HF_API_KEY) {
  console.error('❌ Hugging Face API key not set in environment variables');
}

const queryHuggingFaceModel = async (modelUrl, text) => {
  const response = await fetch(modelUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${HF_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    throw new Error(`Model endpoint returned non-JSON response: ${text}`)
  }

  const result = await response.json()

  if (result.error) {
    throw new Error(`Model failed: ${result.error}`)
  }

  return result;
};


// List of models and evaluation logic
const models = [
  {
    name: 'hate-speech',
    url: 'https://api-inference.huggingface.co/models/facebook/roberta-hate-speech-dynabench-r4-target',
    check: (result) => {
      if (!Array.isArray(result) || !Array.isArray(result[0])) {
        console.warn('⚠️ Unexpected format from hate-speech model:', result)
        return false;
      }
      const top = result[0].reduce((a, b) => (a.score > b.score ? a : b))
      return top.label?.toLowerCase() === 'hate' && top.score > 0.6;
    },
  },
  {
    name: 'toxicity',
    url: 'https://api-inference.huggingface.co/models/unitary/toxic-bert',
    check: (result) => {
      if (!Array.isArray(result)) {
        console.warn('⚠️ Unexpected format from toxicity model:', result);
        return false;
      }
      const toxic = result.find((r) => r.label?.toLowerCase() === 'toxic');
      return toxic && toxic.score > 0.7;
    },
  },
];

router.post('/moderate', async (req, res) => {
  const { title = '', summary = '', content = '' } = req.body;
  const text = `${title}\n${summary}\n${content}`;

  if (!HF_API_KEY) {
    return res.status(500).json({ error: 'Missing Hugging Face API key' });
  }

  try {
    const report = [];

    for (const model of models) {
      console.log(`🔍 Checking with ${model.name}...`);
      const result = await queryHuggingFaceModel(model.url, text);
      const flagged = model.check(result);
      report.push({ model: model.name, flagged, result });

      if (flagged) {
        return res.status(400).json({
          message: `❌ Post rejected by ${model.name} model`,
          report,
        });
      }
    }

    res.status(200).json({
      message: '✅ Post approved by all moderation models',
      report,
    });
  } catch (err) {
    console.error('❌ Moderation failed:', err.message);
    res.status(500).json({
      error: 'Moderation service unavailable',
      details: err.message,
    });
  }
});

export default router;
