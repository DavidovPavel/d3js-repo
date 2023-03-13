import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';

import {
  area,
  notNul,
  scaleLinear,
  scaleTime,
  xAxis,
  xAxisTime,
  yAxis,
} from './pure';

// d3.curveMonotoneX
// d3.curveStep
// d3.curveBasis
// d3.curveNatural

/**
 * https://observablehq.com/d/5e0de42b1a19549f
 */

export interface Line {
  type: string;
  color: string;
  engUnits: string;
  curve: string;
  yScale?: d3.ScaleLinear<number, number>;
  path?: d3.Selection<
    SVGPathElement,
    [number | Date, number][],
    null,
    undefined
  >;
  gy?: d3.Selection<SVGGElement, unknown, null, undefined>;
  margin?: number;
  data: [number | Date, number][];
}
@Component({
  selector: 'tlui-area',
  template: '',
  styleUrls: ['./area.component.scss'],
})
export class TluiAreaComponent implements OnInit {
  @Input()
  margin = { top: 20, right: 20, bottom: 30, left: 40 };

  @Input()
  height = 440;

  @Input()
  width = 600;

  @Input()
  data: Line[] = [];

  xScale!: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>;
  ySc!: d3.ScaleLinear<number, number>;

  gx!: d3.Selection<SVGGElement, unknown, null, undefined>;
  gxDay!: d3.Selection<SVGGElement, unknown, null, undefined>;

  @Input() set focus(value: (number | Date)[]) {
    if (value) {
      this.data.forEach((line) => this.update(value, line));
    }
  }

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const container = this.el.nativeElement as HTMLElement;
    d3.select(container).selectAll('*').remove();

    const { data, width, height, margin } = this;

    const isNumber = typeof data[0].data[0][0] === 'number';

    const svg = d3
      .select(container)
      .append('svg')
      .attr('viewBox', [0, 0, width, height] as any)
      .style('display', 'block');

    const clipId = 'clip' + Date.now();

    svg
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('height', height - margin.bottom)
      .attr('width', width - margin.left - margin.right);

    this.gx = svg.append('g');
    this.gxDay = svg.append('g');

    const ml = this.margin.left;
    this.data.forEach((line, i) => {
      this.margin.left = ml * i + ml;
      line.margin = this.margin.left;

      line.gy = svg.append('g');

      line.path = svg
        .append('path')
        .datum(line.data)
        .attr(
          'clip-path',
          `url(${new URL(`#${clipId}`, window.location.href)})`
        )
        .attr('fill', line.type === 'line' ? 'transparent' : 'steelblue')
        .style('opacity', line.type === 'line' ? 1 : 0.4)
        .attr('stroke', line.color);

      line.yScale = scaleLinear(
        line.data.map(([, y]) => y),
        [height - margin.bottom, margin.top]
      );
    });

    this.xScale = isNumber
      ? scaleLinear(
          data[0].data.map(([x]) => Number(x)),
          [margin.left, width - margin.right]
        )
      : scaleTime(
          data[0].data.map(([x]) => x as Date),
          [margin.left, width - margin.right]
        );

    // init without smart-scroll
    this.data.forEach((line) => this.update(this.xScale.range(), line));
  }

  update(value: (number | Date)[], line: Line): void {
    const isNumber = typeof this.data[0].data[0][0] === 'number';
    if (line.yScale && line.gy && line.path) {
      const xs = this.xScale.copy().domain(value);

      if (isNumber) {
        this.gx.call(
          xAxis,
          xs,
          this.width / 80,
          this.height - this.margin.bottom
        );
      } else {
        this.gx
          .call(xAxisTime, xs, '%H:%M', this.height - this.margin.bottom)
          .call((g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
            g.selectAll('.tick>text').attr('class', 'label');
          });

        this.gxDay
          .call(
            xAxisTime,
            xs,
            '%x',
            this.height - this.margin.bottom + 12,
            d3.timeDay.every(1)
          )
          .call((g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
            g.select('.domain').remove();
            g.selectAll('.tick>text').attr('class', 'label-day');
          });
      }

      const [minX, maxX] = value;

      const maxY = d3.max(line.data, ([x, y]) =>
        minX <= x && x <= maxX ? y : NaN
      );

      const e = d3.extent(line.data, ([, y]) => y);
      const ys = line.yScale.copy().domain([notNul(e[0]), notNul(maxY)]);

      line.gy
        .call(yAxis, ys, line.margin, line.engUnits, line.color)
        .call((g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
          g.selectAll('.tick>text').attr('class', 'label');
        });

      line.path.attr(
        'd',
        area(xs as any, ys).curve((d3 as any)[line.curve]) as any
      );
    }
  }
}
