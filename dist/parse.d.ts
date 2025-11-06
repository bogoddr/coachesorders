export interface ChartDB {
    charts: Chart[];
}
export interface Chart {
    id: string;
    title: string;
    rating: number;
    tier: number;
    difficulty: '0 bSP' | '0 BSP' | '0 DSP' | '0 ESP' | '0 CSP' | '1 BDP' | '1 DDP' | '1 EDP' | '1 CDP';
    youtubeURL: string;
}
//# sourceMappingURL=parse.d.ts.map