import { EventEmitter, TemplateRef } from '@angular/core';

export type MenuPositionX = 'before' | 'after';
export type MenuPositionY = 'above' | 'below';
export type MenuCloseReason = void | 'click' | 'keydown' | 'tab';


export interface MenuPanel<T = any> {
  xPosition: MenuPositionX;
  yPosition: MenuPositionY;
  templateRef: TemplateRef<any>;
  readonly close: EventEmitter<void | 'click' | 'keydown' | 'tab'>;
  startAnimation: () => void;
  resetAnimation: () => void;
}

export interface MenuDefaultOptions {
    /** The x-axis position of the menu. */
    xPosition: MenuPositionX;

    /** The y-axis position of the menu. */
    yPosition: MenuPositionY;

    /** Whether the menu should overlap the menu trigger. */
    overlapTrigger: boolean;

    /** Class to be applied to the menu's backdrop. */
    backdropClass: string;

    /** Class or list of classes to be applied to the menu's overlay panel. */
    overlayPanelClass?: string | string[];

    /** Whether the menu has a backdrop. */
    hasBackdrop?: boolean;
  }
