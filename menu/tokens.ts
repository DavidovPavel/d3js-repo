import { Overlay, ScrollStrategy } from '@angular/cdk/overlay';
import { InjectionToken } from '@angular/core';

import { MenuDefaultOptions, MenuPanel } from './models';


export const MENU_SCROLL_STRATEGY = new InjectionToken<() => ScrollStrategy>(
  'menu-scroll-strategy'
);

export function MENU_SCROLL_STRATEGY_FACTORY(
  overlay: Overlay
): () => ScrollStrategy {
  return () => overlay.scrollStrategies.reposition();
}

export const MENU_SCROLL_STRATEGY_FACTORY_PROVIDER = {
  provide: MENU_SCROLL_STRATEGY,
  deps: [Overlay],
  useFactory: MENU_SCROLL_STRATEGY_FACTORY,
};

export const MENU_DEFAULT_OPTIONS = new InjectionToken<MenuDefaultOptions>(
  'mat-menu-default-options',
  {
    providedIn: 'root',
    factory: MENU_DEFAULT_OPTIONS_FACTORY,
  }
);

export function MENU_DEFAULT_OPTIONS_FACTORY(): MenuDefaultOptions {
  return {
    overlapTrigger: false,
    xPosition: 'before',
    yPosition: 'below',
    backdropClass: 'cdk-overlay-transparent-backdrop',
  };
}

export const MENU_PANEL = new InjectionToken<MenuPanel>('MENU_PANEL');
