import { Component, EventEmitter, Inject, Input, OnDestroy, Output, TemplateRef, ViewChild } from '@angular/core';

import { MENU_DEFAULT_OPTIONS, MENU_PANEL } from '../tokens';
import { MenuCloseReason, MenuDefaultOptions, MenuPositionX, MenuPositionY } from '../models';
import { menuAnimations } from '../menu-animation';

@Component({
  selector: 'tlui-menu',
  exportAs: 'tluiMenu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  providers: [{ provide: MENU_PANEL, useExisting: TluiMenuComponent }],
  animations: [menuAnimations.transformMenu]
})
export class TluiMenuComponent implements OnDestroy {
  private _xPosition = this.defaultOptions.xPosition;
  private _yPosition = this.defaultOptions.yPosition;

  panelAnimationState: 'void' | 'enter' = 'void';

  @Input()
  get xPosition(): MenuPositionX {
    return this._xPosition;
  }
  set xPosition(value: MenuPositionX) {
    this._xPosition = value;
  }

  @Input()
  get yPosition(): MenuPositionY {
    return this._yPosition;
  }
  set yPosition(value: MenuPositionY) {
    this._yPosition = value;
  }

  @Output() readonly close = new EventEmitter<MenuCloseReason>();

  @ViewChild(TemplateRef) templateRef!: TemplateRef<any>;

  constructor(
    @Inject(MENU_DEFAULT_OPTIONS) private defaultOptions: MenuDefaultOptions
  ) {}

  startAnimation(): void {
    this.panelAnimationState = 'enter';
  }

  resetAnimation(): void {
    this.panelAnimationState = 'void';
  }

  ngOnDestroy() {
    this.close.complete();
  }
}
