import { Component, ElementRef, EventEmitter, OnInit, Output } from '@angular/core';
import { EmployeeListDTO } from '../../../../clinical-settings/shared/dto/employee-list.dto';
import { ENUM_ClinicalField_InputType } from '../../../../shared/shared-enums';
import { NoteField, NoteQuestionary } from '../dto/clilnical-notes.dto';

@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.css']
})
export class NoteComponent implements OnInit, IDynamicTab {
  DataContext: NoteField[];
  @Output() OpenTab: EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean; }> = new EventEmitter<{ title: string, template: any, data: any, isCloseable?: boolean; }>();

  ENUMClinicalFieldInputType = ENUM_ClinicalField_InputType;

  ShowPrintPagePopUp: boolean = false;
  PrintableNoteFields: NoteField[] = [];
  SelectedDoctors: EmployeeListDTO[] = [];
  public SelectedNurseName: string = '';
  public SelectedCheckedByName: string = '';
  public SelectedPreparedByName: string = '';
  public SelectedPreparedByNMCNo: string = '';
  public SelectedCheckedByNMCNo: string = '';
  public IsCustomizable: boolean = false;
  constructor(
    private _elementRef: ElementRef,

  ) {

  }


  ngOnInit() {

    // this.RemoveEmptyFields();

  }
  OnDoctorSelected(doctors: EmployeeListDTO[]) {
    this.SelectedDoctors = doctors;
  }
  OnNurseSelected(nurse: EmployeeListDTO) {
    this.SelectedNurseName = nurse.EmployeeName;
  }

  /**
   * This function filters out empty fields and questions from PrintableNoteFields.
   * - For non-questionary fields (Textbox, FreeType, Number, SingleSelection, MultipleSelect, SmartTemplate):
   *    - If the field has answers or options, it is kept.
   * - For questionary fields:
   *    - Each question within the field is checked.
   *    - If a question has answers or options, it is kept.
   *    - If no questions remain after filtering, the entire field is removed.
   * - The resulting fields are assigned back to PrintableNoteFields.
   */
  RemoveEmptyFields() {
    if (this.DataContext && this.DataContext.length > 0) {
      this.PrintableNoteFields = this.DataContext.map(field => {
        let fie: NoteField;
        if (field.InputType !== this.ENUMClinicalFieldInputType.Questionnaire) {
          if (field.InputType === this.ENUMClinicalFieldInputType.Textbox || field.InputType === this.ENUMClinicalFieldInputType.FreeType || field.InputType === this.ENUMClinicalFieldInputType.Number) {
            if (field.Answers && field.Answers.length > 0) {
              fie = JSON.parse(JSON.stringify(field));
              if (this.IsCustomizable) {
                fie.Answers = fie.Answers.filter(ans => ans.IsPrintable === true);
                if (fie.Answers.length === 0)
                  fie = undefined;
              }

            }

          } else if (field.InputType === this.ENUMClinicalFieldInputType.SingleSelection || field.InputType === this.ENUMClinicalFieldInputType.MultipleSelect) {
            if (field.Options && field.Options.length > 0) {
              fie = JSON.parse(JSON.stringify(field));
              if (this.IsCustomizable) {
                fie.Options = fie.Options.filter(opt => opt.IsPrintable === true);
                if (fie.Options.length === 0) {
                  fie = undefined;
                }
              }
            }
          } else if (field.InputType === this.ENUMClinicalFieldInputType.SmartTemplate || field.InputType === this.ENUMClinicalFieldInputType.SmartPrintableForm) {
            if (this.IsCustomizable) {
              if (field.IsPrintable) {
                fie = field;
              }
            } else {
              fie = field;
            }


          }

        } else if (field.InputType === this.ENUMClinicalFieldInputType.Questionnaire) {
          fie = JSON.parse(JSON.stringify(field));
          fie.Questions = field.Questions.map(question => {
            let que: NoteQuestionary;
            if (question.AnswerType === this.ENUMClinicalFieldInputType.Textbox || question.AnswerType === this.ENUMClinicalFieldInputType.FreeType) {
              if (question.Answers && question.Answers.length > 0) {
                que = JSON.parse(JSON.stringify(question));
                if (this.IsCustomizable) {
                  que.Answers = que.Answers.filter(ans => ans.IsPrintable === true);
                  if (que.Answers.length === 0)
                    que = undefined;
                }
              }
            } else if (question.AnswerType === this.ENUMClinicalFieldInputType.SingleSelection || question.AnswerType === this.ENUMClinicalFieldInputType.MultipleSelect) {
              if (question.Options && question.Options.length > 0) {
                que = JSON.parse(JSON.stringify(question));
                if (this.IsCustomizable) {
                  que.Options = que.Options.filter(opt => opt.IsPrintable === true);
                  if (que.Options.length === 0) {
                    que = undefined;
                  }
                }
              }

            }
            return que;
          }).filter(question => question !== undefined);

          if (!fie.Questions.length) {
            fie = undefined;
          }
        }

        return fie;
      }).filter(field => field !== undefined);
    }

  }

  /**
 * Displays the print page pop-up.
 */
  ShowPrintPopUp(): void {
    this.RemoveEmptyFields();
    this.ShowPrintPagePopUp = true;
  }

  /**
   * Hides the print page pop-up.
   */
  ClosePopup(): void {
    this.ShowPrintPagePopUp = false;
    this.SelectedDoctors = [];
    this.SelectedNurseName = '';
    this.SelectedCheckedByName = '';
    this.SelectedPreparedByName = '';
    this.SelectedCheckedByNMCNo = '';
    this.SelectedPreparedByNMCNo = '';

  }

  /**
 * Prints the clinical data by constructing an HTML document and triggering the print dialog.
 */
  PrintClinicalData(): void {

    const printableContent = this._elementRef.nativeElement.querySelector('#printableContent');

    if (printableContent) {
      const printContent = printableContent.innerHTML;
      const nurseName = this.SelectedNurseName || '';
      const preparedBy = this.SelectedPreparedByName || '';
      const checkedBy = this.SelectedCheckedByName || '';
      const checkedBynmcNo = this.SelectedCheckedByNMCNo || '';
      const preparedBynmcNo = this.SelectedPreparedByNMCNo || '';



      // Construct the document content for printing
      let documentContent = `
                  <html>
                      <head>
                          <title>Print Clinical Preview</title>
                          <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/ClinicalNewPrintStyle.css"/>
                          <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
                          <style>
                          @media print {
                                @page {
                                    size: A4;
                                    margin: 10mm 8mm 10mm 8mm;
                                  padding-bottom: 50px;
                                }
                          }       
                       </style>
                      </head>
                     <body onload="window.print()">

                    <div id="printableContent">${printContent}</div>
                    <div class="print-header">
                      <div class="row signaturecontainer">`;
      if (nurseName && nurseName.trim() !== "") {
        documentContent += `<div class="col-md-12 signatureright nurse-content" id="note_signature_nurse">
                                <h5><b>NURSE</b></h5>
                                <div class="content-margin">
                                    <span><b>Name:</b> ${nurseName}</span><br/>
                                    <span><b>Signature:</b> __________________________</span>
                                </div>
                            </div>`;
      }

      if (this.SelectedDoctors.length > 0) {
        documentContent += `
          <div class="col-md-12 signatureright consultant-content" id="note_signature_consultant">
            <h5 class="consultant-label"><b>CONSULTANT</b></h5>
            <div class="display-consultant-content">
              ${this.SelectedDoctors.map((doctor, index) => `
                <div class="consultant-content-margin">
                  <span><b>${index + 1}. Dr Name:</b> ${doctor.EmployeeName}</span><br/>
                  <span><b>NMC Number:</b> ${doctor.MedCertificationNo}</span><br/>
                  <span><b>Signature:</b> __________________________</span>
                </div>
              `).join('')}
            </div>
          </div>`;
      }
      if (checkedBy && checkedBy.trim() !== "") {
        documentContent += ` <div class="col-md-12 signatureright checkedBy-content" id="note_signature_checked_by">
                                <h5><b>CHECKED BY</b></h5>
                                <div class="content-margin">
                                    <span><b>Name:</b> ${checkedBy}</span><br/>
                                    <span><b>NMC Number:</b> ${checkedBynmcNo}</span><br/>
                                    <span><b>Signature:</b> __________________________</span>
                                </div>
                            </div>`;
      }

      if (preparedBy && preparedBy.trim() !== "") {
        documentContent += ` <div class="col-md-12 signatureright preparedBy-content"  id="note_signature_prepared_by">
                                <h5><b>PREPARED BY</b></h5>
                                <div class="content-margin">
                                    <span><b>Name:</b> ${preparedBy}</span><br/>
                                    <span><b>NMC Number:</b> ${preparedBynmcNo}</span><br/>
                                    <span><b>Signature:</b> __________________________</span>
                                </div>
                            </div>`;
      }
      documentContent += `
                        </div>
                      </div>
                    </body>
                  </html>
              `;

      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(documentContent);
      iframe.contentWindow.document.close();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 500);
    } else {
      console.error('Printable content not found.');
    }
  }

  OnSelectField(field: NoteField) {
    if (field) {
      if (field.InputType === this.ENUMClinicalFieldInputType.Textbox || field.InputType === this.ENUMClinicalFieldInputType.FreeType || field.InputType === this.ENUMClinicalFieldInputType.Number) {
        field.Answers.forEach(answer => {
          answer.IsPrintable = field.IsPrintable;
        });
      } else if (field.InputType === this.ENUMClinicalFieldInputType.SingleSelection || field.InputType === this.ENUMClinicalFieldInputType.MultipleSelect) {
        field.Options.forEach(option => {
          option.IsPrintable = field.IsPrintable;
        });
      } else if (field.InputType === this.ENUMClinicalFieldInputType.Questionnaire) {
        field.Questions.forEach(question => {
          question.IsPrintable = field.IsPrintable;
          this.OnSelectQuestion(question);
        });
      }
    }
  }
  OnSelectQuestion(question: NoteQuestionary) {
    if (question) {
      if (question.AnswerType === this.ENUMClinicalFieldInputType.Textbox || question.AnswerType === this.ENUMClinicalFieldInputType.FreeType || question.AnswerType === this.ENUMClinicalFieldInputType.Number) {
        question.Answers.forEach(answer => {
          answer.IsPrintable = question.IsPrintable;
        });
      } else if (question.AnswerType === this.ENUMClinicalFieldInputType.SingleSelection || question.AnswerType === this.ENUMClinicalFieldInputType.MultipleSelect) {
        question.Options.forEach(option => {
          option.IsPrintable = question.IsPrintable;
        });
      }
    }
  }

  OnCheckedBySelected(CheckedBy: EmployeeListDTO) {
    this.SelectedCheckedByName = CheckedBy.EmployeeName;
    this.SelectedCheckedByNMCNo = CheckedBy.MedCertificationNo;
  }
  OnPreparedBySelected(PreparedBy: EmployeeListDTO) {
    this.SelectedPreparedByName = PreparedBy.EmployeeName;
    this.SelectedPreparedByNMCNo = PreparedBy.MedCertificationNo;
  }

}
