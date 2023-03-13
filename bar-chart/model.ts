export type chartViewType = 'curveLinear' | 'curveMonotoneX' | 'curveStepAfter';

export interface RawFeed {
    chartView: chartViewType;
    visualBarCharts: VisualData[];
    title: string;
}

export interface VisualData {
    name: string;
    color: string;
    engUnits: string;
    order: number;
    fact: number;
    plan: number;
    predict: number;
    hidden: boolean;
}

export abstract class ChartTemplate {}
