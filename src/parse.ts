import * as fs from 'fs';
import * as path from 'path';

export interface ChartDB {
    charts: Chart[];
}

export interface Chart {
    id: string;
    title: string;
    rating: number;
    tier: number;
    // These correspond to the "difficulty" value in the rawMetadata array in the html.
    difficulty: '0 bSP' | '0 BSP' | '0 DSP' | '0 ESP' | '0 CSP' | '1 BDP' | '1 DDP' | '1 EDP' | '1 CDP';
    youtubeURL: string;
}

interface RawMetadataEntry {
    song_id: string;
    difficulty: number;
    youtube_id: string | null;
    has_sm: number | null;
}

interface DifficultyListEntry {
    tier: number;
    rating: number;
}

interface SongDataEntry {
    song_id: string;
    song_name: string;
    romanized_name?: string;
    alternate_name?: string;
    searchable_name?: string;
    alphabet?: string;
    version_num?: number;
    ratings?: number[];
    tiers?: number[];
    lock_types?: number[];
    deleted?: number;
}

// Map difficulty numbers to difficulty strings
const DIFFICULTY_MAP: Record<number, Chart['difficulty']> = {
    0: '0 bSP', // Beginner Single Play
    1: '0 BSP', // Basic Single Play
    2: '0 DSP', // Difficult Single Play
    3: '0 ESP', // Expert Single Play
    4: '0 CSP', // Challenge Single Play
    5: '1 BDP', // Basic Double Play
    6: '1 DDP', // Difficult Double Play
    7: '1 EDP', // Expert Double Play
    8: '1 CDP', // Challenge Double Play
};

function loadSongData(dataDir: string): Map<string, SongDataEntry> {
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

        const songDataArray: SongDataEntry[] = JSON.parse(match[1]);

        // Create a map of song_id to song data for quick lookup
        const songDataMap = new Map<string, SongDataEntry>();
        for (const entry of songDataArray) {
            songDataMap.set(entry.song_id, entry);
        }

        console.log(`Loaded ${songDataMap.size} songs from songdata.js\n`);
        return songDataMap;
    } catch (error) {
        console.warn('Warning: Error loading songdata.js:', error);
        return new Map();
    }
}

function extractDataFromHTML(htmlContent: string): {
    rawMetadata: RawMetadataEntry[];
    difficultyList: Record<string, DifficultyListEntry>;
} {
    // Extract rawMetadata array
    const rawMetadataMatch = htmlContent.match(/let rawMetadata = (\[.*?\]);/s);
    if (!rawMetadataMatch) {
        throw new Error('Could not find rawMetadata in HTML');
    }
    const rawMetadata: RawMetadataEntry[] = JSON.parse(rawMetadataMatch[1]);

    // Extract difficultyList object
    const difficultyListMatch = htmlContent.match(/let difficultyList = (\{.*?\});/s);
    if (!difficultyListMatch) {
        throw new Error('Could not find difficultyList in HTML');
    }
    const difficultyList: Record<string, DifficultyListEntry> = JSON.parse(difficultyListMatch[1]);

    return { rawMetadata, difficultyList };
}

function parseHTMLFile(filePath: string, songDataMap: Map<string, SongDataEntry>): Chart[] {
    const htmlContent = fs.readFileSync(filePath, 'utf-8');
    const { rawMetadata, difficultyList } = extractDataFromHTML(htmlContent);

    const charts: Chart[] = [];

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
        let title: string;
        if (songData) {
            const parts: string[] = [];
            if (songData.romanized_name) {
                parts.push(songData.romanized_name);
            }
            if (songData.alternate_name) {
                parts.push(songData.alternate_name);
            }

            if (parts.length > 0) {
                title = `${songData.song_name} (${parts.join('/')})`;
            } else {
                title = songData.song_name;
            }
        } else {
            title = song_id;
        }

        // Get rating from songdata.js ratings array at the difficulty index
        // If not available, fall back to difficultyList rating
        let rating = difficultyData.rating;
        if (songData?.ratings && songData.ratings[difficulty] !== undefined) {
            rating = songData.ratings[difficulty];
        }

        // Create Chart object
        const chart: Chart = {
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

function main(): void {
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
    const chartDB: ChartDB = {
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
        } catch (error) {
            console.error(`  Error parsing ${file}:`, error);
        }
    }

    // Step 4: Neatly log the ChartDB object (for debugging purposes)
    console.log(`\n=== Chart Database Summary ===`);
    console.log(`Total charts: ${chartDB.charts.length}`);
    console.log(`\nSample charts (first 5):`);
    console.log(JSON.stringify(chartDB.charts.slice(0, 5), null, 2));

    // Group by difficulty
    const byDifficulty: Record<string, number> = {};
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

function appendAdditionalCharts(chartDB: ChartDB, dataDir: string): void {
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

            const [id, youtubeURL, rating, tier = '', title, difficulty,] = fields;

            // Validate difficulty
            const validDifficulties = ['0 bSP', '0 BSP', '0 DSP', '0 ESP', '0 CSP', '1 BDP', '1 DDP', '1 EDP', '1 CDP'];
            if (!validDifficulties.includes(difficulty)) {
                console.warn(`Skipping chart with invalid difficulty: ${difficulty}`);
                continue;
            }

            const chart: Chart = {
                id: id,
                youtubeURL: youtubeURL.trim(),
                title: title,
                rating: parseFloat(rating),
                tier: parseFloat(tier),
                difficulty: difficulty as Chart['difficulty'],
            };

            chartDB.charts.push(chart);
            addedCount++;
        }

        console.log(`Added ${addedCount} additional charts from additional.csv`);
    } catch (error) {
        console.error('Error loading additional.csv:', error);
    }
}

function parseCSVLine(line: string): string[] {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            // Check if it's an escaped quote
            if (inQuotes && line[i + 1] === '"') {
                currentField += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField);
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Push the last field
    fields.push(currentField);

    return fields;
}

function sanitizeCSVField(field: string | number): string {
    const fieldStr = String(field);

    // If the field contains comma, newline, or double quote, wrap it in quotes
    // and escape any existing double quotes by doubling them
    if (fieldStr.includes(',') || fieldStr.includes('\n') || fieldStr.includes('"')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
    }

    return fieldStr;
}

function exportToCSV(chartDB: ChartDB, outputDir: string): void {
    console.log(`\n=== Exporting to CSV ===`);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created directory: ${outputDir}`);
    }

    //PO9Pl1q896bDDl89qQb98D80DQoPio1I	https://www.youtube.com/watch?v=cnTky49oBVA	19	0.7	ENDYMION	CSP
    //ID	YouTube URL	Rating	Tier	Title	Difficulty

    // Create CSV header
    const headers = ['ID', 'YouTube URL', 'Rating', 'Tier', 'Title', 'Difficulty'];
    const csvLines: string[] = [headers.join(',')];

    // Add each chart as a CSV row
    for (const chart of chartDB.charts) {
        const row = [
            sanitizeCSVField(chart.id),
            sanitizeCSVField(chart.youtubeURL),
            sanitizeCSVField(chart.rating),
            sanitizeCSVField(chart.tier),
            sanitizeCSVField(chart.title),
            sanitizeCSVField(chart.difficulty),
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
