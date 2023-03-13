import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ComponentFactoryResolver,
  ContentChild,
  ContentChildren,
  Host,
  HostBinding,
  Inject,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import * as d3 from 'd3';

import {
  TluiChartAxis,
  TluiChartPaletteProvider,
  TluiChartRenderTarget,
  TluiChartScale,
  TluiLayerDrawContext,
  TluiLegendLabelData,
  TluiLegendLabelOption,
} from '../interfaces';
import { TluiTooltipComponent } from '../tooltip/tooltip.component';
import { TluiDataLayerDirective } from '../data-layer.directive';
import { TluiAxisDirective } from '../axis.directive';
import { TLUI_CHART_PALETTE } from '../injection-tokens';
import { TluiAxisLinesDirective } from '../axis-lines.directive';
import { TluiLineDirective } from '../line/line.directive';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { NumberValue, ScaleBand } from 'd3';
import { TluiChartWrapperDirective } from './chart-wrapper.directive';

const AXIS_COLOR = 'var(--color-borders-and-icons-icons)';
const GRID_COLOR = 'var(--color-borders-and-icons-stroke-shape)';
const TEXT_COLOR = 'var(--color-text-contrast)';

const AXIS_WIDH = 40;

@Component({
  selector: 'tlui-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.scss'],
  providers: [
    {
      provide: TluiChartPaletteProvider,
      useExisting: TluiChartComponent,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TluiChartComponent
  implements AfterViewInit, TluiChartPaletteProvider, OnDestroy
{
  @HostBinding('class') css = 'tlui-chart-container';

  @Input()
  tooltip: boolean = true;

  @Input()
  typeTooltip: 'bars' | 'line' = 'bars';

  @Input()
  legend: boolean = true;

  get options(): string[] {
    return this.layersList.first.getData().map((a) => a[2]);
  }

  layerLabels: {
    data: TluiLegendLabelData;
    layer: TluiDataLayerDirective<any, any>;
  }[] = [];

  @ContentChildren(TluiAxisDirective)
  readonly axesList!: QueryList<TluiAxisDirective<any>>;

  @ContentChildren(TluiAxisLinesDirective)
  private readonly axisLinesList!: QueryList<TluiAxisLinesDirective>;

  @ContentChildren(TluiDataLayerDirective)
  private readonly layersList!: QueryList<TluiDataLayerDirective<any, any>>;

  @ContentChild(TluiLineDirective)
  private readonly lineDirective!: TluiLineDirective;

  @ViewChild('tooltip', { read: ViewContainerRef, static: true })
  private readonly tooltipViewContainer!: ViewContainerRef;

  private scales: Map<string, TluiChartScale> = new Map();
  private axes: Map<string, TluiChartAxis> = new Map();
  private _tooltip!: TluiTooltipComponent | null;
  private nextColorId: number = -1;
  private highlighted: any;

  private readonly unsubscribe$ = new Subject<void>();

  constructor(
    private readonly componentFactoryResolver: ComponentFactoryResolver,
    private readonly changeDetector: ChangeDetectorRef,
    @Inject(TLUI_CHART_PALETTE) private readonly CHART_PALETTE: string[],
    @Host() private wrap: TluiChartWrapperDirective
  ) {}

  public ngAfterViewInit() {
    this.lineDirective?.dataChanged
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(() => this.drawStart());
    this.drawStart();
  }

  public ngOnDestroy(): void {
    this.unsubscribe$.next();
  }

  private drawStart() {
    this.createScales();
    this.createAxes();
    this.createLegendLabels();
    this.drawBackground();
    this.drawAxes();
    this.drawAxisLines();
    this.drawLayers();
    this.drawColumns();
    this.changeDetector.detectChanges();
  }

  nextColor(): string {
    return this.CHART_PALETTE[
      (this.nextColorId = (this.nextColorId + 1) % this.CHART_PALETTE.length)
    ];
  }

  onLayerInactivityChange(
    layer: TluiDataLayerDirective<any, any>,
    hidden: boolean
  ) {}

  onLabelOptionSelectionChange(
    layer: TluiDataLayerDirective<any, any>,
    { id, selected }: TluiLegendLabelOption
  ) {
    layer.reRender(id, selected);
  }

  private getContext(
    layer: TluiDataLayerDirective<any, any>
  ): TluiLayerDrawContext | null {
    const primaryAxis = this.axesList.find((axis) => axis.primary);
    const secondaryAxis = this.axesList.find(
      (axis) => axis.name === layer.axis
    );

    if (primaryAxis && secondaryAxis) {
      return {
        canvasWidth: this.wrap.offsetWidth,
        canvasHeight: this.wrap.offsetHeight,
        primaryAxis: {
          name: primaryAxis.name,
          type: primaryAxis.type,
          position: primaryAxis.position,
          d3Scale: this.scales.get(primaryAxis.name) as TluiChartScale,
          d3Axis: this.axes.get(primaryAxis.name) as TluiChartAxis,
        },
        secondaryAxis: {
          name: secondaryAxis.name,
          type: secondaryAxis.type,
          position: secondaryAxis.position,
          d3Scale: this.scales.get(secondaryAxis.name) as TluiChartScale,
          d3Axis: this.axes.get(secondaryAxis.name) as TluiChartAxis,
        },
      };
    }
    return null;
  }

  private createScales() {
    for (const axis of this.axesList) {
      let scale: TluiChartScale;

      if (axis.type === 'enum') {
        scale = d3.scaleBand().domain(this.options);
      } else if (axis.type === 'number') {
        scale = d3.scaleLinear().nice().domain(this.getNumberAxisDomain(axis));
      } else {
        scale = d3.scaleTime().nice().domain(this.getTimeAxisDomain(axis));
      }

      if (axis.position === 'bottom') {
        scale.range([0, this.wrap.offsetWidth]);
      } else if (axis.position === 'top') {
        scale.range([0, this.wrap.offsetWidth]);
      } else if (axis.position === 'left') {
        scale.range([this.wrap.offsetHeight, 0]);
      } else {
        scale.range([this.wrap.offsetHeight, 0]);
      }

      this.scales.set(axis.name, scale);
    }
  }

  private createAxes() {
    for (const axis of this.axesList) {
      const scale = this.scales.get(axis.name) as TluiChartScale;

      let d3Axis: TluiChartAxis;
      if (axis.position === 'bottom') {
        d3Axis = d3.axisBottom(scale);
      } else if (axis.position === 'top') {
        d3Axis = d3.axisTop(scale);
      } else if (axis.position === 'left') {
        d3Axis = d3.axisLeft(scale);
      } else {
        d3Axis = d3.axisRight(scale);
      }

      this.axes.set(axis.name, d3Axis.ticks(axis.ticks));
    }
  }

  private createLegendLabels() {
    for (let layer of this.layersList) {
      this.layerLabels.push({ layer, data: layer.getLegendData() });
    }
  }

  private drawAxes() {
    let locale = d3.timeFormatLocale({
      dateTime: '%A, %e %B %Y г. %X',
      date: '%d.%m.%Y',
      time: '%H:%M:%S',
      periods: ['', ''],
      days: [
        'воскресенье',
        'понедельник',
        'вторник',
        'среда',
        'четверг',
        'пятница',
        'суббота',
      ],
      shortDays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      months: [
        'Январь',
        'Февраль',
        'Март',
        'Апрель',
        'Май',
        'Июнь',
        'Июль',
        'Август',
        'Сентябрь',
        'Октябрь',
        'Ноябрь',
        'Декабрь',
      ],
      shortMonths: [
        'Янв',
        'Фев',
        'Мар',
        'Апр',
        'Май',
        'Июн',
        'Июл',
        'Авг',
        'Сен',
        'Окт',
        'Ноя',
        'Дек',
      ],
    });
    let formatMillisecond = locale.format('.%L'),
      formatSecond = locale.format(':%S'),
      formatMinute = locale.format('%H:%M'),
      formatHour = locale.format('%H %p'),
      formatDay = locale.format('%d %b'),
      formatWeek = locale.format('%b %d '),
      formatMonth = locale.format('%B'),
      formatYear = locale.format('%Y');

    function multiFormat(date: Date) {
      return (
        d3.timeSecond(date) < date
          ? formatMillisecond
          : d3.timeMinute(date) < date
          ? formatSecond
          : d3.timeHour(date) < date
          ? formatMinute
          : d3.timeDay(date) < date
          ? formatHour
          : d3.timeMonth(date) < date
          ? d3.timeWeek(date) < date
            ? formatDay
            : formatWeek
          : d3.timeYear(date) < date
          ? formatMonth
          : formatYear
      )(date);
    }

    let count = 0;

    for (const axis of this.axesList) {
      const d3Axis = this.axes.get(axis.name) as TluiChartAxis;

      const g = d3
        .select(this.wrap.canvas)
        .append('g')
        .attr('class', `tlui-chart-axis--${axis.name}`)
        .attr('color', AXIS_COLOR);

      if (axis.position === 'bottom') {
        g.attr('transform', `translate(0, ${this.wrap.offsetHeight})`);
      } else if (axis.position === 'top') {
        g.attr('transform', `translate(0, 0)`);
      } else if (axis.position === 'left') {
        g.attr('transform', `translate(${AXIS_WIDH * count}, 0)`);
        this.wrap.offsetLeft = AXIS_WIDH * count;
        count++;
      } else {
        g.attr('transform', `translate(${this.wrap.offsetWidth}, 0)`);
      }

      if (axis.type === 'time') {
        g.call(d3Axis.tickFormat((d) => multiFormat(d)))
          .selectAll('text')
          .attr('color', TEXT_COLOR)
          .attr('width', '50%');
      } else {
        g.call(d3Axis)
          .selectAll('text')
          .attr('color', TEXT_COLOR)
          .attr('width', '50%');
      }
    }
  }

  private drawAxisLines() {
    for (const axisLines of this.axisLinesList) {
      const axis = this.axesList.find((axis) => axis.name === axisLines.axis);
      if (!axis) {
        continue;
      }

      const d3Axis = this.axes.get(axisLines.axis) as TluiChartAxis;
      const tickSize =
        axis.position === 'left' || axis.position === 'right'
          ? -this.wrap.offsetWidth
          : -this.wrap.offsetHeight;

      const g = d3
        .select(this.wrap.canvas)
        .append('g')
        .attr('class', `tlui-chart-grid`)
        .attr('color', GRID_COLOR);

      if (axis.position === 'bottom') {
        g.attr('transform', `translate(0, ${this.wrap.offsetHeight})`);
      } else if (axis.position === 'top') {
        g.attr('transform', `translate(0, 0)`);
      } else if(axis.position === 'left') {
        g.attr('transform', `translate(0, 0)`);
      }
      else {
        g.attr('transform', `translate(${this.wrap.offsetWidth}, 0)`);
      }

      g.call(d3Axis.tickFormat(() => '').tickSizeInner(tickSize))
        .select('path')
        .remove();
    }
  }

  private drawLayers() {
    const primaryAxis = this.axesList.find((axis) => axis.primary);
    if (!primaryAxis) {
      return;
    }

    for (const layer of this.layersList) {
      const target = d3
        .select(this.wrap.canvas)
        .append('g')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', this.wrap.offsetWidth)
        .attr('height', this.wrap.offsetHeight)
        .attr('class', 'tlui-chart-data-layer')
        .attr('id', layer.id);
      this.drawLayer(target, layer);
    }
  }

  private drawLayer(
    target: TluiChartRenderTarget,
    layer: TluiDataLayerDirective<any, any>
  ) {
    const context = this.getContext(layer);

    if (context) {
      layer.draw(target, context);
    }
  }

  private drawColumns() {
    const primaryAxis = this.axesList.find((axis) => axis.primary);
    if (!primaryAxis) {
      return;
    }

    const domain =
      primaryAxis.type === 'enum'
        ? this.options
        : this.layersList.first.getDomain();
    const bandWidth = this.wrap.offsetWidth / domain.length;
    const bandHeight = this.wrap.offsetHeight / domain.length ?? 0;
    const scale = this.scales.get(primaryAxis?.name) as TluiChartScale;

    this.highlighted = d3
      .select(this.wrap.canvas)
      .append('g')
      .attr('x', 0)
      .attr('y', 0)
      .attr('class', 'tlui-chart-data-columns');

    if (this.tooltip) {
      this.highlighted
        .on('mouseenter', () => this.onGraphMouseEnter(d3.event))
        .on('mousemove', () => this.onGraphMouseMove(d3.event))
        .on('mouseleave', () => this.onGraphMouseLeave(d3.event));
    }

    const columnSelection = this.highlighted
      .selectAll('columns')
      .data(domain)
      .enter()
      .append('rect')
      .attr(
        'class',
        this.typeTooltip === 'bars'
          ? 'tlui-chart-data-column'
          : 'tlui-chart-data-column-none'
      )
      .attr('id', (d: any, i: number) => `${i}`);

    const lineSelection = this.highlighted
      .selectAll('lines')
      .data(domain)
      .enter()
      .append('line')
      .attr('class', 'tlui-chart-data-line')
      .attr('id', (d: any, i: number) => `data-line-${i}`);

    if (primaryAxis?.name === 'x') {
      columnSelection
        .attr('height', this.wrap.offsetHeight)
        .attr('width', bandWidth)
        .attr('transform', (d: NumberValue) =>
          this.typeTooltip === 'bars'
            ? `translate(${scale(d)}, 0)`
            : `translate(${(scale(d) ?? 0) - bandWidth / 2}, 0)`
        )
        .datum((d: any) => d)
        .attr('fill', 'transparent');

      lineSelection
        .attr('x1', (d: NumberValue) => scale(d))
        .attr('x2', (d: NumberValue) => scale(d))
        .attr('y1', 0)
        .attr('y1', this.wrap.offsetHeight)
        .datum((d: any) => d);
    } else {
      columnSelection
        .attr('height', bandHeight)
        .attr('width', this.wrap.offsetWidth)
        .attr(
          'transform',
          (d: NumberValue) => `translate(0, ${(scale(d) ?? 0) - bandHeight})`
        )
        .datum((d: any) => d)
        .attr('fill', 'transparent');

      lineSelection
        .attr('x1', 0)
        .attr('x2', this.wrap.offsetWidth)
        .attr('y1', (d: NumberValue) => scale(d))
        .attr('y1', (d: NumberValue) => scale(d))
        .datum((d: any) => d)
        .attr('id', (_: NumberValue, i: number) => `${i}`);
    }

    if (this.tooltip) {
      columnSelection
        .on('mouseenter', () =>
          this.onColumnMouseEnter(d3?.event?.target as HTMLElement)
        )
        .on('mouseleave', () =>
          this.onColumnMouseLeave(d3?.event?.target as HTMLElement)
        );
    }
  }

  private drawBackground() {

    d3.select(this.wrap.canvas)
    .append('rect')
    .attr('width', this.wrap.offsetWidth)
    .attr('height', this.wrap.offsetHeight)
    .attr('class', 'tlui-chart-background');

    if (this.typeTooltip === 'line') {
      const domain = this.layersList.first.getDomain();
      const scale = this.scales.get('x') as TluiChartScale;
      const width = scale(domain[domain.length - 1]);

      d3.select(this.wrap.canvas)
        .append('rect')
        .attr('height', this.wrap.offsetHeight)
        .attr('width', `${width}`)
        .attr('class', 'tlui-chart-active-background')
        .attr('fill', 'red');
    }
  }

  private onColumnMouseEnter(element: HTMLElement) {
    if (this.typeTooltip === 'line') {
      this.highlighted
        .select(`#data-line-${element.id}`)
        .attr('class', 'tlui-chart-data-line--highlighted');
    }

    if (this._tooltip) {
      const value = d3.select(element).datum();

      this._tooltip.data = this.layersList.map((layer) => {
        return layer.getTooltipData(value);
      });

      const primaryAxis = this.axesList.find((axis) => axis.primary);
      if (!primaryAxis) {
        return;
      }

      if (primaryAxis.type === 'time') {
        this._tooltip.title =
          new Date(value as Date).toLocaleString('ru-RU') +
          ' .' +
          new Date(value as Date).getMilliseconds();
      } else {
        this._tooltip.title = this.options[Number(value)] ?? String(value);
      }
    }
  }

  private onColumnMouseLeave(element: HTMLElement) {
    const value = d3.select(element).datum();
    if (this.typeTooltip === 'line') {
      this.highlighted
        .select(`#data-line-${element.id}`)
        .attr('class', 'tlui-chart-data-line');
    }
  }

  private onGraphMouseEnter(event: PointerEvent) {
    this.createTooltip();
  }

  private onGraphMouseMove(event: PointerEvent) {
    if (this._tooltip) {
      if (event.offsetX / this.wrap.width > 0.5) {
        this._tooltip.xr = this.wrap.width - event.offsetX + 15;
        this._tooltip.x = null;
        this._tooltip.y = event.offsetY;
      } else {
        this._tooltip.x = event.offsetX;
        this._tooltip.xr = null;
        this._tooltip.y = event.offsetY;
      }
    }
    this.changeDetector.markForCheck();
  }

  private onGraphMouseLeave(event: PointerEvent) {
    this.destroyTooltip();
  }

  private getEnumAxisDomain(axis: TluiAxisDirective<string>): string[] {
    if (axis.enum) {
      return axis.enum;
    }

    let values = new Set<string>([]);
    for (const layer of this.layersList) {
      if (axis.primary) {
        values = new Set<string>(layer.getDomain());
      } else if (layer.axis === axis.name) {
        values = new Set<string>(layer.getRange());
      }
    }
    return Array.from(values);
  }

  private getNumberAxisDomain(
    axis: TluiAxisDirective<number>
  ): [number, number] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const layer of this.layersList) {
      let values: number[] = [];
      if (axis.primary) {
        values = layer.getDomain();
      } else if (layer.axis === axis.name) {
        values = layer.getRange();
      }
      min = Math.min(min, ...values);
      max = Math.max(max, ...values);
    }

    return [axis.min ?? min, axis.max ?? max];
  }

  private getTimeAxisDomain(axis: TluiAxisDirective<Date>): [Date, Date] {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;

    for (const layer of this.layersList) {
      let values: number[] = [];
      if (axis.primary) {
        values = layer.getDomain().map((d) => +d);
      } else if (layer.axis === axis.name) {
        values = layer.getRange().map((d) => +d);
      }

      min = Math.min(min, ...values);
      max = Math.max(max, ...values);
    }

    return [axis.min ?? new Date(min), axis.max ?? new Date(max)];
  }

  private createTooltip() {
    const componentFactory =
      this.componentFactoryResolver.resolveComponentFactory(
        TluiTooltipComponent
      );
    this._tooltip =
      this.tooltipViewContainer.createComponent(componentFactory).instance;
  }

  private destroyTooltip() {
    this.tooltipViewContainer.clear();
    this._tooltip = null;
  }
}
