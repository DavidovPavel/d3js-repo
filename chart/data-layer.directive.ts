import { Directive, Input, Self } from '@angular/core';

import {
  TluiChartData,
  TluiChartDataProvider,
  TluiChartDataRenderer,
  TluiChartRenderTarget,
  TluiLayerDrawContext,
  TluiLegendLabelData,
  TluiTooltipData,
} from './interfaces';

@Directive({
  selector: 'tlui-data-layer',
})
export class TluiDataLayerDirective<U, V> {
  private static nextId: number = 0;
  state: TluiChartData = [];

  readonly id: string = `tlui-chart-data-layer-${++TluiDataLayerDirective.nextId}`;

  @Input()
  axis: string = 'left';

  constructor(
    @Self() private readonly dataRenderer: TluiChartDataRenderer,
    @Self() private readonly dataProvider: TluiChartDataProvider<U, V>
  ) {}

  reRender(
    position: string,
    selected: boolean
  ): void {
    this.dataRenderer.state.set(Number(position), !selected);
    this.dataRenderer.reRender(this.id);
  }

  getDomain(): U[] {
    return this.dataProvider.getDomain();
  }

  getRange(): V[] {
    return this.dataProvider.getRange();
  }

  getTooltipData(value: U): TluiTooltipData {
    return this.dataProvider.getTooltipData(value);
  }

  getLegendData(): TluiLegendLabelData {
    return this.dataProvider.getLegendData();
  }

  draw(target: TluiChartRenderTarget, context: TluiLayerDrawContext) {
    this.dataRenderer.render(target, context, this.id);
  }

  getData(): TluiChartData {
    return this.dataProvider.getData();
  }
}
