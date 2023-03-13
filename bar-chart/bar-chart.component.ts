import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    HostListener,
    Inject,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
import { UNIQUE_ID, WIDGET_ID, WidgetPlatform, WidgetService } from '@tl-platform/core';
import { delay, Subject } from 'rxjs';

import { chartViewType, RawFeed } from './model';

const WIDGET_HEADER = 54;
const LEGEND_HEIGHT = 60;
const PADDING = 20;

@Component({
    selector: 'tl-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartComponent extends WidgetPlatform<unknown> implements OnInit {
    public data = [0, [0, 0, 0]];
    public template: chartViewType;

    hidden: { position: number; isHidden: boolean }[] = [];

    private current$$ = new Subject();
    public current$ = this.current$$.asObservable().pipe(delay(0));

    @ViewChild('curveMonotoneX') curveMonotoneX: TemplateRef<any>;
    @ViewChild('curveLinear') curveLinear: TemplateRef<any>;
    @ViewChild('curveStepAfter') curveStepAfter: TemplateRef<any>;

    @HostListener('document:resize', ['$event'])
    public OnResize(): void {
        this.reDraw();
    }

    get width(): number {
        const el = this.el.nativeElement.querySelector('div.container');
        return el.offsetWidth - PADDING;
    }

    get height(): number {
        const el = this.el.nativeElement.querySelector('div.container');
        return el.offsetHeight - WIDGET_HEADER - LEGEND_HEIGHT;
    }

    constructor(
        public widgetService: WidgetService,
        @Inject(WIDGET_ID) public id: string,
        @Inject(UNIQUE_ID) public uniqId: string,
        private el: ElementRef
    ) {
        super(widgetService, id, uniqId);
    }

    public ngOnInit(): void {
        super.widgetInit();
    }

    private reDraw(): void {
        this.current$$.next(null);
        this.current$$.next(this.template);
    }

    protected dataHandler(ref: RawFeed): void {
        const { chartView, visualBarCharts, title } = ref;
        this.widgetTitle = title;
        this.template = chartView;
        this.data = visualBarCharts.reduce((p, { fact, plan, predict }, i) => [...p, [i, [fact, plan, predict]]], []);
        this.reDraw();
    }

    protected dataConnect(): void {
        super.dataConnect();
    }
}
