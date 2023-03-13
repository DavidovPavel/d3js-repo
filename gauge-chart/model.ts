export type chartViewType = 'curveLinear' | 'curveMonotoneX' | 'curveStepAfter';

export interface RawFeed {
    chartView: chartViewType;
    visualPieCharts: PieVisualData[];
    title: string;
}

export interface PieVisualData {
    deviation: number;
    engUnits: string;
    fact: number;
    hidden: boolean;
    name: string;
    order: number;
    plan: number;
    visualBoundCharts: visualBoundCharts[];
    zeroOn: 'left' | 'right';
}

export interface visualBoundCharts {
    color: string;
    value: number;
    label: number;
    isActive?: boolean;
    isFact?: boolean;
}

export interface ArcData {
    data: visualBoundCharts;
    endAngle: number;
    index: number;
    padAngle: number;
    startAngle: number;
    value: number;
}
