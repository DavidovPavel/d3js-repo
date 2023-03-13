import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import * as d3 from 'd3';

import { line, scaleLinear } from '../area/pure';
import { scaleTime } from './../area/pure';

const SMART_SCROLL_HEIGHT = 44;
const PADDING = 8;

@Directive({
  selector: 'tlui-smart-scroll',
})
export class TluiSmartScrollDirective {
  get width(): number {
    return this.el.nativeElement.offsetWidth;
  }

  get height(): number {
    return SMART_SCROLL_HEIGHT;
  }

  id = 'tlui-smart-scroll_' + Date.now();
  domain: number[] = [];

  @Input() margin = {
    top: 10,
    right: 20,
    bottom: 10,
    left: 40,
  };

  @Input() set data(value: [number | Date, number][]) {
    if (value) {
      this.points = value;
      if (!this.svg) {
        this.init();
      }
    }
  }

  @Output() scroll = new EventEmitter<(number | Date)[]>();

  points: [number | Date, number][] = [];
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  constructor(private el: ElementRef<HTMLElement>) {}

  init(): void {


    const container = this.el.nativeElement as HTMLDivElement;
    const margin = this.margin;
    const height = this.height;

    const isNumber = typeof this.points[0][0] === 'number';

    const xSc = isNumber
      ? scaleLinear(
          this.points.map(([x]) => Number(x)),
          [margin.left, this.width - margin.right]
        )
      : scaleTime(
          this.points.map(([x]) => x as Date),
          [margin.left, this.width - margin.right]
        );

    const ySc = scaleLinear(
      this.points.map(([, y]) => y),
      [height, margin.top]
    );

    const defaultSelection = xSc.range();

    this.svg = d3
      .select(container)
      .append('svg')
      .attr('id', this.id)
      .attr('height', this.height + margin.bottom)
      .attr('width', '100%')
      .attr('viewBox', [0, 0, this.width, this.height + margin.bottom] as any)
      .style('display', 'block');

    const a = xSc.copy();
    const b = ySc.copy().range([height - PADDING, PADDING]);

    this.svg
      .append('path')
      .datum(this.points)
      .attr('class', 'prev-line')
      .attr('d', line(a, b).curve(d3.curveMonotoneX) as any);

    const gb = this.svg.append('g');

    const emitter = this.scroll;

    const brush = d3
      .brushX()
      .extent([
        [margin.left, 0.5],
        [this.width - margin.right, height + 0.5],
      ])
      .on('brush', function () {
        const selection = (this as any).__brush.selection as [number, number][];
        if (selection) {
          const value = selection.map(([x]) => xSc.invert(x), xSc); //.map(d3.utcDay.round);
          emitter.emit(value);
        }
      })
      .on('end', function brushended() {
        const selection = (this as any).__brush.selection;
        if (!selection) {
          gb.call(brush.move, defaultSelection);
        }
      });

    gb.call(brush).call(brush.move, defaultSelection);
  }
}
