import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';

import { EditDoctorFeatureViewModel } from "../../shared/edit-doctor-feature-view.model";


import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from '../../../shared/shared-enums';
import { BillingBLService } from '../billing.bl.service';
import { EditDoctorRequest } from '../dto/edit-doctor.request';

@Component({
  selector: "danphe-edit-doctor",
  templateUrl: "./edit-doctor-popup.html",
  host: { '(window:keydown)': 'hotkeys($event)' }
})

export class EditDoctorComponent {


  //public showEditDoctorPage: boolean = false;
  @Input("editDoctor")
  public SelectedItem: EditDoctorFeatureViewModel;
  @Output("update-doctor")
  updateDoctor: EventEmitter<Object> = new EventEmitter<Object>();
  //for doctor list
  public doctorList: any;
  //for assigning the new provider
  public newPerformer = { EmployeeId: null, EmployeeName: null };
  public newPrescriber = { EmployeeId: null, EmployeeName: null };
  public showmsgbox: boolean = false;
  public status: string = null;
  public message: string = null;
  SelectedRefId: number = null;
  SelectedReferrerName: string = null;
  public NewRefeerer = { EmployeeId: null, EmployeeName: null };
  constructor(public msgBoxServ: MessageboxService, public changeDetector: ChangeDetectorRef,
    public billingBlService: BillingBLService, public router: Router) {

  }

  ngOnInit() {
    this.GetDoctorList();
    if (this.SelectedItem.PerformerId) {
      this.newPerformer = { EmployeeId: this.SelectedItem.PerformerId, EmployeeName: this.SelectedItem.PerformerName };
    }
    if (this.SelectedItem.PrescriberId) {
      this.newPrescriber = { EmployeeId: this.SelectedItem.PrescriberId, EmployeeName: this.SelectedItem.PrescriberName };
    }
    if (this.SelectedItem.ReferredById && this.SelectedItem.ReferrerName) {
      this.SelectedRefId = this.SelectedItem.ReferredById;
      this.SelectedReferrerName = this.SelectedItem.ReferrerName;
    }
  }

  //load doctor
  GetDoctorList(): void {
    this.newPerformer = null;
    this.newPrescriber = null;
    this.billingBlService.GetProviderList()
      .subscribe(res => this.CallBackGenerateDoctor(res));
  }

  CallBackGenerateDoctor(res) {
    if (res.Status == "OK") {
      this.doctorList = [];
      this.doctorList.push({ EmployeeId: null, EmployeeName: 'No Doctor' });
      //format return list into Key:Value form, since it searches also by the property name of json.
      if (res && res.Results) {
        res.Results.forEach(a => {
          this.doctorList.push(a);
        });
      }
    }
    else {
      this.msgBoxServ.showMessage("error", ["Not able to get Doctor list"]);
      console.log(res.ErrorMessage)
    }
  }
  //to close the pop up
  Close() {
    //this.showEditDoctorPage = false;
    this.updateDoctor.emit({ SelectedItem: null });
  }

  // for updating the provider
  UpdatePerformerAndPrescriber() {
    let billTxnItemId = this.SelectedItem.BillingTransactionItemId;
    let performer;
    let prescriber;
    const editDoctorRequest = new EditDoctorRequest();
    editDoctorRequest.BillingTransactionItemId = billTxnItemId;
    if (this.newPerformer) {
      performer = this.newPerformer.EmployeeName.replace(/&/g, '%26');
      this.newPerformer.EmployeeName = performer;
      editDoctorRequest.PerformerId = this.newPerformer.EmployeeId;
    }
    if (this.newPrescriber) {
      prescriber = this.newPrescriber.EmployeeName.replace(/&/g, '%26');
      this.newPrescriber.EmployeeName = prescriber;
      editDoctorRequest.PrescriberId = this.newPrescriber.EmployeeId;
    }
    if (this.SelectedReferrerName && this.SelectedRefId) {
      editDoctorRequest.ReferrerId = this.SelectedRefId
    }

    this.billingBlService.ChangeDoctor(editDoctorRequest)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.Close();
          if (this.newPerformer || this.newPrescriber) {
            ///emiting the event to the parent page
            this.updateDoctor.emit({ SelectedItem: this.SelectedItem });
          }
          else {
            this.updateDoctor.emit({ SelectedItem: null });
          }
          this.router.navigate(['/Billing/EditDoctor']);
        }
        else {
          this.msgBoxServ.showMessage(ENUM_MessageBox_Status.Error, ["Sorry!!! Not able to update the Doctor"]);
          console.log(res.ErrorMessage)
        }
      });

  }


  //used to format the display of item in ng-autocomplete.
  DoctorListFormatter(data: any): string {
    let html = data["EmployeeName"];
    return html;
  }
  public hotkeys(event) {
    if (event.keyCode == 27) {//key->ESC
      this.Close();
    }
  }

  OnReferrerChanged($event) {
    this.SelectedRefId = $event.ReferrerId;
    this.SelectedReferrerName = $event.ReferrerName;

  }
}
