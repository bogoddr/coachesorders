export interface ChartDB {
    charts: Chart[];
}
export interface Chart {
    id: string;
    title: string;
    rating: number;
    tier: number;
    difficulty: 'bSP' | 'BSP' | 'DSP' | 'ESP' | 'CSP' | 'BDP' | 'DDP' | 'EDP' | 'CDP';
    youtubeURL: string;
}
//# sourceMappingURL=parse.d.ts.map