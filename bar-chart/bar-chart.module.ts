import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { WidgetHeaderNewModule } from '@shared/modules/widget-header-new/widget-header.module';
import { SharedModule } from '@shared/shared.module';
import { TluiChartModule, TluiSpinnerModule } from '@tl-platform/ui';

import { BarChartComponent } from './bar-chart.component';
import { StreamPipe } from './stream.pipe';

@NgModule({
    declarations: [BarChartComponent, StreamPipe],
    imports: [CommonModule, SharedModule, WidgetHeaderNewModule, TluiChartModule, TluiSpinnerModule],
})
export class BarChartModule {
    enterComponent = BarChartComponent;
}
