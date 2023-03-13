import { Directive, Input } from '@angular/core';

import { TluiChartAxisPosition, TluiChartAxisType } from './interfaces';

@Directive({
  selector: 'tlui-axis',
  exportAs: 'tluiAxis'
})
export class TluiAxisDirective<T> {
  @Input()
  type: TluiChartAxisType = 'number';

  @Input()
  position!: TluiChartAxisPosition;

  @Input()
  min!: T;

  @Input()
  max!: T;

  @Input()
  ticks!: number;

  @Input()
  enum!: T[];

  @Input()
  name!: string;

  @Input()
  primary: boolean = false;
}
