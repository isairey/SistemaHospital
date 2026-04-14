import { ChangeDetectorRef, Component, ElementRef, OnInit, Type } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { forkJoin, Subscription } from "rxjs";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { MessageboxService } from "../../../shared/messagebox/messagebox.service";
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../../../shared/shared-enums";
import { ClinicalPatientService } from "../clinical-patient.service";
import { ClinicalPreTemplateMappingService } from "../clinical-pretemplate-mapping.service";
import { ClinicalNoteBLService } from "../clinical.bl.service";
import { ChildHeading } from "../dto/child-heading.dto";
import { Field, PreviewConfiguration } from "../dto/field.dto";
import { ParentHeading_DTO } from "../dto/parent-heading.dto";
import { PatientDetails_DTO } from "../dto/patient-cln-detail.dto";
import { QuestionaryConfig } from "../dto/questionary-config.dto";
import { TabRefreshService } from "../tab-refresh.service";
import { PAnswers, PDocument, PField, POptions, PQuestionary, PSection } from "./dto/clinical-data-print.dto";
import { ClinicalDataVisitListDTO } from "./dto/clinical-data-visit-list.dto";
import { ClinicalData_DTO, ClinicalQuestionAnswer_DTO, ClinicalQuestionOption_DTO } from "./dto/clinical-data.dto";
import { PreTemplatePatientDetailDTO } from "./dto/data-view-config";
@Component({
  selector: "dynamic-clinical-info-preview",
  templateUrl: "./clinical-info-preview-main.component.html"
})
export class ClinicalInformationPreviewMainComponent implements OnInit {
  ClinicalInformation = new Array<ClinicalData_DTO>();
  ClinicalFieldConfig: ParentHeading_DTO[] = [];
  FilteredClinicalFieldConfig: ParentHeading_DTO[] = [];
  PreTemplateMapping: any;
  LoadedVisit: number;
  SelectedVisit: number;
  IsDataEditable: boolean = false;
  PrintableDocuments: PDocument[] = [];
  AllVisits: ClinicalDataVisitListDTO[] = [];
  ShowPrintPagePopUp: boolean = false;
  Loading: boolean = false;
  ENUMClinicalFieldInputType = ENUM_ClinicalField_InputType;

  DocumentList: { Name: string, Id: number; }[] = [];
  SectionList: { Name: string, Id: number; }[] = [];
  MedicalComponentList: { Name: string, Id: number; }[] = [];

  SelectedDocument: number = 0;
  SelectedSection: number = 0;
  SelectedMedicalComponent: number = 0;
  // private _subscription: Subscription;
  IsDatatLoaded: boolean = true;
  IsCustomizable: boolean = false;

  PreTemplateDataViewMapping: any;
  PreTemplateReloader: boolean = true;
  Subscription: Subscription;
  PreTemplatePatientDetail: PreTemplatePatientDetailDTO;
  SelectedPatient: PatientDetails_DTO = new PatientDetails_DTO();

  constructor(private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    public clinicalPretemplateMappingService: ClinicalPreTemplateMappingService,
    private _selectedPatientSer: ClinicalPatientService,
    private _elementRef: ElementRef,
    // private _clinicalDataServ: ClinicalDataService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _tabRefreshService: TabRefreshService
  ) {
    if (this._selectedPatientSer.SelectedPatient) {
      this.SelectedPatient = this._selectedPatientSer.SelectedPatient;
      //reference to this object will be passed to the pretemplate components so it can be manipulated from this component 
      this.PreTemplatePatientDetail = {
        PatientId: this.SelectedPatient.PatientId,
        PatientVisitId: this.SelectedPatient.PatientVisitId
      };
      this.SelectedVisit = this.SelectedPatient.PatientVisitId;
    } else {
      this.PreTemplatePatientDetail = {
        PatientId: 0,
        PatientVisitId: 0
      };
    }

    this.PreTemplateDataViewMapping = this.clinicalPretemplateMappingService.PreTemplateDataViewMapping;
  }


