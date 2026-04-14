import { Component, ComponentFactoryResolver, ComponentRef, Injector, Input, OnInit, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { TabComponent } from '../../dynamic-tabs/tabs/tab.component';
import { ClinicalDataVisitListDTO } from '../../shared/clinical-info-preview/dto/clinical-data-visit-list.dto';
import { ClinicalData_DTO, ClinicalQuestionAnswer_DTO, ClinicalQuestionOption_DTO } from '../../shared/clinical-info-preview/dto/clinical-data.dto';
import { PreTemplatePatientDetailDTO } from '../../shared/clinical-info-preview/dto/data-view-config';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalPreTemplateMappingService } from '../../shared/clinical-pretemplate-mapping.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { PatientDetails_DTO } from '../../shared/dto/patient-cln-detail.dto';
import { TabRefreshService } from '../../shared/tab-refresh.service';
import { SmartPrintableFormComponent } from '../reusable-elements/smart-printable-form/smart-printable-form.component';
import { Note } from './dto/clilnical-notes.dto';
import { NoteComponent } from './note/note.component';

@Component({
  selector: 'app-clinical-notes',
  templateUrl: './clinical-notes.component.html',
  styleUrls: ['./clinical-notes.component.css']
})
export class ClinicalNotesComponent implements OnInit {

  @Input('dynamicTabs')
  DynamicTab: ComponentRef<TabComponent>;
  @ViewChild('container', { read: ViewContainerRef }) Container!: ViewContainerRef;

  NotesConfig: Note[] = [];

  IsOpen: boolean = true;

  ClinicalInformation = new Array<ClinicalData_DTO>();
  PreTemplateDataViewMapping: any;
  PreTemplatePatientDetail: PreTemplatePatientDetailDTO;
  Subscription: Subscription;

  SelectedVisit: number;
  AllVisits: ClinicalDataVisitListDTO[] = [];
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();

  constructor(
    private _componentFactoryResolver: ComponentFactoryResolver,
    private _injector: Injector,
    private _tabRefreshService: TabRefreshService,
    private _clinicalNoteBLService: ClinicalNoteBLService,
    private _msgBoxServ: MessageboxService,
    private _selectedPatientSer: ClinicalPatientService,
    public clinicalPretemplateMappingService: ClinicalPreTemplateMappingService


  ) {
    if (this._selectedPatientSer.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientSer.SelectedPatient;
      this.PreTemplateDataViewMapping = this.clinicalPretemplateMappingService.PreTemplateDataViewMapping;
      //reference to this object will be passed to the pretemplate components so it can be manipulated from this component 
      this.PreTemplatePatientDetail = {
        PatientId: this.SelectedPatient.PatientId,
        PatientVisitId: this.SelectedPatient.PatientVisitId
      };
      this.SelectedVisit = this.SelectedPatient.PatientVisitId;
    }
  }
  VisitTypeContext?: any;

