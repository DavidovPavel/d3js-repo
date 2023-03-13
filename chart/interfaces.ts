import * as d3 from 'd3';

export type TluiChartAxisPosition = 'left' | 'top' | 'right' | 'bottom';
export type TluiChartAxisType = 'enum' | 'number' | 'time';

export type TluiChartData = [number, number[], string][];

export type TluiChartScale =
  | d3.ScaleBand<any>
  | d3.ScaleLinear<any, number>
  | d3.ScaleTime<any, number>;

export type TluiChartAxis = d3.Axis<any>;

export type TluiChartRenderTarget = d3.Selection<
  SVGGElement,
  unknown,
  null,
  unknown
>;

export interface TluiChartAxisData {
  name: string;
  type: TluiChartAxisType;
  position: TluiChartAxisPosition;
  d3Scale: TluiChartScale;
  d3Axis: TluiChartAxis;
}

export interface TluiLayerDrawContext {
  canvasWidth: number;
  canvasHeight: number;
  primaryAxis: TluiChartAxisData;
  secondaryAxis: TluiChartAxisData;
}

export interface TluiTooltipDataRow {
  value: number;
  title: string;
  color: string;
  type: 'line' | 'dashed-line' | 'bar';
  hidden: boolean;
}

export type TluiTooltipData = TluiTooltipDataRow[];

export interface TluiLegendLabelOption {
  id: string;
  title: string;
  color: string;
  selected: boolean;
}

export interface TluiLegendLabelData {
  title: string;
  color: string;
  type: 'line' | 'dashed-line' | 'bar';
  inactive: boolean;
  options: TluiLegendLabelOption[];
}

export abstract class TluiChartDataRenderer {
  abstract render(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext,
    id: string
  ): void;
  abstract reRender(layerId: string): void;
  abstract state: Map<number, boolean>;
}

export abstract class TluiChartDataProvider<U, V> {
  abstract getDomain(): U[];
  abstract getRange(): V[];
  abstract getTooltipData(value: U): TluiTooltipData;
  abstract getLegendData(): TluiLegendLabelData;
  abstract getData(): [number, number[], string][];
}

export abstract class TluiChartPaletteProvider {
  abstract nextColor(): string;
}
