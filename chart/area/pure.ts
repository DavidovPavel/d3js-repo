import * as d3 from 'd3';

import { ru_RU } from '../local';

const locale = d3.timeFormatDefaultLocale(ru_RU);

export const notNul = <T>(a: T): 0 | NonNullable<T> => a ?? 0;
export const isNotNul = <T>(a: T): a is T => a !== null;

const extent = (data: (Date | number)[]) => {
  const [min, max] = d3.extent(data);
  return [notNul(min), notNul(max)];
};

export const scaleLinear = (data: number[], range: number[]) =>
  d3.scaleLinear().domain(extent(data)).range(range);

export const scaleTime = (data: Date[], range: number[]) =>
  d3.scaleUtc().domain(extent(data)).range(range);

export const yScale = (data: [number, number][], range: number[]) =>
  d3
    .scaleLinear()
    .domain([0, notNul(d3.max(data, ([, y]) => y))])
    .range(range);

export const xAxis = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.ScaleLinear<number, number> | d3.AxisScale<d3.NumberValue>, // Date[] & d3.ScaleTime<number, number>,
  ticks: number,
  height: number
) =>
  g
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(scale).ticks(ticks).tickSizeOuter(0));

export const xAxisTime = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: Date[] & d3.ScaleTime<number, number>,
  format: string,
  height: number,
  ticks = d3.timeHour.every(4)
) =>
  g
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(scale).ticks(ticks).tickFormat(locale.format(format)));

export const yAxis = (
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  scale: d3.ScaleLinear<number, number>,
  left: number,
  title: string,
  color = 'currentColor'
) =>
  g
    .attr('transform', `translate(${left},0)`)
    .call(d3.axisLeft(scale))
    .call((g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g.select('.domain').attr('stroke', color)
    )
    .call((g: d3.Selection<SVGGElement, unknown, null, undefined>) =>
      g
        .selectAll('.title')
        .data([title])
        .join('text')
        .attr('class', 'title')
        .attr('transform', `translate(-10,0)`)
        .attr('y', 10)
        .attr('fill', color)
        .attr('text-anchor', 'middle')
        .text(title)
    );

export const line = (
  xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>
): d3.Line<[number, number]> =>
  d3
    .line()
    .x((d: [number | Date, number]) => notNul(xScale(d[0])))
    .y(([, y]) => notNul(yScale(y)));

export const area = (
  xScale:
    | d3.ScaleLinear<number, number>
    | (d3.ScaleTime<number, number> & Date[]),
  yScale: d3.ScaleLinear<number, number>
) =>
  d3
    .area()
    .defined(([, y]) => !isNaN(y))
    .x((d: [number | Date, number]) => notNul(xScale(d[0])))
    .y0(notNul(yScale(0)))
    .y1(([, y]) => notNul(yScale(y)));
