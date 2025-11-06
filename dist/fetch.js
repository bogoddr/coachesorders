"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function fetchSongData() {
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
    }
    catch (error) {
        console.error('Error fetching songdata.js:', error);
        console.error('Continuing with difficulty list fetch...\n');
    }
}
async function fetchAndSave() {
    // First, fetch songdata.js if it doesn't exist
    await fetchSongData();
    // Step 1: Read DIFFICULTY from environment variables
    const difficulty = process.env.DIFFICULTY;
    if (!difficulty) {
        console.error('Error: DIFFICULTY environment variable is not set');
        console.error('Usage: DIFFICULTY=<1-19> npm run fetch');
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
    }
    catch (error) {
        console.error('Error fetching or saving HTML:', error);
        process.exit(1);
    }
}
// Run the function
fetchAndSave();
//# sourceMappingURL=fetch.js.map