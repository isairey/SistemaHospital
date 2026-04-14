import { Component, OnInit } from '@angular/core';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { GetOTMapSurgeryCheckList_DTO } from '../../shared/dto/get-ot-map-surgery-checklist.dto';
import { GetOTMSTCheckList_DTO } from '../../shared/dto/get-ot-mst-checklist.dto';
import { GetOTSurgery_DTO } from '../../shared/dto/get-ot-surgery.dto';
import { MapSurgeryCheckListItems, PostOTMapSurgeryCheckList_DTO } from '../../shared/dto/post-ot-map-surgery-checklist';
import { TempMapSurgeryCheckList_DTO } from '../../shared/dto/temp-map-surgery-checklist.dto';
import { OperationTheatreBLService } from '../../shared/ot.bl.service';
import { OTService } from '../../shared/ot.service';

@Component({
  selector: 'ot-map-surgery-checklist',
  templateUrl: './ot-map-surgery-checklist.component.html',
  styleUrls: ['./ot-map-surgery-checklist.component.css'],
})

export class MapSurgeryCheckListComponent implements OnInit {

  SurgeryList = new Array<GetOTSurgery_DTO>();
  CurrentSurgery = new GetOTSurgery_DTO();
  MSTCheckList = new Array<GetOTMSTCheckList_DTO>();
  SelectedMapSurgeryCheckListItems = new Array<GetOTMapSurgeryCheckList_DTO>();
  MapSurgeryCheckListObjectItems = new Array<TempMapSurgeryCheckList_DTO>();
  ClonedMapSurgeryCheckListObjectItems = new Array<TempMapSurgeryCheckList_DTO>();
  MapSurgeryCheckList = new PostOTMapSurgeryCheckList_DTO();
  IsSurgerySelected: boolean = false;
  IsUpdate: boolean = false;
  SurgeryId: number = 0;

  constructor(
    private _otBLService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _otService: OTService
  ) {

  }

  ngOnInit(): void {
    this.Initialize();
  }

