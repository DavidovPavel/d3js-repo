import { ChangeDetectionStrategy, Component, ElementRef, Input } from '@angular/core';
import * as d3 from 'd3';

import { ArcData, PieVisualData } from '../model';
import { visualBoundCharts } from './../model';
import {
    cloneDataForPoint,
    DISPLAY_ANGLE,
    genDataForPoint,
    getArc,
    getArcMarkPoint,
    getArcPoint,
    getChartData,
    getMark,
    getPie,
    K,
    WORK_AREA_DEG,
} from './pure';

export const PADDING = 20;

@Component({
    selector: 'tl-chart-pie',
    template: '',
    styleUrls: ['./chart-pie.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartPieComponent {
    @Input() width: number;
    @Input() height: number;
    @Input() set data(value: PieVisualData) {
        if (value) {
            this.draw(value);
        }
    }

    constructor(private el: ElementRef) {}

    draw(data: PieVisualData): void {
        const container = this.el.nativeElement as HTMLElement;
        d3.select(container).selectAll('*').remove();

        const width = this.width;
        const height = this.height;
        const R = d3.min([width, height]) / 2 - PADDING;

        const svg = d3
            .select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto;');

        // Фон
        const bg = d3.arc()({ startAngle: 0, endAngle: 2 * Math.PI, innerRadius: 0, outerRadius: R * K.bg.out });
        svg.append('g').attr('class', 'bg').append('path').attr('d', bg);

        // Название
        svg.append('text')
            .attr('class', 'title')
            .attr('transform', `translate(0, -${R + 8})`)
            .attr('text-anchor', 'middle')
            .text(data.name);

        // Единицы измерения
        const engUnitsArc = d3
            .arc()
            .startAngle(DISPLAY_ANGLE * Math.PI)
            .endAngle(1.25 * Math.PI)
            .innerRadius(R * K.pie.in * 0.75)
            .outerRadius(R * K.pie.out);

        svg.append('text')
            .attr('transform', `translate(${engUnitsArc.centroid()})`)
            .attr('class', 'eng-units')
            .text(data.engUnits);

        // Fact
        svg.append('text')
            .attr('class', 'fact')
            .style('font-size', R * 0.26)
            .text(data.fact);

        // Deviation
        svg.append('text')
            .attr('class', `deviation ${this.deviationColor(data.deviation)}`)
            .attr('transform', `translate(0, ${R * 0.26})`)
            .style('font-size', R * 0.18)
            .text(this.format(data.deviation.toFixed(1)));

        // Pie
        const { fact, deviation, visualBoundCharts: source, zeroOn } = data;

        const charts = getChartData(source, fact, deviation);
        const clone = cloneDataForPoint(source, charts);
        const duble = genDataForPoint(clone, deviation, fact);

        const pie = getPie();
        const pie2 = getPie();
        const arcData = pie(zeroOn === 'right' ? clone.reverse() : clone);
        const arcData2 = pie2(zeroOn === 'right' ? duble.reverse() : duble);
        const pieArc = getArc(R * K.pie.in, R * K.pie.out);
        const pieArc2 = getArc(R * K.pie.in, R * K.pie.out);

        // Угол для определения положения стрелки
        let factAngle = 0;

        const factSegment = duble.find((a) => a.isFact);

        svg.append('g')
            .attr('class', 'pie')
            .selectAll('path')
            .data(arcData)
            .join('path')
            .attr('fill', ({ data }) => data.color)
            .attr('class', 'blur') // (d: ArcData) => (d.data.isActive ? '' : 'blur'))
            .style('stroke-width', 0)
            .attr('d', pieArc);

        svg.append('g')
            .attr('class', 'pie2')
            .selectAll('path')
            .data(arcData2)
            .join('path')
            .style('fill', ({ data }) => data.color)
            .style('opacity', (d: ArcData) => (d.data.isFact ? '1' : '0'))
            .style('stroke-width', '0')
            .attr('d', pieArc2)
            .attr('class', (d: ArcData, i: number) => {
                if (!factSegment) {
                    if (
                        fact + deviation > d3.max(source, ({ value }) => value) &&
                        i === (zeroOn === 'left' ? source.length - 1 : 0)
                    ) {
                        factAngle = zeroOn === 'left' ? d.endAngle : d.startAngle;
                    }

                    if (fact + deviation < 0 && i === (zeroOn === 'left' ? 0 : source.length - 1)) {
                        factAngle = zeroOn === 'left' ? d.startAngle : d.endAngle;
                    }
                }

                if (d.data.isFact) {
                    factAngle = zeroOn === 'left' ? d.endAngle : d.startAngle;
                    return 'fact';
                }
            });

        // Засечки
        svg.append('g')
            .selectAll('path')
            .data(arcData)
            .join('path')
            .attr('fill', ({ data }) => data.color)
            .style('stroke-width', 0)
            .attr('d', (d: ArcData) => getMark(zeroOn === 'left' ? d.endAngle : d.startAngle, R));

        // Вывод значений
        svg.append('g')
            .selectAll('labels')
            .data(arcData)
            .enter()
            .append('text')
            .attr('transform', (d: ArcData) => {
                const ng = zeroOn === 'left' ? d.endAngle : d.startAngle;
                const a = getArc(R * K.label.in, R * K.label.out)
                    .startAngle(ng)
                    .endAngle(ng);
                return `translate(${a.centroid(d)})`;
            })
            .attr('text-anchor', (d: ArcData) =>
                (zeroOn === 'left' ? d.endAngle : d.startAngle) < 0 ? 'end' : 'initial'
            )
            .attr('class', 'label')
            .text(({ data }) => data.label);

        // Стрелка
        const gradient = svg
            .append('defs')
            .append('linearGradient')
            .attr('id', 'gradient')
            .attr('x1', '0%')
            .attr('x2', '0%')
            .attr('y1', '0%')
            .attr('y2', '100%')
            .attr('spreadMethod', 'pad');

        gradient.append('svg:stop').attr('offset', '0').attr('class', 'gradient-start');
        gradient.append('svg:stop').attr('offset', '1').attr('class', 'gradient-end');

        const AXIS_DEVIATION = 45;

        // console.log(factAngle);

        if (factAngle === 0) {
            console.warn('Не найден угол для стрелки!');
        }

        const position = (start: number, ng: number) => {
            const arc = getArcPoint(start, R * K.point.in, R * K.point.out);
            svg.append('g')
                .append('path')
                .attr('fill', 'url(#gradient)')
                .attr('d', arc)
                .transition()
                .delay(100)
                .attr('transform', `rotate(${ng})`);

            const marc = getArcMarkPoint(start, R * K.point.in, R * K.point.out);
            svg.append('g')
                .append('path')
                .attr('class', 'mark')
                .attr('d', marc)
                .transition()
                .delay(100)
                .attr('transform', `rotate(${ng})`);
        };

        const deg = (factAngle * WORK_AREA_DEG) / Math.PI;
        const dl = WORK_AREA_DEG - AXIS_DEVIATION;
        if (zeroOn === 'left') {
            const dx = deg + dl;
            const start = dx <= WORK_AREA_DEG ? -DISPLAY_ANGLE : -DISPLAY_ANGLE + (dx - WORK_AREA_DEG) / WORK_AREA_DEG;
            const ng = dx <= WORK_AREA_DEG ? dx : WORK_AREA_DEG;
            position(start, ng);
        } else {
            const dx = deg - dl;
            const start = dx >= -WORK_AREA_DEG ? DISPLAY_ANGLE : DISPLAY_ANGLE + (dx + WORK_AREA_DEG) / WORK_AREA_DEG;
            const ng = dx >= -WORK_AREA_DEG ? dx : -WORK_AREA_DEG;
            position(start, ng);
        }
    }

    format(val: string): string {
        const [a, b] = String(val).split('.');
        return b === '0' ? a : val;
    }

    deviationColor(val: number): string {
        return val < 0 ? 'yellow' : val === 0 ? 'grey' : 'green';
    }
}
