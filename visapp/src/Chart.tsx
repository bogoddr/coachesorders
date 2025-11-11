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
        ESP: 'green',
        CSP: 'purple',
    };

    const borderColor = difficultyColors[props.difficulty];

    return (
        <a href={props.youtubeURL} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
                border: `4px solid ${borderColor}`,
                padding: '8px',
                borderRadius: '4px',
                display: 'inline-block',
            }}>
                <img
                    src={`https://3icecream.com/img/banners/${props.id}.jpg`}
                    alt={props.title}
                    style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
                />
                <div style={{ marginTop: '8px' }}>
                    [{props.difficulty}.{props.tier}] {props.title}
                </div>
                <div style={{ marginTop: '8px' }}>
                    {props.score ? props.score + ',000' : 'no pass!'}
                </div>
            </div>
        </a>
    );
}