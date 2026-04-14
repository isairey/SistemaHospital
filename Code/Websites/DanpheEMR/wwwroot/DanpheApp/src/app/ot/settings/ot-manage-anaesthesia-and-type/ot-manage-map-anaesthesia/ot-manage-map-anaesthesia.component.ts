import { Component } from '@angular/core';
import { GetOTAnaesthesiaType_DTO } from '../../../../ot/shared/dto/get-ot-anaesthesia-type.dto';
import { GetMapServiceItemAnaesthesia } from '../../../../ot/shared/dto/get-ot-map-serviceItem-anaesthesia.dto';
import { BillServiceItemDTO } from '../../../../ot/shared/dto/ot-bill-serviceItem.dto';

import { OTMapAnaesthesiaServiceItem } from '../../../../ot/shared/dto/ot-map-anaesthesia-service-item.dto';
import { PostMapAnaesthesiaServiceItemDTO } from '../../../../ot/shared/dto/post-ot-map-anaeshtesia-serviceItem.dto';
import { OperationTheatreBLService } from '../../../../ot/shared/ot.bl.service';
import { OTService } from '../../../../ot/shared/ot.service';
import { SecurityService } from '../../../../security/shared/security.service';
import { DanpheHTTPResponse } from '../../../../shared/common-models';
import GridColumnSettings from '../../../../shared/danphe-grid/grid-column-settings.constant';
import { MessageboxService } from '../../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../../shared/shared-enums';

