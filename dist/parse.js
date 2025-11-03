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
// Map difficulty numbers to difficulty strings
const DIFFICULTY_MAP = {
    0: 'bSP', // Beginner Single Play
    1: 'BSP', // Basic Single Play
    2: 'DSP', // Difficult Single Play
    3: 'ESP', // Expert Single Play
    4: 'CSP', // Challenge Single Play
    5: 'BDP', // Basic Double Play
    6: 'DDP', // Difficult Double Play
    7: 'EDP', // Expert Double Play
    8: 'CDP', // Challenge Double Play
};
function loadSongData(dataDir) {
    const songDataPath = path.join(dataDir, 'songdata.js');
    if (!fs.existsSync(songDataPath)) {
        console.warn('Warning: songdata.js not found. Song titles will use song_id as fallback.');
        return new Map();
    }
    try {
        const songDataContent = fs.readFileSync(songDataPath, 'utf-8');
        // Extract the ALL_SONG_DATA array from the JavaScript file
        const match = songDataContent.match(/var ALL_SONG_DATA=(\[.*?\]);/s);
        if (!match) {
            console.warn('Warning: Could not parse songdata.js. Song titles will use song_id as fallback.');
            return new Map();
        }
        const songDataArray = JSON.parse(match[1]);
        // Create a map of song_id to song data for quick lookup
        const songDataMap = new Map();
        for (const entry of songDataArray) {
            songDataMap.set(entry.song_id, entry);
        }
        console.log(`Loaded ${songDataMap.size} songs from songdata.js\n`);
        return songDataMap;
    }
    catch (error) {
        console.warn('Warning: Error loading songdata.js:', error);
        return new Map();
    }
}
function extractDataFromHTML(htmlContent) {
    // Extract rawMetadata array
    const rawMetadataMatch = htmlContent.match(/let rawMetadata = (\[.*?\]);/s);
    if (!rawMetadataMatch) {
        throw new Error('Could not find rawMetadata in HTML');
    }
    const rawMetadata = JSON.parse(rawMetadataMatch[1]);
    // Extract difficultyList object
    const difficultyListMatch = htmlContent.match(/let difficultyList = (\{.*?\});/s);
    if (!difficultyListMatch) {
        throw new Error('Could not find difficultyList in HTML');
    }
    const difficultyList = JSON.parse(difficultyListMatch[1]);
    return { rawMetadata, difficultyList };
}
function parseHTMLFile(filePath, songDataMap) {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const { rawMetadata, difficultyList } = extractDataFromHTML(htmlContent);
    const charts = [];
    for (const entry of rawMetadata) {
        const { song_id, difficulty, youtube_id } = entry;
        // Create the key to look up in difficultyList
        const key = `${song_id}/${difficulty}`;
        const difficultyData = difficultyList[key];
        // Skip if no difficulty data found
        if (!difficultyData) {
            continue;
        }
        // Map difficulty number to string
        const difficultyStr = DIFFICULTY_MAP[difficulty];
        if (!difficultyStr) {
            console.warn(`Unknown difficulty value: ${difficulty} for song ${song_id}`);
            continue;
        }
        // Get song title from songDataMap, or use song_id as fallback
        // Format: "song_name (romanized_name alternate_name)" with appropriate combinations
        const songData = songDataMap.get(song_id);
        let title;
        if (songData) {
            const parts = [];
            if (songData.romanized_name) {
                parts.push(songData.romanized_name);
            }
            if (songData.alternate_name) {
                parts.push(songData.alternate_name);
            }
            if (parts.length > 0) {
                title = `${songData.song_name} (${parts.join('/')})`;
            }
            else {
                title = songData.song_name;
            }
        }
        else {
            title = song_id;
        }
        // Get rating from songdata.js ratings array at the difficulty index
        // If not available, fall back to difficultyList rating
        let rating = difficultyData.rating;
        if (songData?.ratings && songData.ratings[difficulty] !== undefined) {
            rating = songData.ratings[difficulty];
        }
        // Create Chart object
        const chart = {
            id: song_id,
            title: title,
            rating: rating,
            tier: difficultyData.tier,
            difficulty: difficultyStr,
            youtubeURL: youtube_id ? `https://www.youtube.com/watch?v=${youtube_id}` : '',
        };
        charts.push(chart);
    }
    return charts;
}
function main() {
    const dataDir = path.join(process.cwd(), 'data');
    // Step 1: Iterate over every file in data/ directory
    if (!fs.existsSync(dataDir)) {
        console.error(`Error: data directory not found at ${dataDir}`);
        process.exit(1);
    }
    // Load song data first
    const songDataMap = loadSongData(dataDir);
    const files = fs.readdirSync(dataDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    if (htmlFiles.length === 0) {
        console.error('Error: No HTML files found in data directory');
        process.exit(1);
    }
    console.log(`Found ${htmlFiles.length} HTML file(s) to parse\n`);
    // Step 3: Add those charts to a global ChartDB object
    const chartDB = {
        charts: [],
    };
    // Step 2: For each file, parse the data into an array of Chart objects
    for (const file of htmlFiles) {
        const filePath = path.join(dataDir, file);
        console.log(`Parsing ${file}...`);
        try {
            const charts = parseHTMLFile(filePath, songDataMap);
            chartDB.charts.push(...charts);
            console.log(`  Added ${charts.length} charts from ${file}`);
        }
        catch (error) {
            console.error(`  Error parsing ${file}:`, error);
        }
    }
    // Step 4: Neatly log the ChartDB object (for debugging purposes)
    console.log(`\n=== Chart Database Summary ===`);
    console.log(`Total charts: ${chartDB.charts.length}`);
    console.log(`\nSample charts (first 5):`);
    console.log(JSON.stringify(chartDB.charts.slice(0, 5), null, 2));
    // Group by difficulty
    const byDifficulty = {};
    for (const chart of chartDB.charts) {
        byDifficulty[chart.difficulty] = (byDifficulty[chart.difficulty] || 0) + 1;
    }
    console.log(`\nCharts by difficulty:`);
    for (const [difficulty, count] of Object.entries(byDifficulty).sort()) {
        console.log(`  ${difficulty}: ${count}`);
    }
    // Step 5: Append additional charts from additional.csv
    appendAdditionalCharts(chartDB, dataDir);
    // Step 6: Export to CSV
    const outputDir = path.join(process.cwd(), 'output');
    exportToCSV(chartDB, outputDir);
}
function appendAdditionalCharts(chartDB, dataDir) {
    const additionalCSVPath = path.join(dataDir, 'additional.csv');
    if (!fs.existsSync(additionalCSVPath)) {
        console.log('\nNo additional.csv found, skipping additional charts');
        return;
    }
    console.log('\n=== Loading Additional Charts ===');
    try {
        const csvContent = fs.readFileSync(additionalCSVPath, 'utf-8');
        const lines = csvContent.trim().split('\n');
        let addedCount = 0;
        for (const line of lines) {
            // Parse CSV line manually to handle quoted fields
            const fields = parseCSVLine(line);
            if (fields.length < 5) {
                console.warn(`Skipping invalid line: ${line}`);
                continue;
            }
            const [id, title, difficulty, rating, tier, youtubeURL = ''] = fields;
            // Validate difficulty
            const validDifficulties = ['bSP', 'BSP', 'DSP', 'ESP', 'CSP', 'BDP', 'DDP', 'EDP', 'CDP'];
            if (!validDifficulties.includes(difficulty)) {
                console.warn(`Skipping chart with invalid difficulty: ${difficulty}`);
                continue;
            }
            const chart = {
                id: id,
                title: title,
                difficulty: difficulty,
                rating: parseFloat(rating),
                tier: parseFloat(tier),
                youtubeURL: youtubeURL.trim(),
            };
            chartDB.charts.push(chart);
            addedCount++;
        }
        console.log(`Added ${addedCount} additional charts from additional.csv`);
    }
    catch (error) {
        console.error('Error loading additional.csv:', error);
    }
}
function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            // Check if it's an escaped quote
            if (inQuotes && line[i + 1] === '"') {
                currentField += '"';
                i++; // Skip next quote
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
        }
        else {
            currentField += char;
        }
    }
    // Push the last field
    fields.push(currentField);
    return fields;
}
function sanitizeCSVField(field) {
    const fieldStr = String(field);
    // If the field contains comma, newline, or double quote, wrap it in quotes
    // and escape any existing double quotes by doubling them
    if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
    }
    return fieldStr;
}
function exportToCSV(chartDB, outputDir) {
    console.log(`\n=== Exporting to CSV ===`);
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory: ${outputDir}`);
    }
    // Create CSV header
    const headers = ['ID', 'Title', 'Difficulty', 'Rating', 'Tier', 'YouTube URL'];
    const csvLines = [headers.join(',')];
    // Add each chart as a CSV row
    for (const chart of chartDB.charts) {
        const row = [
            sanitizeCSVField(chart.id),
            sanitizeCSVField(chart.title),
            sanitizeCSVField(chart.difficulty),
            sanitizeCSVField(chart.rating),
            sanitizeCSVField(chart.tier),
            sanitizeCSVField(chart.youtubeURL),
        ];
        csvLines.push(row.join(','));
    }
    // Write CSV file
    const csvContent = csvLines.join('\n');
    const csvPath = path.join(outputDir, 'charts.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`Successfully exported ${chartDB.charts.length} charts to ${csvPath}`);
}
// Run the main function
main();
//# sourceMappingURL=parse.js.map