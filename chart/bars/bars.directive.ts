import { TluiChartData, TluiChartScale } from './../interfaces';
import {
  Directive,
  Host,
  Inject,
  Input,
  OnInit,
  EventEmitter,
  Output,
} from '@angular/core';
import * as d3 from 'd3';

import {
  TluiChartDataProvider,
  TluiChartDataRenderer,
  TluiChartPaletteProvider,
  TluiChartRenderTarget,
  TluiLayerDrawContext,
  TluiLegendLabelData,
  TluiTooltipData,
} from '../interfaces';
import { ScaleBand } from 'd3';

import { TluiChartComponent } from '../chart/chart.component';

const ABOVE_VALUE_POSITION = -2;
const BELOW_VALUE_POSITION = 10;

@Directive({
  selector: '[tluiBars]',
  exportAs: 'tluiBars',
  providers: [
    {
      provide: TluiChartDataRenderer,
      useExisting: TluiBarsDirective,
    },
    {
      provide: TluiChartDataProvider,
      useExisting: TluiBarsDirective,
    },
  ],
})
export class TluiBarsDirective
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
  data!: TluiChartData;

  @Input()
  showValues: boolean = false;

  @Input()
  valuePosition: 'above' | 'below' = 'above';

  @Input()
  dynamics: 'line' | 'none' = 'line';

  @Input()
  caption!: string;

  @Input()
  groupNames: string[] = [];

  @Input()
  groupColors: string[] = [];

  context!: TluiLayerDrawContext;
  layerId!: string;

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

  render(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext,
    id: string
  ): void {
    this.context = context;
    this.layerId = id;
    if (context.primaryAxis.position === 'bottom') {
      this.drawBottomBars(target, context);
    } else if (context.primaryAxis.position === 'left') {
      this.drawLeftBars(target, context);
    }
    this.reRender();
  }

  reRender(): void {
    Array.from(this.state).forEach((a) =>
      d3
        .selectAll(`#${this.layerId} .class-${a[0]}`)
        .attr('display', `${a[1] ? 'none' : null}`)
    );
    const s = Array.from(this.state).map(([position, isHidden]) => ({
      position,
      isHidden,
    }));
    this.hiddenPositionChange.emit(s);
  }

  getDomain(): number[] {
    return this.data.map((bar) => bar[0]);
  }

  getRange(): number[] {
    const max = this.data.map(([, bar]) => Math.max(...bar));
    const min = this.data.map(([, bar]) => Math.min(...bar));
    return [Math.min(...min), Math.max(...max) + 50];
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

    return data[1].map((value, i) => ({
      value,
      title: this.groupNames[i],
      color: this.groupColors[i],
      type: 'bar',
      hidden: this.state.get(i) ?? false,
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
  ) {
    const y = context.primaryAxis.d3Scale as d3.ScaleLinear<any, any>;
    const bandHeight = context.canvasHeight / this.data.length;

    const color = d3
      .scaleOrdinal<string>()
      .domain([...this.groupColors.keys()].map((v) => String(v)))
      .range(this.groupColors);

    const bars = target
      .selectAll('bars')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'tlui-chart-bar')
      .attr(
        'transform',
        (d) => `translate(${0}, ${y(d[0]) - bandHeight * 0.75})`
      );

    const items = bars
      .selectAll('rect')
      .data((d) => d[1])
      .enter();

    items
      .append('rect')
      .attr('class', (_, i) => `class-${i}`)
      .attr('fill', (_, k) => color(String(k)))
      .attr('y', bandHeight * 0.075)
      .attr('width', (d) => d)
      .attr('height', bandHeight * 0.5)
      .sort(d3.descending);
  }

  private drawBottomBars(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext
  ) {
    const x = context.primaryAxis.d3Scale;
    const type = context.primaryAxis.type;
    const xIsBand = (x: TluiChartScale): x is ScaleBand<any> => type === 'enum';

    const y = context.secondaryAxis.d3Scale as d3.ScaleLinear<any, any>;
    const bandWidth = context.canvasWidth / this.data.length;
    const height = context.canvasHeight;

    const color = d3
      .scaleOrdinal<string>()
      .domain([...this.groupColors.keys()].map((v) => String(v)))
      .range(this.groupColors);

    const bars = target
      .selectAll('bars')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'tlui-chart-bar')
      .attr(
        'transform',
        (d) => `translate(${xIsBand(x) ? x(d[2]) : x(d[0])}, 0)`
      );

    const items = bars
      .selectAll('rect')
      .data((d) => d[1])
      .enter();

    items
      .append('rect')
      .attr('class', (_, i) => `class-${i}`)
      .attr('fill', (_, k) => color(String(k)))
      .attr('x', bandWidth * 0.25)
      .attr('y', (d) => y(d))
      .attr('width', bandWidth * 0.5)
      .attr('height', (d) => height - y(d))
      .sort(d3.descending);

    if (this.showValues) {
      items
        .append('rect')
        .attr('class', (_, i) => `class-${i}`)
        .attr('fill', 'white')
        .attr('x', bandWidth * 0.25)
        .attr('y', (d) => y(d))
        .attr('height', 1)
        .attr('width', bandWidth * 0.5);

      const translateX = bandWidth * 0.25;
      const translateY =
        this.valuePosition === 'above'
          ? ABOVE_VALUE_POSITION
          : BELOW_VALUE_POSITION;

      items
        .append('text')
        .attr('class', (_, i) => `class-${i} tlui-chart-bar__label`)
        .attr('transform', `translate(${translateX}, ${translateY})`)
        .attr('text-anchor', 'middle')
        .attr('x', bandWidth * 0.25)
        .attr('y', (d) => y(d))
        .text((d) => d);
    }

    if (this.dynamics !== 'none') {
      const lines = this.groupNames.map(
        (_, i) =>
          this.data
            .map(([a, b, c]) => [
              [((xIsBand(x) ? x(c) : x(a)) ?? 0) + bandWidth * 0.25, y(b[i])],
              [((xIsBand(x) ? x(c) : x(a)) ?? 0) + bandWidth * 0.75, y(b[i])],
            ])
            .flat() as [number, number][]
      );

      const line = d3
        .line()
        .x((d) => d[0])
        .y((d) => d[1]);

      lines.map((point, i) => {
        target
          .append('path')
          .attr('class', `class-${i} tlui-chart-bars`)
          .attr('d', line(point) ?? '')
          .attr(
            'stroke',
            this.groupColors[i]
              ? this.groupColors[i]
              : this.paletteProvider.nextColor()
          )
          .attr('fill', 'none');
      });
    }
  }
}
