import { Component, HostBinding, Input } from '@angular/core';

import {
  state,
  trigger,
  style,
  transition,
  animate,
} from '@angular/animations';

import { TluiTooltipData } from '../interfaces';

@Component({
  selector: 'tlui-chart-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss'],
  animations: [
    trigger('popup', [
      state('void', style({ opacity: 0 })),
      state('enter', style({ opacity: 1 })),
      transition('* => *', animate('200ms cubic-bezier(0.25, 0.8, 0.25, 1)')),
    ]),
  ],
})
export class TluiTooltipComponent {
  @HostBinding('@popup') private readonly popup = true;

  @Input()
  title!: string;

  @Input()
  data: TluiTooltipData[] = [];

  @HostBinding('style.left.px')
  @Input()
  x: number | null = 0;

  @HostBinding('style.right.px')
  @Input()
  xr: number | null = null;

  @HostBinding('style.top.px')
  @Input()
  y: number = 0;
}
