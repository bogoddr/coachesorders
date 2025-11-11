import { useEffect, useState } from 'react';
import { Chart } from './Chart';
import { fetchSpreadsheetData } from './fetchSpreadsheetData';
import type { ChartProps } from './Chart';

function App() {
  const [charts, setCharts] = useState<ChartProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const parsedCharts = await fetchSpreadsheetData();
        setCharts(parsedCharts);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Loading spreadsheet data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <p>Parsed {charts.length} charts</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '16px',
        padding: '16px',
      }}>
        {charts.map((chart) => (
          <Chart key={chart.id + chart.difficulty} {...chart} />
        ))}
      </div>
      TODO: filter/sort component
    </div>
  );
}

export default App;
