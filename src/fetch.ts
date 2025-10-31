import * as fs from 'fs';
import * as path from 'path';

async function fetchSongData(): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  const songDataPath = path.join(dataDir, 'songdata.js');

  // Check if songdata.js already exists
  if (fs.existsSync(songDataPath)) {
    console.log('songdata.js already exists, skipping download');
    return;
  }

  // Fetch songdata.js
  const songDataUrl = 'https://3icecream.com/js/songdata.js';
  console.log(`Fetching ${songDataUrl}...`);

  try {
    const response = await fetch(songDataUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const songData = await response.text();
    console.log(`Successfully fetched songdata.js (${songData.length} bytes)`);

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    }

    // Save songdata.js
    fs.writeFileSync(songDataPath, songData, 'utf-8');
    console.log(`Successfully saved to ${songDataPath}\n`);
  } catch (error) {
    console.error('Error fetching songdata.js:', error);
    console.error('Continuing with difficulty list fetch...\n');
  }
}

async function fetchAndSave(): Promise<void> {
  // First, fetch songdata.js if it doesn't exist
  await fetchSongData();
  // Step 1: Read DIFFICULTY from environment variables
  const difficulty = process.env.DIFFICULTY;

  if (!difficulty) {
    console.error('Error: DIFFICULTY environment variable is not set');
    console.error('Usage: DIFFICULTY=<1-19> npm run fetch');
    process.exit(1);
  }

  const difficultyNum = parseInt(difficulty, 10);

  if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 19) {
    console.error('Error: DIFFICULTY must be a number between 1 and 19');
    process.exit(1);
  }

  // Step 2: Fetch HTML from the URL
  const url = `https://3icecream.com/difficulty_list/${difficulty}`;
  console.log(`Fetching ${url}...`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Successfully fetched ${html.length} bytes`);

    // Step 3: Save the HTML to data/<DIFFICULTY>.html
    const dataDir = path.join(process.cwd(), 'data');

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created directory: ${dataDir}`);
    }

    const filePath = path.join(dataDir, `${difficulty}.html`);
    fs.writeFileSync(filePath, html, 'utf-8');

    console.log(`Successfully saved to ${filePath}`);
  } catch (error) {
    console.error('Error fetching or saving HTML:', error);
    process.exit(1);
  }
}

// Run the function
fetchAndSave();
