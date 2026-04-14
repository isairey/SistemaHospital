import { Location } from '@angular/common';
import { AfterViewInit, Component, ComponentFactoryResolver, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { PatientService } from '../../patients/shared/patient.service';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { FocusedElementService } from '../../shared/global-search/shared/focused-element.service';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { MainTabComponent } from '../dynamic-tabs/tabs/main-tab.component';
import { ClinicalNotesComponent } from '../reusable-component/clinical-notes/clinical-notes.component';
import { ClinicalInformationPreviewMainComponent } from '../shared/clinical-info-preview/clinical-info-preview-main.component';
import { ClinicalPatientService } from '../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../shared/clinical.bl.service';
import { ClinicalPhrase } from '../shared/dto/clinical-phrase.dto';
import { PatientDetails_DTO } from '../shared/dto/patient-cln-detail.dto';
import { TabRefreshService } from '../shared/tab-refresh.service';
import { ClinicalOverviewTabComponent } from './clinical-overview-tab/clinical-overview-tab.component';

class MainTabs {
  Title: string;
  Component: any;
  IsActive: boolean;
}
@Component({
  selector: 'clinical-overview-wrapper-component',
  templateUrl: 'clinical-overview-wrapper.component.html',
  styleUrls: ['clinical-overview-wrapper.component.css']
})
export class ClinicalOverviewWrapperComponent implements OnInit, AfterViewInit {
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();
  constructor(
    private _selectedPatientService: ClinicalPatientService,
    private _patientService: PatientService,
    private _clinicalBlService: ClinicalNoteBLService,
    private _focusedElementService: FocusedElementService,
    public msgBoxServ: MessageboxService,
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _tabRefreshService: TabRefreshService,
    private _location: Location
  ) {

  }

  ngOnInit(): void {
    if (this._selectedPatientService.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientService.SelectedPatient;
    }

    this.GetClinicalPhrases();

  }

  /**
   * Gets Clinical Phrases from the server and buffers it into the FocusedElementService
   */
  GetClinicalPhrases() {
    this._clinicalBlService.GetClinicalPhrases()
      .subscribe(
        (res: DanpheHTTPResponse) => {
          if (Array.isArray(res.Results)) {
            this._focusedElementService.SetClinicalPhrases(res.Results as ClinicalPhrase[]);
          } else {
            this._focusedElementService.SetClinicalPhrases(new Array<ClinicalPhrase>());
          }
        },
        err => {
          this._focusedElementService.SetClinicalPhrases(new Array<ClinicalPhrase>());
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Clinical Phrases!"]);
          console.log(err);
        });
  }
  ngOnDestroy(): void {
    this._patientService.CreateNewGlobal();
  }
  IsMaximized = false;
  toggleMaximize(event: MouseEvent) {
    event.stopPropagation();
    this.IsMaximized = !this.IsMaximized;
  }
  BackToPreviousPage() {
    this._location.back();
  }



  //Yogesh 12-01-2025---------------------Start Tabs Code-------------------------------------


  /**
   * DynamicTabs: MainTabComponent[] - This array will hold the instances of the MainTabComponent
   */
  DynamicTabs: MainTabComponent[] = [];
  /**
   * Container: ViewContainerRef - This is a reference to the view container where we will be adding the dynamic tabs.
   */
  @ViewChild('container', { read: ViewContainerRef }) Container: ViewContainerRef;

  // This lifecycle hook function will be called after the view has been initialized. Open First tab by default.
  ngAfterViewInit(): void {
    this.SelectTab(this.MainTabsList[0]);
  }

  /**
   * MainTabsList: MainTabs[] - This array will hold the tabs that we want to display in our application.
   */
  MainTabsList: MainTabs[] = [
    {
      Title: `${this._selectedPatientService.SelectedPatient.Name}`,
      Component: ClinicalOverviewTabComponent,
      IsActive: false
    },
    {
      Title: "Clinical Preview",
      Component: ClinicalInformationPreviewMainComponent,
      IsActive: false
    },
    {
      Title: "Notes",
      Component: ClinicalNotesComponent,
      IsActive: false
    }
  ];

  /**
   * OpenTab(title: string, template) - This function will Create a new tab Instance in the application.
   */
  OpenTab(title: string, template) {
    // Get a component factory for our MainTabComponent.
    // This is necessary to dynamically create an instance of the MainTabComponent
    // and add it to the view container, allowing us to open new tabs dynamically.
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(
      MainTabComponent
    );
    const viewContainerRef = this.Container;
    // Create a component instance of MainTabComponent dynamically
    // and add it to the view container to open a new tab.
    const componentRef = viewContainerRef.createComponent(componentFactory);
    // set the according properties on our component instance
    const instance: MainTabComponent = componentRef.instance as MainTabComponent;
    instance.Title = title;
    instance.Template = template;
    // tab navigation headers
    this.DynamicTabs.push(componentRef.instance as MainTabComponent);
  }

  /**
   * SelectTab(tab: MainTabs) - This function will be called when the user clicks on a tab.
   */
  SelectTab(tab: MainTabs) {
    //check if tab instance exists
    //if already not exist then add one instance or else select the existing instance 
    if (!tab)
      return;
    let dtab = this.DynamicTabs.find(dtab => dtab.Template === tab.Component);
    if (!dtab) {
      this.OpenTab(tab.Title, tab.Component);
      dtab = this.DynamicTabs.find(dtab => dtab.Template === tab.Component);
    }
    // deactivate all tabs
    this.MainTabsList.forEach(tab => (tab.IsActive = false));
    this.DynamicTabs.forEach(tab => (tab.Active = false));

    // activate the tab the user has clicked on.
    if (tab) {
      tab.IsActive = true;
      dtab.Active = true;
      //notify the tab to refresh
      this._tabRefreshService.emitEvent(tab.Component);
    }
  }


  //Yogesh 12-01-2025---------------------End Tabs Code-------------------------------------
}
