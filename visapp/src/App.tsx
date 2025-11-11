import { useEffect, useState, useMemo } from 'react';
import { Chart } from './Chart';
import { fetchSpreadsheetData } from './fetchSpreadsheetData';
import type { ChartProps } from './Chart';

type SortOption = 'title' | 'rating' | 'tier' | 'score' | 'difficulty';
type SortOrder = 'asc' | 'desc';

function App() {
  const [charts, setCharts] = useState<ChartProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter/Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [showNegativeRatings, setShowNegativeRatings] = useState(false);
  const [minScore, setMinScore] = useState<number>(0);
  const [maxScore, setMaxScore] = useState<number>(999);
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

  // Filter and sort charts
  const filteredAndSortedCharts = useMemo(() => {
    let filtered = charts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(chart =>
        chart.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      filtered = filtered.filter(chart => chart.rating === ratingFilter);
    }

    // Hide negative ratings by default
    if (!showNegativeRatings) {
      filtered = filtered.filter(chart => chart.tier >= 0);
    }

    // Apply score range filter
    filtered = filtered.filter(chart => chart.score >= minScore && chart.score <= maxScore);

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'tier':
          comparison = a.tier - b.tier;
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'difficulty':
          const difficultyOrder = { BSP: 0, DSP: 1, ESP: 2, CSP: 3 };
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [charts, searchTerm, ratingFilter, showNegativeRatings, minScore, maxScore, sortBy, sortOrder]);

  if (loading) {
    return <div>Loading spreadsheet data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      {/* Filter/Sort Controls */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <h2 style={{ marginTop: 0 }}>Filter & Sort</h2>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
          {/* Search */}
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Search by Title
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search charts..."
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Rating Filter */}
          <div style={{ flex: '0 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Rating
            </label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="all">All</option>
              <option value="17">17</option>
              <option value="18">18</option>
              <option value="19">19</option>
            </select>
          </div>

          {/* Score Range Filter */}
          <div style={{ flex: '0 1 250px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Score Range
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                min="0"
                max="999"
                placeholder="Min"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              />
              <span>-</span>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                min="0"
                max="999"
                placeholder="Max"
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Show Negative Ratings Checkbox */}
          <div style={{ flex: '0 1 200px', display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showNegativeRatings}
                onChange={(e) => setShowNegativeRatings(e.target.checked)}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px' }}>Show omni/removed</span>
            </label>
          </div>

          {/* Sort By */}
          <div style={{ flex: '0 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="title">Title</option>
              <option value="rating">Rating</option>
              <option value="tier">Tier</option>
              <option value="score">Score</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>

          {/* Sort Order */}
          <div style={{ flex: '0 1 150px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
              Order
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                fontSize: '14px',
              }}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '14px', color: '#666' }}>
          Showing {filteredAndSortedCharts.length} of {charts.length} charts
        </div>
      </div>

      {/* Chart Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '16px',
      }}>
        {filteredAndSortedCharts.map((chart) => (
          <Chart key={chart.id + chart.difficulty} {...chart} />
        ))}
      </div>

      {filteredAndSortedCharts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No charts found matching your filters.
        </div>
      )}
    </div>
  );
}

export default App;
