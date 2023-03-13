import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TluiCheckboxModule } from '@tl-platform/ui/components/checkbox';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TluiAreaComponent } from './area/area.component';
import { TluiAxisLinesDirective } from './axis-lines.directive';
import { TluiAxisDirective } from './axis.directive';
import { TluiBarsDirective } from './bars/bars.directive';
import { TluiFullStackedBarsDirective } from './bars/full-stacked-bars.directive';
import { TluiStackedBarsDirective } from './bars/stacked-bars.directive';
import { TluiChartWrapperDirective } from './chart/chart-wrapper.directive';
import { TluiChartComponent } from './chart/chart.component';
import { TLUI_CHART_COLORS_LIST } from './constants';
import { TluiDataLayerDirective } from './data-layer.directive';
import { TLUI_CHART_PALETTE } from './injection-tokens';
import { TluiLegendLabelComponent } from './legend-label/legend-label.component';
import { TluiLineDirective } from './line/line.directive';
import { TluiSmartScrollComponent } from './smart-scroll/smart-scroll.component';
import { TluiSmartScrollDirective } from './smart-scroll/smart-scroll.directive';
import { TluiTooltipComponent } from './tooltip/tooltip.component';

@NgModule({
  declarations: [
    TluiChartComponent,
    TluiLegendLabelComponent,
    TluiAxisDirective,
    TluiAxisLinesDirective,
    TluiDataLayerDirective,
    TluiTooltipComponent,
    TluiBarsDirective,
    TluiStackedBarsDirective,
    TluiFullStackedBarsDirective,
    TluiLineDirective,
    TluiAreaComponent,
    TluiChartWrapperDirective,
    TluiSmartScrollComponent,
    TluiSmartScrollDirective,
  ],
  imports: [
    CommonModule,
    AngularSvgIconModule,
    HttpClientModule,
    TluiCheckboxModule,
    OverlayModule,
    FormsModule,
  ],
  providers: [
    { provide: TLUI_CHART_PALETTE, useValue: TLUI_CHART_COLORS_LIST },
  ],
  exports: [
    TluiChartComponent,
    TluiAxisDirective,
    TluiAxisLinesDirective,
    TluiDataLayerDirective,
    TluiBarsDirective,
    TluiStackedBarsDirective,
    TluiFullStackedBarsDirective,
    TluiLineDirective,
    TluiAreaComponent,
    TluiChartWrapperDirective,
    TluiSmartScrollComponent,
    TluiSmartScrollDirective,
  ],
})
export class TluiChartModule {}
