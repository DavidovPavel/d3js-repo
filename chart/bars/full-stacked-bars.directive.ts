import {
  Directive,
  EventEmitter,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import * as d3 from 'd3';

import {
  TluiChartData,
  TluiChartDataProvider,
  TluiChartDataRenderer,
  TluiChartPaletteProvider,
  TluiChartRenderTarget,
  TluiChartScale,
  TluiLayerDrawContext,
  TluiLegendLabelData,
  TluiTooltipData,
} from '../interfaces';
import { TluiChartComponent } from '../chart/chart.component';
import { ScaleBand } from 'd3';

@Directive({
  selector: '[tluiFullStackedBars]',
  exportAs: 'tluiFullStackedBars',
  providers: [
    {
      provide: TluiChartDataRenderer,
      useExisting: TluiFullStackedBarsDirective,
    },
    {
      provide: TluiChartDataProvider,
      useExisting: TluiFullStackedBarsDirective,
    },
  ],
})
export class TluiFullStackedBarsDirective
  implements
    TluiChartDataRenderer,
    TluiChartDataProvider<number, number>,
    OnInit
{
  state = new Map<number, boolean>();

  @Input() set hiddenPosition(
    value: { position: number; isHidden: boolean }[]
  ) {
    if (value) {
      value.forEach((a) => {
        const { position, isHidden } = a;
        this.state.set(position, isHidden);
      });
    }
  }
  @Output() hiddenPositionChange = new EventEmitter<
    { position: number; isHidden: boolean }[]
  >();

  @Input()
  data: TluiChartData = [];

  @Input()
  dynamics: 'line' | 'pulse' | 'none' = 'none';

  @Input()
  caption!: string;

  @Input()
  groupNames: string[] = [];

  @Input()
  groupColors: string[] = [];

  context!: TluiLayerDrawContext;

  private maxValue = 0;

  constructor(
    @Inject(TluiChartPaletteProvider)
    private readonly paletteProvider: TluiChartComponent
  ) {}

  ngOnInit(): void {
    const channels = this.data[0]?.[1]?.length ?? 0;
    for (let i = 0; i < channels; i++) {
      this.groupColors[i] =
        this.groupColors[i] ?? this.paletteProvider.nextColor();
      this.groupNames[i] = this.groupNames[i] ?? 'Группа-' + i;
    }
  }

  getData(): TluiChartData {
    return this.data;
  }

  render(target: TluiChartRenderTarget, context: TluiLayerDrawContext): void {
    this.context = context;
    if (context.primaryAxis.position === 'bottom') {
      this.drawBottomBars(target, context);
    } else if (context.primaryAxis.position === 'left') {
      this.drawLeftBars(target, context);
    }
  }

  getDomain(): number[] {
    return this.data.map((bar) => bar[0]);
  }

  getRange(): number[] {
    const upper = this.data.map(([, stack]) =>
      stack.reduce((acc, curr) => acc + curr, 0)
    );
    const lower = this.data.map(([, stack]) => Math.min(...stack));
    return [Math.min(...lower), Math.max(...upper)];
  }

  getTooltipData(value: number): TluiTooltipData {
    const primaryAxis = this.paletteProvider.axesList.find(
      (axis) => axis.primary
    );
    const data = this.data.find(
      (a) => (primaryAxis?.type === 'enum' ? a[2] : a[0]) === value
    );
    if (!data) {
      return [];
    }

    return data[1].map((value, index) => ({
      value,
      title: this.groupNames[index],
      color: this.groupColors[index],
      type: 'bar',
      hidden: this.state.get(index) ?? false,
    }));
  }

  getLegendData(): TluiLegendLabelData {
    return {
      title: this.caption,
      color: this.groupColors[0],
      type: 'bar',
      inactive: false,
      options: this.groupNames.map((title, index) => ({
        id: `${index}`,
        title,
        color: this.groupColors[index],
        selected:
          this.state.get(index) === undefined ? true : !this.state.get(index),
      })),
    };
  }

  private drawLeftBars(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext
  ) {}

  private drawBottomBars(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext
  ) {
    const data = this.data.map(([a, b, c]) => [
      a,
      b.map((v, k) => (this.state.get(k) ? 0 : v)),
      c,
    ]) as TluiChartData;
    this.drawBottomElements(target, context, data);
  }

  reRender(layerId: string): void {
    const a = d3.select(`#${layerId}`);
    a.selectAll('g.tlui-chart-stack').remove();
    a.selectAll('path.tlui-chart-bars').remove();
    a.selectAll('path.tlui-chart-bars-dynamics').remove();

    const data = this.data.map(([a, b, c]) => [
      a,
      b.map((v, k) => (this.state.get(k) ? 0 : v)),
      c,
    ]) as TluiChartData;

    this.drawBottomElements(
      a as unknown as TluiChartRenderTarget,
      this.context,
      data
    );

    const s = Array.from(this.state).map(([position, isHidden]) => ({
      position,
      isHidden,
    }));
    this.hiddenPositionChange.emit(s);
  }

  private drawBottomElements(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext,
    data: TluiChartData
  ): void {
    this.findMaxValue();

    const x = context.primaryAxis.d3Scale;
    const type = context.primaryAxis.type;
    const xIsBand = (x: TluiChartScale): x is ScaleBand<any> => type === 'enum';

    const y = context.secondaryAxis.d3Scale as d3.ScaleLinear<any, any>;
    const bandWidth = context.canvasWidth / data.length;
    const height = context.canvasHeight;
    const color = d3
      .scaleOrdinal<string>()
      .domain([...this.groupColors.keys()].map((v) => String(v)))
      .range(this.groupColors);

    const bars = target
      .selectAll('bars')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'tlui-chart-stack')
      .attr(
        'transform',
        (d) => `translate(${xIsBand(x) ? x(d[2]) : x(d[0])}, 0)`
      )
      .selectAll('rect')
      .data((d) => this.stackValues(d[1]))
      .enter()
      .append('rect')
      .attr('fill', (_, k) => color(String(k)))
      .attr('x', bandWidth * 0.25)
      .attr('y', (d) => y(d[1]))
      .attr('width', bandWidth * 0.5)
      .attr('height', (d) => height - y(d[1] - d[0]));

    if (this.dynamics !== 'none') {
      const lines = this.data
        .map(([a, b, c]) => [
          [(xIsBand(x) ? x(c) : x(a)) ?? 0, y(this.stackValues(b)[2][1])],
          [
            ((xIsBand(x) ? x(c) : x(a)) ?? 0) + bandWidth,
            y(this.stackValues(b)[2][1]),
          ],
        ])
        .flat() as [number, number][];

      const line = d3
        .line()
        .x((d) => d[0])
        .y((d) => d[1]);

      target
        .append('path')
        .attr(
          'class',
          this.dynamics === 'line'
            ? `tlui-chart-bars`
            : `tlui-chart-bars-dynamics`
        )
        .attr('d', line(lines) ?? '')
        .attr('stroke', this.paletteProvider.nextColor())
        .attr('fill', 'none');
    }
  }

  private stackValues(values: number[]): [number, number][] {
    const max = values.reduce((p, c) => p + c, 0);
    const k = this.maxValue / (max === 0 ? this.maxValue : max);

    return values
      .map((a) => a * k)
      .reduce<[number, number][]>(
        (p, c, i) => [...p, i ? [p[i - 1][1], c + p[i - 1][1]] : [0, c]],
        []
      );
  }

  private findMaxValue(): void {
    const sum = this.data.map(([, v]) => v.reduce((p, c) => p + c, 0));
    this.maxValue = d3.max(sum) ?? 0;
  }
}
