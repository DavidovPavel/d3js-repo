import { ChangeDetectionStrategy, Component, ElementRef, HostListener, Inject, OnInit } from '@angular/core';
import { UNIQUE_ID, WIDGET_ID, WidgetPlatform, WidgetService } from '@tl-platform/core';
import { delay, startWith, Subject } from 'rxjs';

import { PADDING } from './chart-pie/chart-pie.component';
import { PieVisualData, RawFeed } from './model';

const WIDGET_HEADER = 54;

@Component({
    selector: 'tl-gauge-chart',
    templateUrl: './gauge-chart.component.html',
    styleUrls: ['./gauge-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaugeChartComponent extends WidgetPlatform<unknown> implements OnInit {
    get width(): number {
        const el = this.el.nativeElement;
        return el.offsetWidth;
    }

    get height(): number {
        const el = this.el.nativeElement;
        return el.offsetHeight - WIDGET_HEADER - PADDING;
    }

    data: PieVisualData[] | null = null;

    private current$$ = new Subject();
    public current$ = this.current$$.asObservable().pipe(startWith(null), delay(0));

    constructor(
        public widgetService: WidgetService,
        @Inject(WIDGET_ID) public id: string,
        @Inject(UNIQUE_ID) public uniqId: string,
        private el: ElementRef
    ) {
        super(widgetService, id, uniqId);
    }

    @HostListener('document:resize', ['$event'])
    public OnResize(): void {
        this.current$$.next(null);
        this.current$$.next(this.data);
    }

    ngOnInit(): void {
        super.widgetInit();
    }

    protected dataHandler(ref: RawFeed): void {
        console.log(ref);
        const { visualPieCharts, title } = ref;
        this.data = visualPieCharts;
        this.widgetTitle = title;
        this.OnResize();
    }

    protected dataConnect(): void {
        super.dataConnect();
    }

    trackBy(i: number): number {
        return i;
    }
}
