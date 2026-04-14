/**
 * A single tab page. It renders the passed template
 * via the @Input properties by using the ngTemplateOutlet
 * and ngTemplateOutletContext directives.
 */

import { AfterViewInit, Component, ComponentFactoryResolver, EventEmitter, Input, OnInit, Output, Type, ViewChild, ViewContainerRef } from '@angular/core';


@Component({
  selector: 'tab',
  styles: [
    `
    .pane{
      padding: 1em;
    }
  `
  ],
  templateUrl: './tab.component.html'
})
export class TabComponent implements AfterViewInit, OnInit {
  @ViewChild('tab_container', { read: ViewContainerRef }) Tab_container!: ViewContainerRef;
  @Input('tabTitle') Title: string;
  @Input() Active = false;
  @Input() IsCloseable = false;
  @Input() Template: Type<IDynamicTab>;
  @Input() DataContext;
  @Input() VisitTypeContext;



  @Output() OpenTab: EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }> = new EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }>();


  constructor(private _componentFactoryResolver: ComponentFactoryResolver) {

  }
  ngAfterViewInit(): void {

    // this.openParentTab('tempTab', TempComponent, {}, true);
  }
  ngOnInit(): void {
    this.CreateComponent();
  }
  OpenParentTab(title: string, template: any, data: any, isCloseable?: boolean) {
    // this.parentTabs.openTab(title, template, data, isCloseable)
    this.OpenTab.emit({ title, template, data, isCloseable });
  }

  CreateComponent() {
    if (this.Tab_container && this.Template && this.DataContext !== undefined) {
      const componentFactory = this._componentFactoryResolver.resolveComponentFactory<IDynamicTab>(
        this.Template
      );
      let context = this.Tab_container.createComponent(componentFactory);

      context.instance.DataContext = this.DataContext;
      context.instance.VisitTypeContext = this.VisitTypeContext;
      context.instance.OpenTab.subscribe((obj) => {
        this.OpenParentTab(obj.title, obj.template, obj.data, obj.isCloseable);
      });
    }
  }
}
