import { Injectable } from '@angular/core';
import { DanpheHTTPResponse } from '../../../app/shared/common-models';
import { MessageboxService } from '../../../app/shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../app/shared/shared-enums';
import { CoreService } from "../../core/shared/core.service";
import { ImagingBLService } from './imaging.bl.service';
import { TemplateStyleModel } from './template-style-model';
@Injectable()
export class RadiologyService {
  //public enableImgUpload: boolean;
  //headertype=('image' or 'text-formatted'). This is to determine whether to show customer header in radiology report'
  public ReportHeader = { show: false, headerType: "image" };
  public selectedImagingType: number = 0;
  public TemplateStyleList = new Array<TemplateStyleModel>();


  constructor(public coreService: CoreService, public imagingBLService: ImagingBLService, public messageBoxService: MessageboxService) {
    //this.enableImgUpload = this.coreService.GetRadImgUploadConfig();
    //this.showCustomerHeader = this.coreService.GetCustomerHeaderViewConfig();
    this.ReportHeader = this.GetReportHeaderParam();
  }

  public setSelectedImagingType(typeId: number) {
    this.selectedImagingType = typeId;
  }

  //sud: 4thJan'18--moved from core-service to radiology service.. 
  public GetReportHeaderParam() {
    let retVal = { show: false, headerType: "image" };
    var currParameter = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "RadReportCustomerHeader")
    if (currParameter) {
      retVal = JSON.parse(currParameter.ParameterValue);
    }

    return retVal;

  }


  public GetImageUploadFolderPath() {
    let retVal: string = null;
    var currParameter = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "ReportImagesFolderPath")
    if (currParameter) {
      retVal = currParameter.ParameterValue;
    }
    return retVal;
  }

  public EnableDicomImages(): boolean {
    let retVal: boolean = false;
    var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "EnableDicomImages");
    if (currParam && currParam.ParameterValue && currParam.ParameterValue.toLowerCase() == "true") {
      retVal = true;
    }
    return retVal;
  }


  public EnableImageUpload(): boolean {
    let retVal: boolean = false;
    var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "EnableImageUpload");
    if (currParam && currParam.ParameterValue && currParam.ParameterValue.toLowerCase() == "true") {
      retVal = true;
    }
    return retVal;
  }



  public GetExtReferrerSettings() {
    var currParam = this.coreService.Parameters.find(a => a.ParameterGroupName == "Radiology" && a.ParameterName == "ExternalReferralSettings");
    if (currParam && currParam.ParameterValue) {
      return JSON.parse(currParam.ParameterValue);
    }
    else {
      return { EnableExternal: true, DefaultExternal: false, AllowFreeText: true };
    }
  }

  public GetTemplatesStyles(): void {
    this.imagingBLService.GetTemplatesStyles().subscribe(
      (res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK && res.Results.length > 0) {
          this.TemplateStyleList = res.Results.filter(temp => temp.IsActive === true);
          if (this.TemplateStyleList.length === 0) {
            this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["No Active template styles found, Please Add Template Styles from Setting."]);
          }
        } else {
          this.TemplateStyleList = [];
          this.messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ["No template styles found"]);
        }
      },
      (err) => {
        console.error("Error fetching template styles:", err);
        this.messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ["Check log for error message."]);
      }
    );
  }

}
