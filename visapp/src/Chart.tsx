interface ChartProps {
    id: string;
    title: string;
    rating: number;
    tier: number;
    difficulty: 'BSP' | 'DSP' | 'ESP' | 'CSP';
    youtubeURL: string;
}

// TODO: implement the component using the pseudocode below.

/*
<a href="props.youtubeURL">
    <div style={border: based on props.difficulty: BSP=yellow, DSP=red, ESP=green, CSP=purple }>
        <image source="https://3icecream.com/img/banners/<props.id>.jpg">
        <>"[" + props.difficulty + "." + props.tier + "]" "" props.title</>
    </div>
</a>
*/