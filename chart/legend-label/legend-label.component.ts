import { ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { fromEvent, merge, of, Subject } from 'rxjs';
import { delay, switchMap, takeUntil, tap } from 'rxjs/operators';

import { TluiLegendLabelOption } from '../interfaces';

@Component({
  selector: 'tlui-legend-label',
  templateUrl: './legend-label.component.html',
  styleUrls: ['./legend-label.component.scss'],
})
export class TluiLegendLabelComponent {
  @Input()
  title!: string;

  @Input()
  color!: string;

  @Input()
  type!: 'line' | 'dashed-line' | 'bar';

  @Input()
  inactive: boolean = false;

  @Input()
  options: TluiLegendLabelOption[] = [];

  @Output()
  inactiveChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output()
  optionSelectionChange: EventEmitter<TluiLegendLabelOption> =
    new EventEmitter<TluiLegendLabelOption>();

  readonly positions: ConnectedPosition[] = [
    {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    },
    {
      originX: 'start',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'bottom',
    },
    {
      originX: 'end',
      originY: 'bottom',
      overlayX: 'end',
      overlayY: 'top',
    },
    {
      originX: 'end',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    },
  ];

  isOpened: boolean = false;

  readonly popupEnter$ = new Subject<void>();
  readonly leave$ = new Subject<void>();

  readonly stream$ = merge(
    this.leave$.pipe(
      switchMap(() => of(true).pipe(delay(1000), takeUntil(this.popupEnter$))),
      tap(() => this.onMouseLeave())
    ),
    fromEvent(this.elementRef.nativeElement, 'mouseleave').pipe(
      tap(() => this.leave$.next())
    ),
    fromEvent(this.elementRef.nativeElement, 'mouseenter').pipe(
      tap(() => this.onMouseEnter())
    )
  );

  constructor(
    private readonly elementRef: ElementRef,
    private changeDetector: ChangeDetectorRef
  ) {}

  onOptionToggle(selected: boolean, option: TluiLegendLabelOption): void {
    option.selected = selected;
    this.optionSelectionChange.emit(option);
  }

  onMouseEnter(): void {
    if (!this.inactive && this.options.length) {
      this.isOpened = true;
      this.changeDetector.detectChanges();
    }
  }

  onMouseLeave(): void {
    if (!this.inactive && this.options.length) {
      this.isOpened = false;
      this.changeDetector.detectChanges();
    }
  }
}
