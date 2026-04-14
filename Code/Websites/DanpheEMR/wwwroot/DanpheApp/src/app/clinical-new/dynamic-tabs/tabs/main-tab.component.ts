/**
 * A single tab page. It renders the passed template
 * via the @Input properties by using the ngTemplateOutlet
 * and ngTemplateOutletContext directives.
 */

import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, Input, OnInit, Output, Type, ViewChild, ViewContainerRef } from '@angular/core';


@Component({
  selector: 'main-tab',
  styles: [
    `
    .pane{
      padding: 1em;
    }
  `
  ],
  templateUrl: './main-tab.component.html'
})
export class MainTabComponent implements  AfterViewInit {
  @ViewChild('tab_container', { read: ViewContainerRef }) Tab_container!: ViewContainerRef;
  @Input('tabTitle') Title: string;
  @Input() Active = false;
  @Input() Template: Type<any>;

  constructor(private _componentFactoryResolver: ComponentFactoryResolver) {

  }
  ngAfterViewInit(): void {
    this.CreateComponent();
  }
  CreateComponent() {
    if (this.Tab_container && this.Template) {
      const componentFactory = this._componentFactoryResolver.resolveComponentFactory<any>(
        this.Template
      );
      let context = this.Tab_container.createComponent(componentFactory);
    }
  }
}