  Initialize(): void {
    (async (): Promise<void> => {
      try {
        await this.GetOTSurgeries();
        await this.GetOTMSTCheckList();
        this.SurgeryId = this._otService.getSurgeryId();
        if (this.SurgeryId) {
          this.GetMapSurgeryCheckListBySurgeryId(this.SurgeryId);
          let surgery: GetOTSurgery_DTO = this.SurgeryList.find(sur => sur.SurgeryId === this.SurgeryId);
          if (surgery) {
            this.CurrentSurgery = surgery;
            this.IsSurgerySelected = true;
          }
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  async GetOTMSTCheckList(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetOTMSTCheckList().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          this.MSTCheckList = res.Results;
          this.MSTCheckList = this.MSTCheckList.filter(checklist => checklist.IsActive);
          this.AssignCheckListToMapSurgeryCheckListObject(this.MSTCheckList);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Master CheckList is empty.`]);
        }
      }
    }
    catch (err) {
      throw new Error(`Exception: ${err}`);
    }
  }

  AssignCheckListToMapSurgeryCheckListObject(checkList: Array<GetOTMSTCheckList_DTO>): void {
    this.MapSurgeryCheckListObjectItems = new Array<TempMapSurgeryCheckList_DTO>();
    checkList.forEach(cl => {
      let mapSurgeryCheckListObject = new TempMapSurgeryCheckList_DTO();
      mapSurgeryCheckListObject.CheckListId = cl.CheckListId;
      mapSurgeryCheckListObject.CheckListName = cl.CheckListName;
      mapSurgeryCheckListObject.DisplayName = cl.DisplayName;
      mapSurgeryCheckListObject.InputType = cl.InputType;
      this.MapSurgeryCheckListObjectItems.push(mapSurgeryCheckListObject);
    });
  }

  async GetOTSurgeries(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._otBLService.GetOTSurgeries().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length) {
          this.SurgeryList = res.Results;
          this.SurgeryList = this.SurgeryList.filter(surgery => surgery.IsActive);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OT Surgery list is empty.`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed. ${res.ErrorMessage ? "Error Message : " + res.ErrorMessage : ""} `]);
      }
    }
    catch (err) {
      throw new Error(`Exception: ${err}`);
    }
  }

  SurgeryFormatter(data: any): string {
    let html = data["SurgeryName"];
    return html;
  }

  OnSurgerySelect(): void {
    this.AssignCheckListToMapSurgeryCheckListObject(this.MSTCheckList);   //! Sanjeev'  need to change this login later. This for resetting data on SurgerySelect
    if (this.CurrentSurgery && typeof (this.CurrentSurgery) === "object" && this.CurrentSurgery.SurgeryId) {
      this.IsSurgerySelected = true;
      this.SurgeryId = this.CurrentSurgery.SurgeryId
      this.GetMapSurgeryCheckListBySurgeryId(this.SurgeryId);
    }
    else {
      this.IsSurgerySelected = false;
    }
  }

  GetMapSurgeryCheckListBySurgeryId(surgeryId: number): void {
    this._otBLService.GetMapSurgeryCheckListBySurgeryId(surgeryId)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length > 0) {
            this.SelectedMapSurgeryCheckListItems = res.Results;
            this.AssignSelectedMapSurgeryCheckListItemsForUpdate();
            this.IsUpdate = true;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`CheckList has not been mapped to this surgery.`]);
          }
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed. ${res.ErrorMessage ? "Error Message : " + res.ErrorMessage : ""} `]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  AssignSelectedMapSurgeryCheckListItemsForUpdate(): void {
    this.SelectedMapSurgeryCheckListItems.forEach(item => {
      let mapSurgeryCheckListItem = this.MapSurgeryCheckListObjectItems.find(mapItem => mapItem.CheckListId === item.CheckListId);
      if (mapSurgeryCheckListItem) {
        mapSurgeryCheckListItem.IsSelected = item.IsActive ? true : false;
        mapSurgeryCheckListItem.SurgeryCheckListId = item.SurgeryCheckListId;
        mapSurgeryCheckListItem.CheckListId = item.CheckListId;
        mapSurgeryCheckListItem.SurgeryId = item.SurgeryId;
        mapSurgeryCheckListItem.IsMandatory = item.IsMandatory;
        mapSurgeryCheckListItem.DisplaySequence = item.DisplaySequence;
        mapSurgeryCheckListItem.IsActive = item.IsActive;
        mapSurgeryCheckListItem.CreatedBy = item.CreatedBy;
        mapSurgeryCheckListItem.CreatedOn = item.CreatedOn;
        mapSurgeryCheckListItem.ModifiedBy = item.ModifiedBy;
        mapSurgeryCheckListItem.ModifiedOn = item.ModifiedOn;
      }
    });
  }

  SaveMapSurgeryCheckList(): void {
    if (this.AssignTempMapSurgeryCheckListToPostOTMapSurgeryCheckList_DTO() === false) {
      return;
    }
    this.ProceedToMapSurgeryCheckList();
  }

  ProceedToMapSurgeryCheckList(): void {
    this._otBLService.MapSurgeryCheckList(this.MapSurgeryCheckList)
      .subscribe((res: DanpheHTTPResponse): void => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.ClearMapSurgeryCheckList();
          this.CurrentSurgery = new GetOTSurgery_DTO();
          this.IsSurgerySelected = false;
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`SurgeryCheckList Mapped Successfully.`]);
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed. ${res.ErrorMessage ? "Error Message : " + res.ErrorMessage : ""} `]);
        }
      },
        (err: DanpheHTTPResponse): void => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
        }
      );
  }

  AssignTempMapSurgeryCheckListToPostOTMapSurgeryCheckList_DTO(): boolean {
    this.MapSurgeryCheckList = new PostOTMapSurgeryCheckList_DTO();
    if (this.MapSurgeryCheckListObjectItems.length) {
      let filteredMapSurgeryCheckListObjectItems = this.MapSurgeryCheckListObjectItems.filter(item => item.IsSelected);
      //! Sanjeev' If it is the first time mapping for any new Surgery and there's no CheckList selected and user attempts to Save, this will prevent saving from Client Side.
      if (!filteredMapSurgeryCheckListObjectItems.length && !this.IsUpdate) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Please select atleast one CheckList.`]);
        return false;
      }
      else {
        this.MapSurgeryCheckList.SurgeryId = this.SurgeryId;
        if (filteredMapSurgeryCheckListObjectItems.length) {
          filteredMapSurgeryCheckListObjectItems.forEach(element => {
            let mapSurgeryCheckList = new MapSurgeryCheckListItems();
            mapSurgeryCheckList.SurgeryId = this.CurrentSurgery.SurgeryId;
            mapSurgeryCheckList.SurgeryCheckListId = element.SurgeryCheckListId;
            mapSurgeryCheckList.CheckListId = element.CheckListId;
            mapSurgeryCheckList.DisplaySequence = element.DisplaySequence;
            mapSurgeryCheckList.IsMandatory = element.IsMandatory;
            mapSurgeryCheckList.IsActive = true;
            this.MapSurgeryCheckList.MapSurgeryCheckListItems.push(mapSurgeryCheckList);
          });
          if (this.MapSurgeryCheckList.MapSurgeryCheckListItems.length) {
            return true;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Unable to assign items for Posting.`]);
            return false;
          }
        }
        else {
          //! Sanjeev' This is the case, when user tires to deactivate all the checklist mapped with certain surgery.
          //! Sanjeev' In this case, there is no items in the list this.MapSurgeryCheckList.MapSurgeryCheckListItems
          return true;
        }
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Warning, [`Please add CheckList before Mapping Surgery with CheckList.`]);
      return false;
    }
  }

  ClearMapSurgeryCheckList(): void {
    this.MapSurgeryCheckListObjectItems.forEach(element => {
      element.IsSelected = false;
      element.IsMandatory = false;
      element.DisplaySequence = 0;
    });
    this.MapSurgeryCheckList = new PostOTMapSurgeryCheckList_DTO();
  }

  ngOnDestroy(): void {
    this._otService.resetSurgeryId();
  }
}
