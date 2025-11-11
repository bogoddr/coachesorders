import { ChartProps } from './Chart';

interface SpreadsheetRow {
  [key: string]: string;
}

export async function fetchSpreadsheetData(): Promise<ChartProps[]> {
  // Convert Google Sheets URL to CSV export URL
  const spreadsheetId = '1T2sE9Wogz7lKdZ7bSOsQdEfutbKscQbBfhN79eQVFn0';
  const gid = '2142633309';
  const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv&gid=${gid}`;

  const response = await fetch(csvUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
  } else {
    console.log('Fetched spreadsheet')
  }

  const csvText = await response.text();

  // Parse CSV data
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('Empty spreadsheet');
  }
  
  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  const rows: SpreadsheetRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(value => value.trim().replace(/^"|"$/g, ''));
    const row: SpreadsheetRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  // Parse spreadsheet data into ChartProps
  const parsedCharts: ChartProps[] = rows
    .map((row) => {
      // Find the difficulty column (it's the one with difficulty values)
      const difficulty = (row['Difficulty'] || 'BSP') as ChartProps['difficulty'];

      // Validate difficulty
      const validDifficulties: ChartProps['difficulty'][] = ['BSP', 'DSP', 'ESP', 'CSP'];
      const normalizedDifficulty = validDifficulties.includes(difficulty)
        ? difficulty
        : 'BSP';

      return {
        id: row['ID'] || '',
        title: row['Title'] || '',
        rating: parseFloat(row['Rating']) || 0,
        tier: parseFloat(row['Tier']) || 0,
        difficulty: normalizedDifficulty,
        youtubeURL: row['yt'] || '',
        score: parseFloat(row['Score']) || 0,
      };
    })
    .filter(chart => chart.id && chart.title); // Filter out incomplete entries

  return parsedCharts;
}
