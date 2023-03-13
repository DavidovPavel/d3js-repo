import * as d3 from 'd3';

import { visualBoundCharts } from '../model';

// Внутренний и внешний радиус
export const K = {
    bg: { out: 0.8 },
    label: { in: 0.84, out: 0.88 },
    pie: { in: 0.64, out: 0.76 },
    mark: { in: 0.62, out: 0.78 }, // засечки
    point: { in: 0.5, out: 0.6 }, // стрелка
};

export const DISPLAY_ANGLE = 0.75;
export const WORK_AREA_DEG = 180;
export const POINT_RD = 0.15; // стрелка рад.
export const MARK_RD = 0.015;

export const getChartData = (source: visualBoundCharts[], fact: number, deviation: number): visualBoundCharts[] =>
    source
        .reduce(
            (p, c) => [
                ...p,
                p.find((a) => a.isActive) ? c : { ...c, isActive: c.value > fact && fact + deviation > 0 },
            ],
            []
        )

        .map((a) => ({ ...a, label: a.value }));

export const cloneDataForPoint = (source: visualBoundCharts[], charts: visualBoundCharts[]) => {
    const [, ...dma] = source.reduce<visualBoundCharts[]>(
        (p, c, i, a) => [...p, { ...c, value: a[i].value - a[i - 1]?.value ?? 0 }],
        []
    );

    const value = d3.min(dma.map((a) => a.value));
    const [first, ...other] = charts;

    return [{ ...first, value }, ...other.map((a, i) => ({ ...a, value: dma[i].value }))];
};

const divideIntoTwo = (c: visualBoundCharts, deviation: number, fact: number) =>
    deviation > 0
        ? [
              { ...c, label: fact, value: deviation, isFact: true },
              { ...c, value: c.label - fact },
          ]
        : deviation === 0
        ? [
              { ...c, label: fact, value: c.value - (c.label - fact), isFact: true },
              { ...c, value: c.label - fact },
          ]
        : [
              { ...c, label: fact, value: c.label - fact, isFact: true },
              { ...c, value: c.value + deviation },
          ];

export const genDataForPoint = (source: visualBoundCharts[], deviation: number, fact: number): visualBoundCharts[] =>
    source.reduce((p, c) => [...p, ...(c.isActive ? divideIntoTwo(c, deviation, fact) : [c])], []);

export const getPie = () =>
    d3
        .pie()
        .sort(null)
        .value(({ value }) => value)
        .startAngle(-DISPLAY_ANGLE * Math.PI)
        .endAngle(DISPLAY_ANGLE * Math.PI);

export const getArc = (ri: number, ro: number) => d3.arc().innerRadius(ri).outerRadius(ro);

export const getMark = (ng: number, R: number) =>
    d3.arc()({
        startAngle: ng,
        endAngle: ng + MARK_RD,
        innerRadius: R * K.mark.in,
        outerRadius: R * K.mark.out,
    });

export const getArcPoint = (start: number, ri: number, ro: number) => {
    return getArc(ri, ro)
        .startAngle(start * Math.PI)
        .endAngle((Math.abs(start) + POINT_RD) * Math.PI * (start < 0 ? -1 : 1));
};

export const getArcMarkPoint = (start: number, ri: number, ro: number) => {
    return getArc(ri, ro)
        .startAngle(start * Math.PI)
        .endAngle((Math.abs(start) + 0.008) * Math.PI * (start < 0 ? -1 : 1));
};
