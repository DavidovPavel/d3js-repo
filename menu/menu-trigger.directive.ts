import { FocusOrigin, isFakeMousedownFromScreenReader } from '@angular/cdk/a11y';
import {
    FlexibleConnectedPositionStrategy,
    HorizontalConnectionPos,
    Overlay,
    OverlayConfig,
    OverlayRef,
    ScrollStrategy,
    VerticalConnectionPos,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Directive, ElementRef, Inject, Input, OnDestroy, ViewContainerRef } from '@angular/core';
import { merge, Subscription } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MenuPanel } from './models';
import { MENU_SCROLL_STRATEGY } from './tokens';

export const MENU_OFFSET_TOP = 8;

@Directive({
  selector: '[tluiMenuTriggerFor]',
  exportAs: 'tluiMenuTrigger',
  host: {
    '(click)': 'handleClick($event)',
    '(mousedown)': 'handleMousedown($event)',
  },
})
export class TluiMenuTriggerDirective implements OnDestroy {
  private opened: boolean = false;
  private menuPanel: MenuPanel | null = null;
  private overlayRef: OverlayRef | null = null;
  private portal!: TemplatePortal;
  private scrollStrategy: () => ScrollStrategy;
  private menuCloseSubscription = Subscription.EMPTY;
  private closingActionsSubscription = Subscription.EMPTY;

  openedBy: Exclude<FocusOrigin, 'program' | null> | undefined = undefined;

  @Input('tluiMenuTriggerFor')
  get menu(): MenuPanel | null {
    return this.menuPanel;
  }
  set menu(menu: MenuPanel | null) {
    if (menu === this.menuPanel) {
      return;
    }

    this.menuCloseSubscription.unsubscribe();

    if (menu) {
      this.menuCloseSubscription = menu.close.subscribe(() =>
        this.destroyMenu()
      );
    }

    this.menuPanel = menu;
  }

  constructor(
    private viewContainerRef: ViewContainerRef,
    private overlay: Overlay,
    private element: ElementRef<HTMLElement>,
    @Inject(MENU_SCROLL_STRATEGY) scrollStrategy: any
  ) {
    this.scrollStrategy = scrollStrategy;
  }

  ngOnDestroy() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.menuCloseSubscription.unsubscribe();
    this.closingActionsSubscription.unsubscribe();
  }

  toggleMenu(): void {
    return this.opened ? this.closeMenu() : this.openMenu();
  }

  closeMenu(): void {
    if (this.opened) {
      this.menu?.close.emit();
    }
  }

  openMenu(): void {
    const menu = this.menu;

    if (this.opened || !menu) {
      return;
    }

    const overlayRef = this.createOverlay(menu);
    const overlayConfig = overlayRef.getConfig();
    const positionStrategy =
      overlayConfig.positionStrategy as FlexibleConnectedPositionStrategy;

    this.setPosition(menu, positionStrategy);
    overlayRef.attach(this.getPortal(menu));

    this.closingActionsSubscription = this.menuClosingActions().subscribe(() =>
      this.closeMenu()
    );

    this.opened = true;
    // this.menuOpen ? this.menuOpened.emit() : this.menuClosed.emit();

    menu.startAnimation();
  }

  private createOverlay(menu: MenuPanel): OverlayRef {
    if (!this.overlayRef) {
      const config = this.getOverlayConfig(menu);
      this.overlayRef = this.overlay.create(config);
      this.overlayRef
        .outsidePointerEvents()
        .pipe(delay(0))
        .subscribe(() => this.destroyMenu());
    }

    return this.overlayRef;
  }

  private getOverlayConfig(menu: MenuPanel): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.element)
        .withLockedPosition()
        .withGrowAfterOpen(),
      scrollStrategy: this.scrollStrategy(),
    });
  }

  private setPosition(
    menu: MenuPanel,
    positionStrategy: FlexibleConnectedPositionStrategy
  ) {
    const originX: HorizontalConnectionPos =
      menu.xPosition === 'before' ? 'start' : 'end';
    const overlayY: VerticalConnectionPos =
      menu.yPosition === 'above' ? 'bottom' : 'top';
    const overlayX = originX;
    const offsetY = MENU_OFFSET_TOP;
    const originY = overlayY === 'top' ? 'bottom' : 'top';

    positionStrategy.withPositions([
      { originX, originY, overlayX, overlayY, offsetY },
    ]);
  }

  private getPortal(menu: MenuPanel): TemplatePortal {
    if (!this.portal || this.portal.templateRef !== menu.templateRef) {
      this.portal = new TemplatePortal(menu.templateRef, this.viewContainerRef);
    }

    return this.portal;
  }

  private menuClosingActions() {
    const backdrop = this.overlayRef!.backdropClick();
    const detachments = this.overlayRef!.detachments();
    return merge(backdrop, detachments);
  }

  private destroyMenu() {
    if (!this.overlayRef || !this.opened) {
      return;
    }

    this.closingActionsSubscription.unsubscribe();
    this.overlayRef.detach();
    this.openedBy = undefined;
    this.opened = false;
    // this.menuOpen ? this.menuOpened.emit() : this.menuClosed.emit();

    this.menu?.resetAnimation();
  }

  handleClick(event: MouseEvent): void {
    if (this.menu && !this.opened) {
      event.stopPropagation();
      this.openMenu();
    } else {
      this.toggleMenu();
    }
  }

  handleMousedown(event: MouseEvent): void {
    if (!isFakeMousedownFromScreenReader(event)) {
      this.openedBy = event.button === 0 ? 'mouse' : undefined;

      if (this.menu) {
        event.preventDefault();
      }
    }
  }
}
