/**
 * The main component that renders single TabComponent
 * instances.
 */

import {
  AfterContentInit,
  Component,
  ComponentFactoryResolver,
  ContentChildren,
  Injector,
  Input,
  QueryList,
  ViewChild,
  ViewContainerRef
} from '@angular/core';

import { Location } from '@angular/common';
import { TabRefreshService } from '../../shared/tab-refresh.service';
import { TabComponent } from './tab.component';

@Component({
  selector: 'tab-group',
  templateUrl: './tab-group.component.html',
  styles: [
    `
    .tab-close {
      color: gray;
      text-align: right;
      cursor: pointer;
    }
    `
  ]
})
export class TabGroupComponent implements AfterContentInit {
  @Input('hideTabsNav')
  HideTabsNav: boolean = false;

  @Input('dynamicTabs')
  DynamicTabs: TabComponent[] = [];

  @Input('tabs')
  @ContentChildren(TabComponent) Tabs: QueryList<TabComponent>;
  @ViewChild('container', { read: ViewContainerRef }) Container!: ViewContainerRef;

  IsMaximized = false;

  constructor(private _componentFactoryResolver: ComponentFactoryResolver, private _injector: Injector, private _tabRefreshService: TabRefreshService,
    private _location: Location
  ) { }

  ngOnInit() {
    console.log(this.DynamicTabs);
  }

  ngAfterContentInit() {
    // // get all active tabs
    // const activeTabs = this.Tabs.filter(tab => tab.Active);

    // // if there is no active tab set, activate the first
    // if (activeTabs.length === 0 && this.DynamicTabs.length === 0) {
    //   this.SelectTab(this.Tabs.first);
    // }
  }

  OpenTab(title: string, template, data, isCloseable = false, allowMultiple: boolean = false) {

    //check if same tab is already open
    let tab = this.DynamicTabs.find(t => t.Template === template);
    if (tab && !allowMultiple) {
      this.CloseTab(tab);
    }
    tab = this.DynamicTabs.find(t => t.Template === template);
    if (!tab || allowMultiple) {
      // get a component factory for our TabComponent
      const componentFactory = this._componentFactoryResolver.resolveComponentFactory(
        TabComponent
      );

      const viewContainerRef = this.Container;

      // create a component instance
      const componentRef = viewContainerRef.createComponent(componentFactory, null, this._injector);

      // set the according properties on our component instance
      const instance: TabComponent = componentRef.instance as TabComponent;
      instance.Title = title;
      instance.Template = template;
      // instance.createComponent(template)
      instance.DataContext = data;
      instance.IsCloseable = isCloseable;
      instance.OpenTab.subscribe((obj) => {
        this.OpenTab(obj.title, obj.template, obj.data, obj.isCloseable);
      });

      // remember the dynamic component for rendering the
      // tab navigation headers
      this.DynamicTabs.push(componentRef.instance as TabComponent);

      // set it active
      this.SelectTab(this.DynamicTabs[this.DynamicTabs.length - 1]);
    } else {
      console.log("tab already open")
    }

  }

  SelectTab(tab: TabComponent) {
    // deactivate all tabs
    if (this.Tabs) {
      this.Tabs.toArray().forEach(tab => (tab.Active = false));
    }
    if (this.DynamicTabs) {
      this.DynamicTabs.forEach(tab => (tab.Active = false));
    }
    // activate the tab the user has clicked on.
    if (tab) {
      tab.Active = true;
      this._tabRefreshService.emitEvent(tab.Template);
    }

  }

  CloseTab(tab: TabComponent) {
    for (let i = 0; i < this.DynamicTabs.length; i++) {
      if (this.DynamicTabs[i] === tab) {
        // remove the tab from our array
        this.DynamicTabs.splice(i, 1);

        // destroy our dynamically created component again
        // let viewContainerRef = this.dynamicTabPlaceholder.viewContainer;
        let viewContainerRef = this.Container;

        // let viewContainerRef = this.dynamicTabPlaceholder;
        viewContainerRef.remove(i);

        // set tab index to 1st one
        this.SelectTab(this.Tabs.first);
        break;
      }
    }
  }

  CloseActiveTab() {
    const activeTabs = this.DynamicTabs.filter(tab => tab.Active);
    if (activeTabs.length > 0) {
      // close the 1st active tab (should only be one at a time)
      this.CloseTab(activeTabs[0]);
    }
  }
  toggleMaximize(event: MouseEvent) {
    event.stopPropagation();
    this.IsMaximized = !this.IsMaximized;
  }
  BackToPreviousPage() {
    this._location.back();
  }
}