@Component({
  selector: 'app-ot-manage-map-anaesthesia',
  templateUrl: './ot-manage-map-anaesthesia.component.html',

})
export class OtManageMapAnaesthesiaComponent {
  MapAnaesthesiaType = new OTMapAnaesthesiaServiceItem();
  AnaesthesiaTypeList = new Array<GetOTAnaesthesiaType_DTO>();
  ServiceItem = new Array<BillServiceItemDTO>();
  CurrentMapAnaesthesiaType = new PostMapAnaesthesiaServiceItemDTO();
  SelectedAnaesthesiaType = new OTMapAnaesthesiaServiceItem();
  MapServiceItemAnaesthesiaType = new Array<GetMapServiceItemAnaesthesia>();
  IsUpdate: boolean = false;
  MapAnaesthesiaGridColumns = new Array<any>();
  constructor(private _otService: OTService,
    private _OTBlService: OperationTheatreBLService,
    private _messageBoxService: MessageboxService,
    private _securityService: SecurityService,
  ) {
    let colSettings = new GridColumnSettings(this._securityService);
    this.MapAnaesthesiaGridColumns = colSettings.MapAnaesthesiaListGridColumns;
    this.GetActiveAnaesthesiaType();
    this.GetAnaesthesiaServiceItems();
    this.GetOTMapAnaesthesiaServiceItems();
  }
  /**
  *Method is used for retrieve the complete set of values entered in the form
 * Returns the value of the AnaesthesiaType form from the MapAnaesthesiaValidator.
 * @returns  The value of the AnaesthesiaType form.
 */
  get AnaesthesiaTypeFormValue() {
    return this.MapAnaesthesiaType.MapAnaesthesiaValidator.value;
  }
  /**
   *Method  provides access to individual form controls, allowing you to manipulate their properties.
   *@returns the controls of the form group MapAnaesthesiaValidator that is part of the MapAnaesthesiaType object
   */
  get AnaesthesiaTypeFormControls() {
    return this.MapAnaesthesiaType.MapAnaesthesiaValidator.controls;
  }
  /**
  * Retrieves a list of AnaesthesiaType service items and displays the data on the Danphe grid.
  * @returns {void} method does not return any value.
  */
  GetOTMapAnaesthesiaServiceItems(): void {
    this._OTBlService.GetOTMapAnaesthesiaServiceItems()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.MapServiceItemAnaesthesiaType = res.Results;
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OT Map AnaesthesiaServiceItem list is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }
  /**
   * This method is used for get the list of AnaesthesiaType & Using filter the AnaesthesiaTypeList obj contain Active AnaestheisaType only
   *  @returns {void} method does not return any value.
   */
  GetActiveAnaesthesiaType(): void {
    const anaesthesiaTypes = this._otService.getAnaesthesiaTypes();
    if (anaesthesiaTypes && anaesthesiaTypes.length > 0) {
      this.AnaesthesiaTypeList = anaesthesiaTypes.filter(item => item.IsActive === true);
    } else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Anaesthesia is empty.`]);
    }
  }
  /**
   * This Method implemented for getting the list of Billing service item by using _OTBlService service.
   * @returns {void} method does not return any value. 
   */
  GetAnaesthesiaServiceItems(): void {
    this._OTBlService.GetAnaesthesiaServiceItems()
      .subscribe((res: DanpheHTTPResponse) => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          if (res.Results && res.Results.length) {
            this.ServiceItem = res.Results.filter(res => res.IsActive);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`Service Item list is empty.`]);
          }
        }
      },
        (err: DanpheHTTPResponse) => {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error : ${err.ErrorMessage}`]);
        });
  }
  /**
   * method is designed to handle keyboard events 
   * @param event Represents the keyboard event (e.g., keydown, keyup) that triggers the method
   * @param nextElementId  A string that contains the ID of the HTML input element (<input> or similar) where you want to move the focus.
   */
  GoToNextElement(event: KeyboardEvent, nextElementId: string): void {
    event.preventDefault();
    const nextElement = document.getElementById(nextElementId) as HTMLInputElement;
    if (nextElement) {
      nextElement.focus();
    }
  }
  /**
   * Method is used for Add Anaesthesia Service Item
   * @returns The method does not return any value.
   */
  SaveMapAnaesthesiaType(): void {
    if (this.AnaesthesiaTypeFormValue.MapAnaesthesiaType && this.AnaesthesiaTypeFormValue.MapAnaesthesiaType.trim() === "") {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`OT Map AnaesthesiaServiceItem list Can't be Empty.`]);
      return;
    }
    if (this.MapAnaesthesiaType.IsValidCheck(undefined, undefined)) {
      this.CurrentMapAnaesthesiaType.AnaesthesiaTypeId = this.AnaesthesiaTypeFormValue.AnaesthesiaTypeId;
      this.CurrentMapAnaesthesiaType.ServiceItemId = this.AnaesthesiaTypeFormValue.ServiceItemId;
      this.CurrentMapAnaesthesiaType.IsActive = this.AnaesthesiaTypeFormValue.IsActive;
      if (!this.IsUpdate) {
        this._OTBlService.AddMapAnaesthesiaServiceitem(this.CurrentMapAnaesthesiaType)
          .subscribe((res: DanpheHTTPResponse) => {
            if (res.Status === ENUM_DanpheHTTPResponses.OK) {
              this.ClearAnaesthesiaTyeFormControls();
              this.GetOTMapAnaesthesiaServiceItems();
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [`New Map Anaesthesia service item Type Added Successfully.`]);
            }
            else {
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Unable to AddMap Anaesthesia service item.`]);
            }
          },
            (err: DanpheHTTPResponse) => {
              this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
            }
          );
      } else {
        this.CurrentMapAnaesthesiaType.AnaesthesiaTypeId = this.SelectedAnaesthesiaType.AnaesthesiaTypeId;
        this.UpdateMapAnaesthesiaType();
      }
    }
    else {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Please fill mandatory field.`]);
    }
  }
  /**
   * Method is used for Update the Anaesthesia Service Item.
   * @returns Method does not return any value.
   */
  UpdateMapAnaesthesiaType(): void {
    if (this.MapAnaesthesiaType.IsValidCheck(undefined, undefined)) {
      this.CurrentMapAnaesthesiaType.AnaesthesiaTypeId = this.AnaesthesiaTypeFormValue.AnaesthesiaTypeId;
      this.CurrentMapAnaesthesiaType.ServiceItemId = this.AnaesthesiaTypeFormValue.ServiceItemId;
      this.CurrentMapAnaesthesiaType.IsActive = this.AnaesthesiaTypeFormValue.IsActive;
      this.CurrentMapAnaesthesiaType.AnaesthesiaId = this.SelectedAnaesthesiaType.AnaesthesiaId;
      this._OTBlService.UpdateMapAnaesthesiaType(this.CurrentMapAnaesthesiaType)
        .subscribe((res: DanpheHTTPResponse) => {
          if (res.Status === ENUM_DanpheHTTPResponses.OK) {
            this.ClearAnaesthesiaTyeFormControls();
            this.IsUpdate = false;
            this.GetOTMapAnaesthesiaServiceItems();
            this.SelectedAnaesthesiaType = new OTMapAnaesthesiaServiceItem();
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [` Anaesthesia service item Type Updated Successfully.`]);
          }
          else {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Unable to Update  Anaesthesia service item Type.`]);
          }
        },
          (err: DanpheHTTPResponse) => {
            this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Exception: ${err.ErrorMessage}`]);
          }
        );
    }
  }

  /**
   * Method implement Grid Actions  handles actions triggered when click on edit button or any other action.
   * @param $event Represents the event object containing details
   */
  MapAnaesthesiaTypeGridActions($event): void {
    switch ($event.Action) {
      case "edit":
        {

          this.SelectedAnaesthesiaType = $event.Data;
          this.AnaesthesiaTypeFormControls.IsActive.setValue(this.SelectedAnaesthesiaType.IsActive);
          this.AnaesthesiaTypeFormControls.AnaesthesiaTypeId.setValue(this.SelectedAnaesthesiaType.AnaesthesiaTypeId);
          this.AnaesthesiaTypeFormControls.ServiceItemId.setValue(this.SelectedAnaesthesiaType.ServiceItemId);
          this.IsUpdate = true;
        }
        break;

      default:
        break;
    }
  }
  /**
   * Resets the form controls and state related to Anaesthesia Type editing.
 * Clears the selected Anaesthesia Type data, resets update mode, and initializes the form controls.
 * @returns {void} The method does not return any value.
   */
  ClearAnaesthesiaTyeFormControls(): void {
    this.MapAnaesthesiaType = new OTMapAnaesthesiaServiceItem();
    this.IsUpdate = false;
    this.SelectedAnaesthesiaType = new OTMapAnaesthesiaServiceItem();
  }

}
