import { OverlayModule } from '@angular/cdk/overlay';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TluiMenuItemComponent } from './menu-item.component';
import { TluiMenuTriggerDirective } from './menu-trigger.directive';
import { TluiMenuComponent } from './menu-panel/menu.component';
import { MENU_SCROLL_STRATEGY_FACTORY_PROVIDER } from './tokens';

@NgModule({
  declarations: [
    TluiMenuComponent,
    TluiMenuItemComponent,
    TluiMenuTriggerDirective,
  ],
  imports: [CommonModule, OverlayModule, ScrollingModule],
  exports: [TluiMenuComponent, TluiMenuItemComponent, TluiMenuTriggerDirective],
  providers: [MENU_SCROLL_STRATEGY_FACTORY_PROVIDER],
})
export class TluiMenuModule {}
