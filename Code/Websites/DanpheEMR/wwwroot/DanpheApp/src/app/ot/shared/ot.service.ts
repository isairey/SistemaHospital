import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { DanpheHTTPResponse } from '../../shared/common-models';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../shared/shared-enums';
import { GetOTAnaesthesiaType_DTO } from './dto/get-ot-anaesthesia-type.dto';
import { GetOTBillingItem_DTO } from './dto/get-ot-billing-item.dto';
import { GET_OT_ICD_DTO } from './dto/get-ot-icd.dto';
import { GetOTMachine_DTO } from './dto/get-ot-machine.dto';
import { GetOTMSTCheckList_DTO } from './dto/get-ot-mst-checklist.dto';
import { GetOTPersonnelType_DTO } from './dto/get-ot-personnel-type.dto';
import { GetOTPersonnel_DTO } from './dto/get-ot-personnel.dto';
import { GetOTSurgery_DTO } from './dto/get-ot-surgery.dto';
import { OTPrescriber_DTO } from './dto/ot-prescriber-dto';
import { OperationTheatreBLService } from './ot.bl.service';

@Injectable({
  providedIn: 'root'
})

export class OTService {

  private surgeryId: number = 0;
  private OTMachineList = new Array<GetOTMachine_DTO>();
  private PersonnelTypes = new Array<GetOTPersonnelType_DTO>();
  private OTSurgeryList = new Array<GetOTSurgery_DTO>();
  private MSTCheckList = new Array<GetOTMSTCheckList_DTO>();
  private PersonnelList = new Array<GetOTPersonnel_DTO>();
  private AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
  private OTPrescriberList = new Array<OTPrescriber_DTO>();
  private OTBillingItems = new Array<GetOTBillingItem_DTO>();
  private ICDList = new Array<GET_OT_ICD_DTO>();
  private _prescriberListSubject: Subject<string> = new Subject<string>();
  prescriberList = this._prescriberListSubject.asObservable();


  constructor(
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
  ) {

  }

  setSurgeryId(isSelected: number): void {
    this.surgeryId = isSelected;
  }

  getSurgeryId(): number {
    return this.surgeryId;
  }

  resetSurgeryId(): void {
    this.surgeryId = 0;
  }

  LoadOTMachines(): void {
    this._otBLService.GetOTMachines()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.setOTMachines(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty OT Machine List.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTMachines(otMachines: Array<GetOTMachine_DTO>): void {
    this.OTMachineList = otMachines;
  }
  getOTMachines(): Array<GetOTMachine_DTO> {
    return this.OTMachineList;
  }


  LoadPersonnelTypes(): void {
    this._otBLService.GetPersonnelTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.setPersonnelTypes(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty PersonnelTypes.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setPersonnelTypes(otPersonnelTypes: Array<GetOTPersonnelType_DTO>): void {
    this.PersonnelTypes = otPersonnelTypes;
  }
  getOTPersonnelTypes(): Array<GetOTPersonnelType_DTO> {
    return this.PersonnelTypes;
  }


  LoadOTSurgeries(): void {
    this._otBLService.GetOTSurgeries()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.setOTSurgeries(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty OT Surgery List.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTSurgeries(otSurgeries: Array<GetOTSurgery_DTO>): void {
    this.OTSurgeryList = otSurgeries;
  }
  getOTSurgeries(): Array<GetOTSurgery_DTO> {
    return this.OTSurgeryList;
  }


  LoadOTMSTCheckList(): void {
    this._otBLService.GetOTMSTCheckList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.setOTMSTCheckList(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty CheckList.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTMSTCheckList(otMSTCheckList: Array<GetOTMSTCheckList_DTO>): void {
    this.MSTCheckList = otMSTCheckList;
  }
  getOTMSTCheckList(): Array<GetOTMSTCheckList_DTO> {
    return this.MSTCheckList;
  }

  LoadPersonnel(): void {
    this._otBLService.GetPersonnel()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            // this.PersonnelList = res.Results;
            this.setOTPersonnel(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty Personnel List.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTPersonnel(otPersonnel: Array<GetOTPersonnel_DTO>): void {
    this.PersonnelList = otPersonnel;
  }
  getOTPersonnel(): Array<GetOTPersonnel_DTO> {
    return this.PersonnelList;
  }


  LoadAnaesthesiaTypes(): void {
    this._otBLService.GetAnaesthesiaTypes()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.setAnaesthesiaTypes(res.Results);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty Anaesthesia Types.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setAnaesthesiaTypes(otAnaesthesiaTypes: Array<GetOTAnaesthesiaType_DTO>): void {
    this.AnaesthesiaTypeList = otAnaesthesiaTypes;
  }
  getAnaesthesiaTypes(): Array<GetOTAnaesthesiaType_DTO> {
    return this.AnaesthesiaTypeList;
  }


  LoadOTPrescriberList(): void {
    this._otBLService.GetOTPrescriberList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.OTPrescriberList = res.Results;
            this._prescriberListSubject.next('Prescriber List Loaded');
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty Prescriber List.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed : ${res.ErrorMessage}`]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTPrescriberList(otPrescriberList: Array<OTPrescriber_DTO>): void {
    this.OTPrescriberList = otPrescriberList;
  }
  getOTPrescriberList(): Array<OTPrescriber_DTO> {
    return this.OTPrescriberList;
  }


  LoadOTBillingItems(): void {
    this._otBLService.GetOTBillingItems()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.OTBillingItems = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty Billing Items.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setOTBillingItems(otBillingItems: Array<GetOTBillingItem_DTO>): void {
    this.OTBillingItems = otBillingItems;
  }
  getOTBillingItems(): Array<GetOTBillingItem_DTO> {
    return this.OTBillingItems;
  }


  GetICDList(): void {
    this._otBLService.GetICDList()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.ICDList = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Empty ICD Items.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [res.ErrorMessage]);
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }

  setICDList(icdList: Array<GET_OT_ICD_DTO>): void {
    this.ICDList = icdList;
  }
  getICDList(): Array<GET_OT_ICD_DTO> {
    return this.ICDList;
  }






}
