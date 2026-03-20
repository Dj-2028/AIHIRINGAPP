import fs from 'fs';

async function checkModels() {
  try {
    const env = fs.readFileSync('.env', 'utf-8');
    const match = env.match(/GEMINI_API_KEY=(.+)/);
    if (!match) {
      console.log('No GEMINI_API_KEY found');
      return;
    }
    const key = match[1].trim();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
      console.log('AVAILABLE MODELS:');
      console.log(data.models.map(m => m.name).join('\n'));
    } else {
      console.log('ERROR:', data);
    }
  } catch (err) {
    console.log('FETCH ERROR:', err);
  }
}
checkModels();
