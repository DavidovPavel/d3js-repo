import { Directive, Input } from '@angular/core';

@Directive({
  selector: 'tlui-axis-lines',
  exportAs: 'tluiAxisLines',
})
export class TluiAxisLinesDirective {
  @Input()
  axis!: string;
}
