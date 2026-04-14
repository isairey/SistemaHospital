import { AfterViewInit, Component, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { Patient_DTO } from '../../../../claim-management/shared/DTOs/patient.dto';
import { TabGroupComponent } from '../../../dynamic-tabs/tabs/tab-group.component';
import { TabComponent } from '../../../dynamic-tabs/tabs/tab.component';
import { ChildHeading } from '../../../shared/dto/child-heading.dto';
import { ParentHeading_DTO } from '../../../shared/dto/parent-heading.dto';
import { FieldFormComponent } from '../field-form/field-form.component';

@Component({
  selector: 'child-heading',
  templateUrl: './child-heading.component.html',
  styleUrls: ['./child-heading.component.css']
})
export class ChildHeadingComponent implements OnInit, IDynamicTab, AfterViewInit {

  DataContext: { patient: Patient_DTO, data: ParentHeading_DTO };
  @Output()
  OpenTab: EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }> = new EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean }>();
  @ViewChild(TabGroupComponent) tabsComponent;
  VisitTypeContext: any;
  constructor() { }


  //Start: for navbar overriding
  DynamicTabs: TabComponent[] = [];


  ActiveChildTabs: { context: ChildHeading, index: number }[] = [];
  ChildHeadingFieldList: ChildHeading[];

  OpenHeadingTab(heading: ChildHeading) {
    //check if tab is already open
    if (!this.ActiveChildTabs.find(x => x.context === heading)) {
      //if not then
      this.ActiveChildTabs.push({ context: heading, index: (this.DynamicTabs.length) });
      this.OpenChildHeadingTab(FieldFormComponent, heading, false, true);
      this.SelectOverridingNavTab(heading);
    } else {
      let tabIndex = this.ActiveChildTabs.find(x => x.context === heading).index;
      this.SelectOverriddenTab(this.DynamicTabs[tabIndex]);
      this.SelectOverridingNavTab(heading);
    }

  }
  OpenChildHeadingTab(template: any, data: any, isCloseable: boolean, allowMultiple: boolean) {
    if (template) {

      this.tabsComponent.OpenTab(`${data.DisplayName}`, template,
        { patient: this.DataContext.patient, data: data }, isCloseable, allowMultiple);

    }
  }
  SelectOverridingNavTab(heading: any) {
    if (this.ChildHeadingFieldList)
      this.ChildHeadingFieldList.forEach(element => {
        element.ActiveTab = false;
      })
    if (heading) {
      heading.ActiveTab = true;
    }
  }
  //End: for navbar Overriding


  SelectOverriddenTab(tab: TabComponent) {
    // deactivate all tabs
    this.DynamicTabs.forEach(tab => (tab.Active = false));

    // activate the tab the user has clicked on.
    tab.Active = true;
  }
  ngOnInit() {
    if (this.DataContext.data.ChildHeading && this.DataContext.data)
      this.ChildHeadingFieldList = this.DataContext.data.ChildHeading;
    if (this.ChildHeadingFieldList && this.ChildHeadingFieldList.length > 0) {
      this.ChildHeadingFieldList.forEach(heading => {
        heading['ActiveTab'] = false;
      })
    }


  }
  ngAfterViewInit() {
    this.OpenDefaultTab();
  }

  OpenDefaultTab() {
    if (this.ChildHeadingFieldList && this.ChildHeadingFieldList.length > 0) {
      let defaultTab = this.ChildHeadingFieldList.find(heading => heading.IsDefault);
      if (defaultTab)
        this.OpenHeadingTab(defaultTab);
      else
        this.OpenHeadingTab(this.ChildHeadingFieldList[0]);
    }
  }

}