  /**
   * Initializes the component.
   * - Subscribes to tab refresh events to handle note tab selection.
   * - Fetches user-wise notes configuration and loads the clinical data.
   */
  ngOnInit() {
    this.Subscription = this._tabRefreshService.getEvent().subscribe(data => {
      this.RefreshOnSelectNoteTab(data);
    });

    forkJoin([this._clinicalNoteBLService.GetPatientVisitsByPatientId(this.SelectedPatient.PatientId),
    this._clinicalNoteBLService.GetUserWiseNotes(),
    this._clinicalNoteBLService.GetClinicalDataByVisitId(
      this.SelectedPatient.PatientId,
      this.SelectedPatient.PatientVisitId,
      null
    )])
      .subscribe(
        (res: DanpheHTTPResponse[]) => {
          if (res[0].Status === ENUM_DanpheHTTPResponses.OK) {
            if (Array.isArray(res[0].Results))
              this.AllVisits = res[0].Results;
            else
              this.AllVisits = [];
          }
          else {
            this.AllVisits = [];
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res[0].ErrorMessage]);
          }

          if (res[1].Status === ENUM_DanpheHTTPResponses.OK) {
            if (Array.isArray(res[1].Results))
              this.NotesConfig = res[1].Results;
            else
              this.NotesConfig = [];

          }
          else {
            this.NotesConfig = [];
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res[1].ErrorMessage]);
          }

          if (res[2].Status === ENUM_DanpheHTTPResponses.OK) {
            if (Array.isArray(res[2].Results))
              this.ClinicalInformation = res[2].Results;
            else
              this.ClinicalInformation = [];
            this.ProcessDataWithHeaders();
          }
          else {
            this.ClinicalInformation = [];
            this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, [res[2].ErrorMessage]);
          }
          this.OpenDefaultNote();

        },
        err => {
          this.AllVisits = [];
          this.NotesConfig = [];
          this.ClinicalInformation = [];
          console.error(err);
        }
      );
  }



  /**
   * Cleans up resources when the component is destroyed.
   * - Unsubscribes from the Subscription if it exists to prevent memory leaks.
   */
  ngOnDestroy() {
    if (this.Subscription) {
      this.Subscription.unsubscribe();
    }
  }

  /**
   * Refreshes data when a note tab is selected.
   * - If the selected tab is ClinicalNotesComponent, it calls LoadData to refresh the clinical data.
   * @param {Type<any>} data - The type of the selected dynamic tab component.
   */
  RefreshOnSelectNoteTab(data: Type<any>) {
    if (data === ClinicalNotesComponent) {
      // this.LoadData();
      this.SelectedVisit = this.SelectedPatient.PatientVisitId;
      this.OnDataLoad();
    }
  }




  /**
   * Processes data with headers and populates fields and questions with answers and options.
   * - Iterates over each note in NotesConfig.
   * - For each field in the note, filters ClinicalInformation based on the FieldId.
   * - Depending on the field's InputType, populates field's answers or options with data from ClinicalInformation.
   * - If the field is of type Questionary, processes each question similarly.
   */
  ProcessDataWithHeaders(): void {
    if (this.NotesConfig && this.NotesConfig.length > 0) {
      this.NotesConfig.forEach(notes => {
        if (Array.isArray(notes.Fields)) {
          notes.Fields.forEach(field => {
            const fieldData = this.ClinicalInformation.filter(info => info.FieldId === field.ClinicalFieldId);
            field.Answers = [];
            field.Options = [];

            const setTextAnswers = (dataArray: ClinicalData_DTO[]) => {
              field.Answers = dataArray.map(data => ({
                Answer: data.FieldValue,
                Remark: data.Remarks,
                Date: data.CreatedOn,
                IsPrintable: false
              }));
            };

            const setOptions = (dataArray: ClinicalData_DTO[]) => {
              field.Options = dataArray.map(data => ({
                Options: data.ClinicalOptionsData.map(option => option.Options),
                Remark: data.Remarks,
                Date: data.CreatedOn,
                IsPrintable: false
              }));
            };

            switch (field.InputType) {
              case ENUM_ClinicalField_InputType.Textbox:
              case ENUM_ClinicalField_InputType.FreeType:
              case ENUM_ClinicalField_InputType.Number:
                setTextAnswers(fieldData);
                break;

              case ENUM_ClinicalField_InputType.SingleSelection:
              case ENUM_ClinicalField_InputType.MultipleSelect:
                setOptions(fieldData);
                break;

              case ENUM_ClinicalField_InputType.SmartTemplate:
                if (field.SmartTemplate && this.PreTemplateDataViewMapping[field.SmartTemplate]) {
                  field.FieldConfig = {
                    type: this.PreTemplateDataViewMapping[field.SmartTemplate],
                    PreTemplatePatientDetail: this.PreTemplatePatientDetail,
                    Type: field.SmartTemplate
                  };
                }
                break;
              case ENUM_ClinicalField_InputType.SmartPrintableForm:
                field.FieldConfig = {
                  type: SmartPrintableFormComponent,
                  IsPrintButton: false,
                  templateCode: field.SmartTemplate
                };
                break;

              case ENUM_ClinicalField_InputType.Questionnaire:
                field.Questions.forEach(question => {
                  //get information objects related to the current question
                  const questionData = this.ClinicalInformation.filter(cliInfo => cliInfo.FieldId === field.ClinicalFieldId);

                  switch (question.AnswerType) {
                    case ENUM_ClinicalField_InputType.Textbox:
                    case ENUM_ClinicalField_InputType.FreeType:
                      let ClinicalQuestionAnswer: ClinicalQuestionAnswer_DTO[] = [];
                      //get answer options of current question in a list.
                      questionData.forEach(data => {
                        if (data && data.ClinicalAnswerData.length > 0) {
                          //get answer for current question for one transaction
                          let answers = data.ClinicalAnswerData.filter(ans => ans.QuestionId === question.QuestionId)
                          if (answers.length > 0)
                            //there will only be one answer for one transaction
                            ClinicalQuestionAnswer.push(answers[0]);
                        }
                      });
                      question.Answers = ClinicalQuestionAnswer.map(answer => ({
                        Answer: answer.AnswerValue,
                        Remark: answer.Remarks,
                        Date: answer.CreatedOn,
                        IsPrintable: false
                      }));
                      break;

                    case ENUM_ClinicalField_InputType.SingleSelection:
                    case ENUM_ClinicalField_InputType.MultipleSelect:
                      //get answer options of current question two dimensional list. each array of options is of one transaction
                      let ClinicalQuestionOption: ClinicalQuestionOption_DTO[][] = [];
                      questionData.forEach(data => {
                        if (data && data.ClinicalAnswerOptionData.length > 0) {
                          //get options for current question for one transaction
                          let options = data.ClinicalAnswerOptionData.filter(ans => ans.QuestionId === question.QuestionId)
                          if (options.length > 0)
                            ClinicalQuestionOption.push(options);
                        }
                      });
                      //convert in better format and save into the field
                      question.Options = ClinicalQuestionOption.map(optionSet => ({
                        Options: optionSet.map(option => option.QuestionOption),
                        Remark: optionSet[0].Remarks,
                        Date: optionSet[0].CreatedOn,
                        IsPrintable: false
                      }));
                      break;
                  }
                });
                break;
            }
          });
        } else {
          notes.Fields = [];
        }
      });
    } else {
      this.NotesConfig = [];
    }
  }

  /**
   * Toggles the state of the side navigation.
   * - If the side navigation is open, it will be closed.
   * - If the side navigation is closed, it will be opened.
   */
  ToggleSideNav(): void {
    this.IsOpen = !this.IsOpen
  }


  /**
   * Loads data for the selected visit by:
   * 1. Setting the PatientVisitId based on the selected visit.
   * 2. Reloading note data.
   * 3. Loading data for the selected visit.
   */
  OnDataLoad(): void {
    this.PreTemplatePatientDetail.PatientVisitId = Number(this.SelectedVisit);
    this.ReloadNote();
    this.LoadData(this.SelectedVisit);
  }

  /**
 * Loads clinical data for the selected patient's visit.
 * - Calls GetClinicalDataByVisitId service to fetch clinical data.
 * - On successful response, assigns the data to ClinicalInformation and processes it with headers.
 * - On failure, displays an error message.
 */
  LoadData(patientVisit: number) {

    this._clinicalNoteBLService.GetClinicalDataByVisitId(
      this.SelectedPatient.PatientId,
      patientVisit,
      null
    ).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (Array.isArray(this.ClinicalInformation)) {
            this.ClinicalInformation = res.Results;
          } else {
            this.ClinicalInformation = [];
          }
          this.ProcessDataWithHeaders();
        } else {
          this.ClinicalInformation = [];
          this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, ['Unable to get Clinical Data']);
        }
      },
      (err) => {
        this.ClinicalInformation = [];
        this._msgBoxServ.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to get Clinical Data,${err.ErrorMessage}`]);
      }
    );
  }


  /**
 * Reloads the Notes with the selected visit details.
 */
  ReloadNote(): void {

    let activeNote: Note | undefined = undefined;

    if (Array.isArray(this.NotesConfig)) {
      activeNote = this.NotesConfig.find(note => note.IsActive);
    }

    if (activeNote) {
      this.OpenHeadingTab(activeNote);
    }

  }

  /*
    START: Dynamic Tabs - Yogesh 05-08-2024 only one tab will instantiated and others will be destroyed when switched
  */

  /**
   * Opens a heading tab for the specified note.
   * - Sets all notes in NotesConfig to inactive.
   * - Sets the specified note to active.
   * - Activates the tab with the specified note's details using ActivateTab method.
   * @param {Note} note - The note to open the heading tab for.
   */
  OpenHeadingTab(note: Note): void {
    this.NotesConfig.forEach(note => {
      note.IsActive = false;
    });
    note.IsActive = true;
    this.ActivateTab(note.ClinicalNotesName, NoteComponent, note.Fields, false);
  }

  OpenDefaultNote() {
    if (Array.isArray(this.NotesConfig) && this.NotesConfig.length > 0) {
      let defaultNote = this.NotesConfig.find(note => note.IsDefault);
      if (defaultNote)
        this.OpenHeadingTab(defaultNote);
      else
        this.OpenHeadingTab(this.NotesConfig[0]);
    }
  }


  /**
   * Activates a tab with the given parameters.
   * - Resolves the TabComponent factory and creates the component.
   * - Sets the tab component's properties (title, template, data, etc.).
   * - If a dynamic tab already exists, it is destroyed.
   * - Assigns the newly created tab component to DynamicTab.
   * @param {string} title - The title of the tab.
   * @param {any} template - The template/component to display in the tab.
   * @param {any} data - The data context for the tab.
   * @param {boolean} [isCloseable=false] - Indicates if the tab is closeable.
   * @param {boolean} [allowMultiple=false] - Indicates if multiple instances of the tab are allowed.
   */
  ActivateTab(title: string, template, data, isCloseable = false, allowMultiple: boolean = false) {
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory(
      TabComponent
    );
    const viewContainerRef = this.Container;
    const componentRef = viewContainerRef.createComponent(componentFactory, null, this._injector);
    const instance: TabComponent = componentRef.instance as TabComponent;

    instance.Title = title;
    instance.Template = template;
    instance.DataContext = data;
    instance.IsCloseable = isCloseable;
    instance.Active = true;
    if (this.DynamicTab) {
      this.DynamicTab.destroy();
    }
    this.DynamicTab = componentRef;
  }


  /*
  END: Dynamic Tabs
 */


}
