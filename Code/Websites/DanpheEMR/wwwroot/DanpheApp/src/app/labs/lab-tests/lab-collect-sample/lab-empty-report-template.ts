import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as _ from 'lodash';
import { CoreService } from "../../../core/shared/core.service";
import { DanpheHTTPResponse } from "../../../shared/common-models";
import { ENUM_DanpheHTTPResponses, ENUM_LabTemplateType } from "../../../shared/shared-enums";
import { LabReportVM } from "../../reports/lab-report-vm";
import { LabTestComponent } from '../../shared/lab-component.model';
import { LabResult_TestVM } from '../../shared/lab-view.models';
import { LabsBLService } from '../../shared/labs.bl.service';

@Component({
  selector: 'empty-add-report',
  templateUrl: "./lab-empty-report-template.html",
  styleUrls: ['./lab-empty-report-style.css']
})

export class LabTestsEmptyAddReportComponent {
  @Input("allReqIdListForPrint") allReqIdListForPrint = new Array<number>();
  @Output("closeEmptyReport") closeEmptyReport: EventEmitter<Object> = new EventEmitter<Object>();

  public templateReport: LabReportVM;
  public ckHtmlContent: string = null;
  public hasInsurance: boolean = false;
  public showBarCode: boolean = false;
  public hospitalCode: string = '';
  public TemplateReportList: Array<LabReportVM> = new Array<LabReportVM>();
  PrintSheetConfig = { "ShowEmptyReportSheet": false, "ShowReportTemplateWiseSegregation": false, "ShowCultureTestComponents": false };


  constructor(public labBLService: LabsBLService, public coreService: CoreService) {
    this.showBarCode = this.coreService.ShowBarCodeInLabReport();
    this.hospitalCode = this.coreService.GetHospitalCode();
    if (!this.hospitalCode) {
      this.hospitalCode = 'default-lab-report';
    }
    this.PrintSheetConfig = this.coreService.ShowEmptyReportSheetPrint();
  }

  ngOnInit() {
    this.LoadLabReports();
  }

  public LoadLabReports() {
    this.TemplateReportList = [];
    this.labBLService.GetReportFromReqIdList(this.allReqIdListForPrint)
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results) {
          this.templateReport = res.Results;
          if (this.PrintSheetConfig.ShowReportTemplateWiseSegregation) {
            this.templateReport.Templates.forEach(template => {
              let temp = _.cloneDeep(this.templateReport);
              temp.Templates = [];
              temp.Templates.push(template);
              this.TemplateReportList.push(temp);
            });
          }
          else {
            this.TemplateReportList.push(this.templateReport);
          }
          this.MapTestAndComponents();
        }
      });
  }

  public MapTestAndComponents() {
    this.TemplateReportList.forEach(temp => {
      if (temp.Templates.length) {
        temp.Templates.forEach(template => {
          let testList = new Array<LabResult_TestVM>();
          template.Tests.forEach(labTest => {
            if (labTest.HasInsurance) {
              this.hasInsurance = labTest.HasInsurance;
            }
            //To check if the new Custom Component is added and there is empty ComponentJSON
            if (labTest.ComponentJSON && labTest.ComponentJSON.length == 0 && labTest && labTest.Components.length > 0) {
              var comp: LabTestComponent = new LabTestComponent();
              for (var i = 0; i < labTest.Components.length; i++) {
                var compArray: Array<LabTestComponent> = [];

                comp.ComponentName = labTest.Components[i].ComponentName;
                compArray.push(comp);
              }
              labTest.ComponentJSON = compArray;
              labTest.ComponentJSON.sort(function (a, b) { return a.DisplaySequence - b.DisplaySequence });
            }
            let newLabtestVm: LabResult_TestVM = new LabResult_TestVM();
            newLabtestVm = Object.assign(newLabtestVm, labTest);
            newLabtestVm.Components = new Array<LabTestComponent>();

            let length = labTest.Components.length;

            labTest.ComponentJSON.forEach(component => {

              var _testComponent: LabTestComponent = new LabTestComponent();
              if (component) {
                _testComponent = Object.assign(_testComponent, component);
                _testComponent.ComponentName = component.ComponentName;
                _testComponent.LabTestId = labTest.LabTestId;

                if (template.TemplateType === ENUM_LabTemplateType.Html) {
                  //_testComponent.Value = this.templateReport.TemplateHTML;
                  this.ckHtmlContent = temp.TemplateHTML;
                }
                if (template.TemplateType === ENUM_LabTemplateType.Culture) {
                  _testComponent.IsSelected = false;
                  newLabtestVm.SelectAll = false;
                }

                if (newLabtestVm.VendorDetail && !newLabtestVm.VendorDetail.IsDefault) {
                  newLabtestVm.SelectAll = false;
                  _testComponent.IsSelected = false;
                }

                _testComponent.RequisitionId = labTest.RequisitionId;
                _testComponent.TemplateId = template.TemplateId;
              }
              newLabtestVm.Components.push(_testComponent);
              newLabtestVm.Components.sort((a, b) => {
                if (a.DisplaySequence > b.DisplaySequence) return 1;
                if (a.DisplaySequence < b.DisplaySequence) return -1;
                return 0;
              });
            });
            if (template.TemplateType === ENUM_LabTemplateType.Culture) {
              let components = _.cloneDeep(newLabtestVm.Components);
              newLabtestVm.Components = this.GroupColumns(components);
              console.log(newLabtestVm.Components);
            }
            testList.push(newLabtestVm);
          });
          template.Tests = testList;
        });
      }
    });
  }

  public Close() {
    this.closeEmptyReport.emit({ close: true });
  }

  public PrintSheet() {
    let popupWinindow;
    if (document.getElementById("emptyTestReportSheet")) {
      var printContents = document.getElementById("emptyTestReportSheet").innerHTML;
    }
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    var documentContent = `<html><head> 
                          <style>
                          @media print {
                            table.border-test tbody tr {
                                border: 1px solid black;
                                border-top: none;
                            }
                        }
                          </style>`;
    documentContent += `<link rel="stylesheet" type="text/css" href="../../../../../../themes/theme-default/DanphePrintStyle.css" /></head>`;

    documentContent += '<body class="lab-rpt4moz" onload="window.print()">' + printContents + '</body></html>';
    popupWinindow.document.write(documentContent);
    popupWinindow.document.close();
  }

  GroupColumns(arrays: any) {
    let arr = arrays.filter(a => a.ShowInSheet);
    const newRows = [];
    for (let index = 0; index < arr.length; index += 2) {
      newRows.push(arr.slice(index, index + 2));
    }
    return newRows;
  }
}
