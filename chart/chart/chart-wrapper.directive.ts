import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';

import { TluiDataLayerDirective } from '../data-layer.directive';
import { TluiLegendLabelData } from '../interfaces';

@Directive({
  selector: 'tlui-chart',
})
export class TluiChartWrapperDirective implements OnInit {
  canvas: SVGElement | null = null;

  @Input()
  width: number = 800;

  @Input()
  height: number = 600;

  @Input()
  marginLeft: number = 32;

  @Input()
  marginRight: number = 32;

  @Input()
  marginBottom: number = 32;

  @Input()
  marginTop: number = 32;

  private _offsetLeft = 0;
  set offsetLeft(value: number) {
    this._offsetLeft = value;
  }

  get offsetLeft() {
    return this._offsetLeft;
  }

  get offsetWidth() {
    return this.width - this.marginLeft - this.marginRight - this._offsetLeft;
  }

  get offsetHeight() {
    return this.height - this.marginBottom - this.marginTop;
  }

  id = 'tlui-chart-' + Date.now();

  layerLabels: {
    data: TluiLegendLabelData;
    layer: TluiDataLayerDirective<any, any>;
  }[] = [];

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    this.createCanvas();
  }

  private createCanvas() {
    const container = this.el.nativeElement.firstChild as HTMLDivElement;

    if (this.canvas) {
      d3.select(container).select('svg').remove();
      this.layerLabels = [];
    }

    this.canvas = d3
      .select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('id', this.id)
      .attr('transform', `translate(${this.marginLeft}, ${this.marginTop})`)
      .node();
  }
}
