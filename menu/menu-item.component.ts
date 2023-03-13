import { Component, Input } from '@angular/core';

@Component({
  selector: 'tlui-menu-item',
  template: `<ng-content></ng-content>`,
  host: {
    'class.selected': 'isSelected',
    'class.focus': 'isFocused',
    'class.disabled': 'disabled',
  },
  styleUrls: ['./menu-item.component.scss']
})
export class TluiMenuItemComponent {
  public isSelected: boolean = false;
  public isFocused: boolean = false;

  @Input()
  public disabled: boolean = false;
}