  /* --Yogesh 21-07-2024 execution steps to get data and preprocessing
  1.get clinicial heading configuration
  2.get ClinicalDataByVisitId
      -group data in required format and put it in clinical heading config data for ease of access in template and in code
  3.get all vists for the current patient
   */
  ngOnInit() {
    this.Subscription = this._tabRefreshService.getEvent().subscribe(data => {
      this.RefreshOnSelectPreviewTab(data);
    });
    if (this.SelectedPatient && this.SelectedPatient.VisitType) {
      forkJoin(
        [this._clinicalBLService.GetPatientVisitsByPatientId(this.SelectedPatient.PatientId),
        this._clinicalBLService.GetClinicalHeadingSubHeadingField(this.SelectedPatient.VisitType),
        this._clinicalBLService.GetClinicalDataByVisitId(this.SelectedPatient.PatientId, this.SelectedVisit, null)

        ]).subscribe(
          (res: DanpheHTTPResponse[]) => {
            if (res[0].Status === ENUM_DanpheHTTPResponses.OK) {
              this.AllVisits = res[0].Results;
            }
            else {
              this.AllVisits = [];
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res[0].ErrorMessage]);
            }
            if (res[1].Status === ENUM_DanpheHTTPResponses.OK) {
              this.ClinicalFieldConfig = res[1].Results;
              this.CreatePreviewConfigObjForFieldAndQuestions();
            }
            else {
              this.ClinicalFieldConfig = [];
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res[1].ErrorMessage]);
            }
            if (res[2].Status === ENUM_DanpheHTTPResponses.OK) {
              this.ClinicalInformation = res[2].Results;
              this.LoadedVisit = this.SelectedVisit;
              this.GroupClinicalInfoWithFieldConfig();
              this.CreateDocumentList();
            }
            else {
              this.ClinicalInformation = [];
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [res[2].ErrorMessage]);
            }
            this.OnFilter();

          },
          err => {
            console.error(err);
          }
        );
    }

    this.IsCustomizable = false;

  }

  /**
   * Cleanup logic to unsubscribe from active subscriptions when the component is destroyed.
   *
   * This method is called by Angular when the component is about to be destroyed. It ensures that any
   * active subscriptions are properly unsubscribed to prevent memory leaks and avoid potential
   * issues related to asynchronous operations after the component has been removed from the view.
   *
   * It checks if the `Subscription` property is defined and unsubscribes from it if necessary.
   */
  ngOnDestroy() {
    if (this.Subscription) {
      this.Subscription.unsubscribe();
    }
  }


  /**
   * Handles the refresh logic when a preview tab is selected.
   *
   * This function is triggered when preview tab is select. It checks if the selected tab
   * matches the `ClinicalInformationPreviewMainComponent`. If so, it updates the `SelectedVisit` property
   * with the current patient's visit ID from the `SelectedPatient` service and then calls the `OnDataLoad` method
   * to load the data for the selected visit.
   *
   * @param data - The component type of the selected preview tab. This is used to determine which tab was selected.
   */
  RefreshOnSelectPreviewTab(data: Type<any>) {
    if (data === ClinicalInformationPreviewMainComponent) {
      this.SelectedVisit = this.SelectedPatient.PatientVisitId;
      this.OnDataLoad();
    }
  }

  /**
   * Fetches all visits of a patient by their ID.
   *
   * @param {number} patientID - The ID of the patient whose visits are to be fetched.
   */
  GetPatientVisitsByPatientId(patinetID: number): void {
    this._clinicalBLService.GetPatientVisitsByPatientId(patinetID).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.AllVisits = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get Patient Vists"]);
        }

      },
      err => {
        console.error(err);
      }
    );
  }

  /**
   * Reloads clinical data based on the selected visit.
   * If the selected visit matches the current patient's visit ID, it fetches the clinical data.
   * Otherwise, it shows a warning message.
   */
  OnSaveDataReload(): void {
    if (Number(this.SelectedVisit) === this.SelectedPatient.PatientVisitId) {
      this.GetClinicalDataByVisitId(this.SelectedVisit);
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, ["Selected visit is not current visit in Clinical Preview"]);
    }

  }

  /**
   * Loads and reloads clinical data based on the selected visit.
   * Sets the PatientVisitId for SmartComponent DataViews, reloads the pre-template, and fetches clinical data for the selected visit.
   */
  OnDataLoad(): void {
    this.PreTemplatePatientDetail.PatientVisitId = Number(this.SelectedVisit);
    this.ReloadPreTemplate();
    this.GetClinicalDataByVisitId(this.SelectedVisit);
  }

  /**
   * Configures preview objects for fields and questions in clinical field configurations.
   * - Filters sections with no fields, and specific field types.
   * - Initializes preview configurations for fields and questions.
   */
  CreatePreviewConfigObjForFieldAndQuestions(): void {
    if (this.ClinicalFieldConfig && this.ClinicalFieldConfig.length > 0) {
      this.ClinicalFieldConfig = this.ClinicalFieldConfig.filter(document => {
        document.ActiveTab = true;
        if (Array.isArray(document.ChildHeading)) {
          document.ChildHeading = document.ChildHeading.filter(section => {
            if (Array.isArray(section.Field)) {
              section.Field = section.Field.filter(field => {
                if (field.InputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {
                  return true;
                }
                if (field.InputType === ENUM_ClinicalField_InputType.SmartTemplate) {
                  if (!(field.Pretemplate in this.PreTemplateDataViewMapping)) {
                    return false;
                  }
                }
                return true;
              });
            } else {
              section.Field = [];
            }
            return section.Field.length > 0;
          });
        } else {
          document.ChildHeading = [];
        }

        return document.ChildHeading.length > 0;
      });
      this.ClinicalFieldConfig.forEach(document => {
        document.ActiveTab = true;
        if (Array.isArray(document.ChildHeading)) {
          document.ChildHeading.forEach(section => {
            if (Array.isArray(section.Field)) {
              section.Field.forEach(field => {
                field.PreviewConfig = new PreviewConfiguration();
                if (field.InputType === ENUM_ClinicalField_InputType.SmartTemplate) {
                  // console.log(this.PreTemplateDataViewMapping);
                  field.FieldConfig = {
                    type: this.PreTemplateDataViewMapping[field.Pretemplate],
                    PreTemplatePatientDetail: this.PreTemplatePatientDetail
                  };
                  // console.log(field.FieldConfig, "Smart Template");
                }
                if (field.InputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {

                  field.FieldConfig = {
                    type: this.PreTemplateDataViewMapping['SmartPrintableFormComponent'],
                    templateCode: field.Options[0].Options,
                    IsPrintButton: false
                  };
                  // console.log(field.FieldConfig, "Smart Printable Form");
                }
                if (field.InputType === ENUM_ClinicalField_InputType.Questionnaire) {
                  field.QuestionaryConfig.forEach(question => {
                    question.PreviewConfig = new PreviewConfiguration();
                  });
                }
              });
            } else {
              section.Field = [];
            }

          });
        } else {
          document.ChildHeading = [];
        }

      });
    } else {
      this.ClinicalFieldConfig = [];
    }
  }



  /**
   * Gets clinical data for the selected visit and processes it with headings.
   *
   * @param {number} patientVisitId - The ID of the patient visit for which to retrieve clinical data.
   */
  GetClinicalDataByVisitId(patientVisitId: number): void {
    this.IsDatatLoaded = false;
    this._clinicalBLService.GetClinicalDataByVisitId(this.SelectedPatient.PatientId, patientVisitId, null).subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (Array.isArray(res.Results))
            this.ClinicalInformation = res.Results;
          else
            this.ClinicalInformation = []
          this.LoadedVisit = this.SelectedVisit;
          this.GroupClinicalInfoWithFieldConfig();
          this.IsDatatLoaded = true;
        }
        else {
          this.IsDatatLoaded = true;
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Failed to get clinical information of patient"]);
        }
      },
      err => {
        this.IsDatatLoaded = true;
        console.error(err);
      }
    );
  }

  /**
   * Groups and organizes clinical data within headings for ease of access.
   * Processes the clinical data and associates it with corresponding fields and questions.
   */
  GroupClinicalInfoWithFieldConfig(): void {
    if (!this.ClinicalFieldConfig || this.ClinicalFieldConfig.length === 0) {
      this.ClinicalFieldConfig = [];
      return;
    }

    this.ClinicalFieldConfig.forEach(document => {
      if (Array.isArray(document.ChildHeading)) {
        document.ChildHeading.forEach(section => {
          if (Array.isArray(section.Field))
            section.Field.forEach(field => {
              const clinicalInfosForField = this.ClinicalInformation.filter(info => info.FieldId === field.FieldId);
              switch (field.InputType) {
                case ENUM_ClinicalField_InputType.Textbox:
                case ENUM_ClinicalField_InputType.FreeType:
                case ENUM_ClinicalField_InputType.Number:
                  field.PreviewConfig.FieldData = JSON.parse(JSON.stringify(clinicalInfosForField));
                  break;

                case ENUM_ClinicalField_InputType.SingleSelection:
                case ENUM_ClinicalField_InputType.MultipleSelect:
                  field.PreviewConfig.FieldData = JSON.parse(JSON.stringify(clinicalInfosForField.filter(info => info.ClinicalOptionsData && info.ClinicalOptionsData.length > 0)));
                  break;
                case ENUM_ClinicalField_InputType.Questionnaire:
                  field.QuestionaryConfig.forEach(question => {

                    const questionAnsData: ClinicalQuestionAnswer_DTO[][] = JSON.parse(JSON.stringify(clinicalInfosForField.map(cliInfo => {
                      if (Array.isArray(cliInfo.ClinicalAnswerData))
                        return cliInfo.ClinicalAnswerData
                      else
                        return []
                    }).filter(data => data && data.length > 0)));

                    const clinicalQOptionsData: ClinicalQuestionOption_DTO[][] = JSON.parse(JSON.stringify(clinicalInfosForField.map(cliInfo => {
                      if (Array.isArray(cliInfo.ClinicalAnswerOptionData))
                        return cliInfo.ClinicalAnswerOptionData
                      else
                        return []
                    }).filter(data => data && data.length > 0)));

                    switch (question.AnswerType) {
                      case ENUM_ClinicalField_InputType.Textbox:
                      case ENUM_ClinicalField_InputType.FreeType:
                        question.ClinicalQuestionAnswers = this.extractTextAnswers(questionAnsData, question.QuestionId);
                        break;

                      case ENUM_ClinicalField_InputType.SingleSelection:
                      case ENUM_ClinicalField_InputType.MultipleSelect:
                        question.ClinicalQuestionOptions = this.extractSelectionAnswers(clinicalQOptionsData, question.QuestionId);
                        break;

                      default:
                        console.warn('Unsupported AnswerType:', question.AnswerType);
                        break;
                    }
                  });
              }
            });

          section.Form = new FormGroup({});
        });
      }

    });
  }
  private extractTextAnswers(cliInfosForQuestion, questionId): any[] {
    const qAnswers = [];
    if (Array.isArray(cliInfosForQuestion))
      cliInfosForQuestion.forEach(cliInfo => {
        if (Array.isArray(cliInfo)) {
          const qans = cliInfo.find(ansdata => ansdata.QuestionId === questionId);
          if (qans) {
            qAnswers.push(qans);
          }
        }
      });
    return qAnswers;
  }

  private extractSelectionAnswers(cliInfosForQuestion, questionId): any[] {
    const qAnswerOptions = [];
    if (Array.isArray(cliInfosForQuestion))
      cliInfosForQuestion.forEach(cliInfo => {
        if (Array.isArray(cliInfo)) {
          const qans = cliInfo.filter(ansdata => ansdata.QuestionId === questionId);
          if (qans.length > 0) {
            qAnswerOptions.push({
              QuestionOptions: qans
            });
          }
        }
      });
    return qAnswerOptions;
  }




  /**
   * Copies selected data into the required format for printing.
   * This code selects data inside out, meaning top hierarchy labels will not be included
   * if no data is selected in the lower hierarchy.
   */
  OnPrint(): void {
    this.PrintableDocuments = [];
    if (this.FilteredClinicalFieldConfig && this.FilteredClinicalFieldConfig.length > 0) {
      this.FilteredClinicalFieldConfig.forEach(document => {
        let doc = new PDocument();
        doc.DocumentName = document.DisplayName;
        doc.Sections = new Array<PSection>();

        let isDocumentPrintable = false;

        document.ChildHeading.forEach(section => {
          let sec = new PSection();
          sec.SectionName = section.DisplayName;
          sec.Fields = new Array<PField>();
          let isSectionPrintable = false;

          section.Field.forEach(field => {
            let fie = new PField();
            if (field.IsDisplayTitle) {
              fie.FieldName = field.FieldDisplayName;
            }
            else {
              delete fie.FieldName; // Removes FieldName property from the object
            }
            fie.Type = field.InputType;
            fie.IsAcrossVisitAvailability = field.IsAcrossVisitAvailability;
            fie.Answers = new Array<PAnswers>();
            fie.Options = new Array<POptions>();
            fie.Questionary = new Array<PQuestionary>();

            let isFieldPrintable = false;
            if (field.InputType === ENUM_ClinicalField_InputType.Textbox || field.InputType === ENUM_ClinicalField_InputType.FreeType || field.InputType === ENUM_ClinicalField_InputType.Number) {

              let fieldAnswers = new Array<PAnswers>();
              field.PreviewConfig.FieldData.forEach(data => {
                if (data.IsPrintable || !this.IsCustomizable) {
                  isFieldPrintable = true;
                  fieldAnswers.push({ Answer: data.FieldValue, Remark: data.Remarks, Date: data.CreatedOn });
                }

              });
              fie.Answers = fieldAnswers;

            } else if (field.InputType === ENUM_ClinicalField_InputType.SingleSelection || field.InputType === ENUM_ClinicalField_InputType.MultipleSelect) {
              let fieldOptions = Array<POptions>();
              field.PreviewConfig.FieldData.forEach(data => {
                if (data.IsPrintable || !this.IsCustomizable) {
                  isFieldPrintable = true;
                  let options = new Array<string>();
                  data.ClinicalOptionsData.forEach(option => {
                    options.push(option.Options);
                  });
                  fieldOptions.push({ Options: options, Remark: data.Remarks, Date: data.CreatedOn });
                }

              });
              fie.Options = fieldOptions;
            } else if (field.InputType === ENUM_ClinicalField_InputType.SmartTemplate) {
              if (field.Pretemplate && (field.Pretemplate in this.PreTemplateDataViewMapping)) {
                if (field.PreviewConfig.IsPrintable || !this.IsCustomizable) {
                  isFieldPrintable = true;
                  fie.FieldConfig = field.FieldConfig;
                }
              }


            } else if (field.InputType === ENUM_ClinicalField_InputType.SmartPrintableForm) {
              if (field.PreviewConfig.IsPrintable || !this.IsCustomizable) {
                isFieldPrintable = true;
                fie.FieldConfig = field.FieldConfig;
              }
            } else if (field.InputType === ENUM_ClinicalField_InputType.Questionnaire) {
              let questionary = [];
              field.QuestionaryConfig.forEach(question => {
                let que = new PQuestionary();
                que.FieldName = question.Question;
                que.Type = question.AnswerType;
                que.Answers = new Array<PAnswers>();
                que.Options = new Array<POptions>();

                let isQuestionaryPrintable = false;
                if (question.AnswerType === ENUM_ClinicalField_InputType.Textbox || question.AnswerType === ENUM_ClinicalField_InputType.FreeType || question.AnswerType === ENUM_ClinicalField_InputType.Number) {

                  let fieldAnswers = new Array<PAnswers>();
                  question.ClinicalQuestionAnswers.forEach(answer => {
                    if (answer.IsPrintable || !this.IsCustomizable) {
                      isQuestionaryPrintable = true;
                      fieldAnswers.push({ Answer: answer.AnswerValue, Remark: answer.Remarks, Date: answer.CreatedOn });
                    }
                  });
                  que.Answers = fieldAnswers;

                } else if (question.AnswerType === ENUM_ClinicalField_InputType.SingleSelection || question.AnswerType === ENUM_ClinicalField_InputType.MultipleSelect) {

                  let fieldOptions = Array<POptions>();
                  question.ClinicalQuestionOptions.forEach(ansOptions => {
                    if (ansOptions.IsPrintable || !this.IsCustomizable) {
                      isQuestionaryPrintable = true;
                      let options = new Array<string>();
                      ansOptions.QuestionOptions.forEach(option => {
                        options.push(option.QuestionOption);
                      });
                      fieldOptions.push({
                        Options: options,
                        Remark: ansOptions.QuestionOptions[0].Remarks,
                        Date: ansOptions.QuestionOptions[0].CreatedOn
                      });
                    }
                  });
                  que.Options = fieldOptions;


                }
                if (isQuestionaryPrintable) {
                  isFieldPrintable = true;
                  questionary.push(que);
                }

              });
              fie.Questionary = questionary;
            }


            if (isFieldPrintable) {
              isSectionPrintable = true;
              sec.Fields.push(fie);
            }
          });

          if (isSectionPrintable) {
            isDocumentPrintable = true;
            doc.Sections.push(sec);
          }
        });

        if (isDocumentPrintable) {
          this.PrintableDocuments.push(doc);
        }
      });
    }
    this.ShowPrintPopUp();

    /*
       Follwing is the print data object structure   --Yogesh kept here for me, to visualize
    */
    // let PrintableContent = [
    //     {
    //         DocumentName: 'document1',
    //         Sections: [
    //             {
    //                 SectionName: 'section1',
    //                 Fields: [
    //                     {
    //                         FieldName: 'field1',
    //                         FieldConfig: { },
    //                         Type: 'any',
    //                         Answers: [
    //                             { Answer: '', Remark: '', Date: '' }
    //                         ],
    //                         options: [{ option: ['', ''], Remark: '', Date: ''}],
    //                         Questionary: [
    //                             {
    //                                 FieldName: '',
    //                                 Type: '',
    //                                 Answers: [
    //                                     { Answer: '', Remark: '', }
    //                                 ],
    //                                 Options: [
    //                                     { option: ['', ''], Remark: '', Date: ''}
    //                                 ]
    //                             }
    //                         ]

    //                     }
    //                 ]
    //             }
    //         ]

    //     }
    // ];
  }


  /**
   * Automatically checks elements in the lower hierarchy when the document's print state changes.
   *
   * @param {ParentHeading_DTO} document - The document whose print state has changed.
   */
  OnDocumentPrintChange(document: ParentHeading_DTO): void {
    if (document) {
      if (document.ChildHeading && document.ChildHeading.length > 0) {
        document.ChildHeading.forEach(section => {
          section.IsPrintable = document.IsPrintable;
          this.OnSectionPrintChange(section);
        });
      }
    }

  }

  /**
   * Automatically checks elements in the lower hierarchy when the section's print state changes.
   *
   * @param {ChildHeading} section - The section whose print state has changed.
   */
  OnSectionPrintChange(section: ChildHeading): void {

    if (section && section.Field && section.Field.length > 0) {
      section.Field.forEach(field => {
        field.PreviewConfig.IsPrintable = section.IsPrintable;
        this.OnQuestionaryPrintChange(field);
        this.OnFieldPrintChange(field);
      });
    }

  }

  /**
   * Updates the print state of field data based on the field's print state.
   *
   * @param {Field} field - The field whose print state has changed.
   */
  OnFieldPrintChange(field: Field): void {
    if (field) {
      if (field.PreviewConfig && field.PreviewConfig.FieldData && field.PreviewConfig.FieldData.length > 0) {
        field.PreviewConfig.FieldData.forEach(data => {
          data.IsPrintable = field.PreviewConfig.IsPrintable;
        });
      }
    }

  }

  /**
   * Updates the print state of questions based on the field's print state.
   *
   * @param {Field} field - The field containing the questions whose print state has changed.
   */
  OnQuestionaryPrintChange(field: Field): void {
    if (field && field.QuestionaryConfig && field.QuestionaryConfig.length > 0)
      field.QuestionaryConfig.forEach(question => {
        question.PreviewConfig.IsPrintable = field.PreviewConfig.IsPrintable;
        this.OnQuestionaryFieldPrintChange(question);
      });
  }

  /**
   * Updates the print state of question answers or options based on the question's print state.
   *
   * @param {QuestionaryConfig} question - The question whose print state has changed.
   */
  OnQuestionaryFieldPrintChange(question: QuestionaryConfig): void {
    if (question) {
      if (question.AnswerType === ENUM_ClinicalField_InputType.SingleSelection || question.AnswerType === ENUM_ClinicalField_InputType.MultipleSelect) {
        if (question.ClinicalQuestionOptions.length > 0) {
          question.ClinicalQuestionOptions.forEach(ans => {
            ans.IsPrintable = question.PreviewConfig.IsPrintable;
          });
        }
      } else if (question.AnswerType === ENUM_ClinicalField_InputType.Textbox || question.AnswerType === ENUM_ClinicalField_InputType.FreeType || question.AnswerType === ENUM_ClinicalField_InputType.Number) {
        if (question.ClinicalQuestionAnswers.length > 0) {
          question.ClinicalQuestionAnswers.forEach(ans => {
            ans.IsPrintable = question.PreviewConfig.IsPrintable;
          });
        }
      }
    }

  }

  /**
   * Toggles the active state of a document.
   *
   * @param {ParentHeading_DTO} document - The document whose active state is being toggled.
   */
  ToggleDocument(document: ParentHeading_DTO): void {
    document.ActiveTab = !document.ActiveTab;
  }


  /**
   * Displays the print page pop-up.
   */
  ShowPrintPopUp(): void {
    this.ShowPrintPagePopUp = true;
  }

  /**
   * Hides the print page pop-up.
   */
  ClosePopup(): void {
    this.ShowPrintPagePopUp = false;
  }


  /**
   * Prints the clinical data by constructing an HTML document and triggering the print dialog.
   */
  PrintClinicalData(): void {
    this.Loading = true;

    const printableContent = this._elementRef.nativeElement.querySelector('#printableContent');

    if (printableContent) {
      const printContent = printableContent.innerHTML;

      // Construct the document content for printing
      const documentContent = `
                <html>
                    <head>
                        <title>Print Clinical Preview</title>
                          <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/ClinicalNewPrintStyle.css"/>
                          <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                        <style>
                            .p-document {
                                padding-left: 12px;
                            }

                            .p-section {
                                margin-left: 12px;

                            }

                            .p-field {
                                margin-left: 12px;

                            }

                            .p-field-data-container {
                                margin: 4px;
                            }

                            .p-doc-title {
                                font-size: 1.6rem;
                                font-weight: bold;
                            }

                            .p-sec-title {
                                font-size: 1.4rem;
                                font-weight: bold;
                            }

                            .p-field-title {
                                font-size: 1.3rem;
                                font-weight: bold;
                                margin: 0px;
                                padding: 0px;
                            }

                            .p-print-data {
                                font-size: 1.3rem;
                            }

                            .p-questionary {
                                margin-left: 8px;
                            }

                            .col-sn {
                                width: 5%;
                            }

                            .col-date {
                                width: 15%;
                            }

                            .col-details {
                                width: 80%;
                            }
                            .table-container table thead tr th{
                                font-size: 1.3rem;
                            }
                            .table-container table tbody tr td{
                                font-size: 1.3rem;
                            }
                          @media print {
                                @page {
                                    size: A4;
                                    margin: 10mm 8mm 10mm 8mm;
                                }
                          }

                        }
                        </style>
                    </head>
                    <body onload="window.print()">${printContent}</body>
                </html>
            `;

      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(documentContent);
      iframe.contentWindow.document.close();

      setTimeout(() => {
        document.body.removeChild(iframe);
        this.Loading = false;
      }, 500);
    } else {
      this.Loading = false;
      console.error('Printable content not found.');
    }
  }




  /* Following code is used in Filters */
  /**
   * Creates a list of documents from the clinical field configuration.
   * This list contains the display name and ID of each document.
   */
  CreateDocumentList(): void {
    this.DocumentList = this.ClinicalFieldConfig.map(document => {
      return {
        Name: document.DisplayName,
        Id: document.ClinicalHeadingId
      };
    });
  }

  /**
   * Handles changes in the selected document.
   * Resets the selected section and medical components, and updates the section list based on the selected document.
   */
  OnDocumentChange(): void {
    this.SelectedSection = 0;
    this.SelectedMedicalComponent = 0;
    this.SectionList = [];
    this.MedicalComponentList = [];

    if (this.ClinicalFieldConfig && this.ClinicalFieldConfig.length > 0) {
      let doc = this.ClinicalFieldConfig.find(doc => doc.ClinicalHeadingId === Number(this.SelectedDocument));
      if (doc) {
        this.SectionList = doc.ChildHeading.map(sec => {
          return {
            Name: sec.DisplayName,
            Id: sec.ClinicalHeadingId
          };
        });
      }
    }


  }

  /**
   * Handles changes in the selected section.
   * Resets the selected medical component and updates the medical component list based on the selected section.
   */
  OnSectionChange(): void {
    this.SelectedMedicalComponent = 0;
    this.MedicalComponentList = [];
    if (this.ClinicalFieldConfig && this.ClinicalFieldConfig.length > 0) {
      let doc = this.ClinicalFieldConfig.find(doc => doc.ClinicalHeadingId === Number(this.SelectedDocument));
      if (doc) {
        let sec = doc.ChildHeading.find(sec => sec.ClinicalHeadingId === Number(this.SelectedSection));
        if (sec) {
          if (sec.Field) {
            this.MedicalComponentList = sec.Field.map(field => ({ Name: field.FieldDisplayName, Id: field.FieldId }));
          }
        }
      }
    }
  }


  /**
  * there are two lists for holding heading config with data
  * the one used in following code is partial copy of parent.
  * -the parent list holds all data.
  * -the filtered list holds references of fields from parent list.
  * -the document and section details are copies and fields are actual references from the parent list
  */

  OnFilter(): void {
    this.FilteredClinicalFieldConfig = new Array<ParentHeading_DTO>();
    if (Number(this.SelectedDocument) && this.ClinicalFieldConfig && this.ClinicalFieldConfig.length > 0) {
      let doc = this.ClinicalFieldConfig.find(doc => doc.ClinicalHeadingId === Number(this.SelectedDocument));
      if (doc) {
        let newDoc = {
          ClinicalHeadingId: doc.ClinicalHeadingId,
          ClinicalHeadingName: doc.ClinicalHeadingName,
          DisplayName: doc.DisplayName,
          DisplayOrder: doc.DisplayOrder,
          ParentId: doc.ParentId,
          Field: doc.Field,
          ActiveTab: doc.ActiveTab,
          IsDefault: false,
          ChildHeading: []
        };

        if (Number(this.SelectedSection)) {
          let sec = doc.ChildHeading.find(sec => sec.ClinicalHeadingId === Number(this.SelectedSection));
          if (sec) {
            newDoc.ChildHeading = [{
              ClinicalHeadingId: sec.ClinicalHeadingId,
              ClinicalHeadingName: sec.ClinicalHeadingName,
              DisplayName: sec.DisplayName,
              DisplayOrder: sec.DisplayOrder,
              ParentId: sec.ParentId,
              IsDefault: false,
              Field: []
            }];

            if (Number(this.SelectedMedicalComponent)) {
              newDoc.ChildHeading[0].Field = sec.Field.filter(comp => comp.FieldId === Number(this.SelectedMedicalComponent));
            } else {
              newDoc.ChildHeading[0].Field = sec.Field;
            }
          }
        } else {
          newDoc.ChildHeading = doc.ChildHeading;
        }
        this.FilteredClinicalFieldConfig.push(newDoc);
      }
    } else {
      this.FilteredClinicalFieldConfig = this.ClinicalFieldConfig;
    }
  }

  /**
   * Reloads the pre-template with the selected visit details.
   * Updates the patient visit ID in the pre-template detail and triggers change detection.
   */
  ReloadPreTemplate(): void {
    this.PreTemplatePatientDetail.PatientVisitId = this.SelectedVisit;
    console.log('reload Pre template');
    this.PreTemplateReloader = false;
    // Force change detection
    this._changeDetectorRef.detectChanges();

    // Delay to ensure proper reloading
    setTimeout(() => {
      this.PreTemplateReloader = true;
      this._changeDetectorRef.detectChanges();
    }, 0);
  }
}

