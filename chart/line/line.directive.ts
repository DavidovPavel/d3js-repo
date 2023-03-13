import { TluiChartWrapperDirective } from './../chart/chart-wrapper.directive';
import {
  Directive,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
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
import { ValueFn } from 'd3';
import { notNul } from '../area/pure';

export const d3Line = d3
  .line()
  .x(([a]) => a)
  .y(([, b]) => b);

type TransitionFunc = () => any;

@Directive({
  selector: '[tluiLine]',
  exportAs: 'tluiLine',
  providers: [
    {
      provide: TluiChartDataRenderer,
      useExisting: TluiLineDirective,
    },
    {
      provide: TluiChartDataProvider,
      useExisting: TluiLineDirective,
    },
  ],
})
export class TluiLineDirective
  implements
    OnChanges,
    TluiChartDataRenderer,
    TluiChartDataProvider<number, number>
{
  state = new Map<number, boolean>();

  @Input()
  data!: [number, number][];

  @Input()
  showValues: boolean = false;

  @Input()
  valuePosition: 'above' | 'below' = 'above';

  @Input()
  dynamics: 'line' | 'pulse' | 'none' = 'none';

  @Input()
  color: string = this.paletteProvider.nextColor();

  @Input()
  caption!: string;

  @Input()
  dataChanged: EventEmitter<SimpleChanges> = new EventEmitter<SimpleChanges>();

  context!: TluiLayerDrawContext;
  layerId!: string;

  constructor(
    @Inject(TluiChartPaletteProvider)
    private readonly paletteProvider: TluiChartPaletteProvider,
    private wrap: TluiChartWrapperDirective
  ) {}

  setState(position: number, selected: boolean): void {}

  public ngOnChanges(changes: SimpleChanges): void {
    this.dataChanged.emit(changes);
  }

  getData() {
    return this.data.map<[number, number[], string]>(([i, v]) => [i, [v], '']);
  }

  render(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext,
    id: string
  ): void {
    this.context = context;
    this.layerId = id;
    if (context.primaryAxis.position === 'bottom') {
      this.drawBottomLine(target, context);
    } else if (context.primaryAxis.position === 'left') {
      this.drawLeftLine(target, context);
    }
  }

  getDomain(): number[] {
    return this.data.map((line) => line[0]);
  }

  getRange(): number[] {
    const domain = this.data.map((line) => line[1]);
    return [Math.min(...domain), Math.max(...domain)];
  }

  getTooltipData(value: string | number | Date): TluiTooltipData {
    const data = this.data.find(([key]) => {
      return key.toString() == value.toString();
    });
    if (!data) {
      return [];
    }

    return [
      {
        value: data[1],
        title: this.caption,
        color: this.color,
        type: 'line',
        hidden: false,
      },
    ];
  }

  getLegendData(): TluiLegendLabelData {
    return {
      title: this.caption,
      color: this.color,
      type: 'line',
      inactive: false,
      options: [],
    };
  }

  private drawLeftLine(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext
  ) {
    const y = context.primaryAxis.d3Scale as d3.ScaleLinear<any, any>;
    const x = context.secondaryAxis.d3Scale as d3.ScaleLinear<any, any>;
    const width = context.canvasWidth;
    const bandHeight = context.canvasHeight / this.data.length;

    // const line = target
    //   .selectAll('line')
    //   .data(this.data)
    //   .enter()
    //   .append('g')
    //   .attr('class', 'tlui-chart-bar')
    //   .attr(
    //     'transform',
    //     (d) => `translate(${0}, ${y(d[0]) - bandHeight * 0.75})`
    //   );
    // line
    //   .append('rect')
    //   .attr('fill', this.color)
    //   .attr('width', (d) => d[1])
    //   .attr('height', bandHeight * 0.5);
  }

  private drawBottomLine(
    target: TluiChartRenderTarget,
    context: TluiLayerDrawContext
  ) {
    const x = context.primaryAxis.d3Scale as d3.ScaleLinear<number, number>;
    const y = context.secondaryAxis.d3Scale as d3.ScaleLinear<number, number>;

    this.renderPath(target, x, y);
  }

  reRender(v: unknown = null): void {
    if (v) {
      const ext = v as { start: number; end: number };

      const target = d3.select(
        `#${this.layerId}`
      ) as unknown as TluiChartRenderTarget;

      target.selectAll('.tlui-chart-end-circle-dynamics').remove();

      const x = this.context.primaryAxis.d3Scale as d3.ScaleLinear<
        number,
        number
      >;
      const y = this.context.secondaryAxis.d3Scale as d3.ScaleLinear<
        number,
        number
      >;

      const xAxis = d3.select(`#${this.wrap.id} .tlui-chart-axis--x`);

      x.domain([ext.start, ext.end]);

      xAxis
        .transition()
        .duration(500)
        .call(d3.axisBottom(x) as unknown as TransitionFunc);

      console.log(ext);
      const points = this.getPoints(x, y, [ext.start, ext.end + 1]);

      target
        .select('path.tlui-chart-line-dynamics')
        .transition()
        .duration(500)
        .attr('d', notNul(d3Line(points)))
        .attr('stroke', this.color)
        .attr('stroke-width', '2px')
        .attr('fill', 'none');
    }
  }

  renderPath(
    target: TluiChartRenderTarget,
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLinear<number, number>
  ): void {
    const points = this.getPoints(x, y);

    target
      .append('path')
      .attr('class', 'tlui-chart-line-dynamics')
      .attr('d', notNul(d3Line(points)))
      .attr('stroke', this.color)
      .attr('stroke-width', '2px')
      .attr('fill', 'none');

    let cx = points[points.length - 1][0];
    let cy = points[points.length - 1][1];

    const arc = d3
      .arc()
      .innerRadius(4)
      .outerRadius(5)
      .startAngle(0)
      .endAngle(360);

    target
      .append('circle')
      .attr('class', 'tlui-chart-end-circle-dynamics')
      .attr('cx', cx)
      .attr('cy', cy)
      .attr('r', 3)
      .attr('fill', this.color)
      .attr('stroke', 'none');

    target
      .append('path')
      .attr('class', 'tlui-chart-end-circle-dynamics')
      .attr('transform', `translate(${cx},${cy})`)
      .attr(
        'd',
        arc as ValueFn<
          SVGPathElement,
          unknown,
          string | number | boolean | null
        >
      )
      .attr('fill', this.color)
      .attr('stroke', 'none');
  }

  getPoints(
    x: d3.ScaleLinear<number, number>,
    y: d3.ScaleLinear<number, number>,
    ext: number[] = []
  ): [number, number][] {
    const [start, end] = ext;
    return this.data
      .slice(start, end)
      .map<[number, number][]>(([a, b]) => [
        [notNul(x(a)), notNul(y(b))],
        [notNul(x(a)), notNul(y(b))],
      ])
      .flat();
  }
}
