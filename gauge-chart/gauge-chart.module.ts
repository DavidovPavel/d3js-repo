import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetHeaderNewModule } from '@shared/modules/widget-header-new/widget-header.module';
import { SharedModule } from '@shared/shared.module';
import { TluiSpinnerModule } from '@tl-platform/ui';

import { ChartPieComponent } from './chart-pie/chart-pie.component';
import { GaugeChartComponent } from './gauge-chart.component';

@NgModule({
    declarations: [GaugeChartComponent, ChartPieComponent],
    imports: [CommonModule, SharedModule, WidgetHeaderNewModule, TluiSpinnerModule],
})
export class GaugeChartModule {
    enterComponent = GaugeChartComponent;
}
