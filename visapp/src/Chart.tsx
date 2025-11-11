export interface ChartProps {
    id: string;
    title: string;
    rating: number;
    tier: number;
    difficulty: 'BSP' | 'DSP' | 'ESP' | 'CSP';
    youtubeURL: string;
    score: number;
}

export function Chart(props: ChartProps) {
    // Map difficulty to border color
    const difficultyColors: Record<ChartProps['difficulty'], string> = {
        BSP: 'yellow',
        DSP: 'red',
        ESP: '#33bb33',
        CSP: '#dd33dd',
    };

    const borderColor = difficultyColors[props.difficulty];

    return (
        <a href={props.youtubeURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{
                border: `6px solid ${borderColor}`,
                padding: '0px',
                borderRadius: '6px',
                width: '100%',
                boxSizing: 'border-box',
            }}>
                <img
                    src={`https://3icecream.com/img/banners/${props.id}.jpg`}
                    alt={props.title}
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                />
            </div>
        </a>
    );
}