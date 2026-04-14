import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { BillingBLService } from '../../billing/shared/billing.bl.service';
import { EditDoctorFeatureViewModel } from '../../billing/shared/edit-doctor-feature-view.model';
import { MessageboxService } from '../../shared/messagebox/messagebox.service';
import { ENUM_DanpheHTTPResponses } from '../../shared/shared-enums';
import { EditDoctor_DTO } from '../shared/DTOs/edit-doctor.dto';

@Component({
  selector: "rad-edit-doctor",
  templateUrl: "./rad-edit-doctors-popup.html"
})

export class RadiologyEditDoctorsPopupComponent {


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
  public showPrescriberChange: boolean = false;
  public status: string = null;
  public message: string = null;
  DoctorsDetails = new EditDoctor_DTO;
  SelectedRefId: number = null;
  SelectedReferrerName: string = null;
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
    this.DoctorsDetails.BillTxnItemId = this.SelectedItem.BillingTransactionItemId;
    this.DoctorsDetails.RequisitionId = this.SelectedItem.RequisitionId;
    if (this.newPerformer) {
      let performer = this.newPerformer.EmployeeName.replace(/&/g, '%26');
      this.DoctorsDetails.NewPerformer.EmployeeName = performer;
      this.DoctorsDetails.NewPerformer.EmployeeId = this.newPerformer.EmployeeId;
    }

    if (this.newPrescriber) {
      let prescriber = this.newPrescriber.EmployeeName.replace(/&/g, '%26');
      this.DoctorsDetails.NewPrescriber.EmployeeName = prescriber;
      this.DoctorsDetails.NewPrescriber.EmployeeId = this.newPrescriber.EmployeeId;
    }
    if (this.SelectedRefId && this.SelectedReferrerName) {
      this.DoctorsDetails.NewReferrer.EmployeeId = this.SelectedRefId;
      this.DoctorsDetails.NewReferrer.EmployeeName = this.SelectedReferrerName;
    }

    this.billingBlService.ChangeRadiologyDoctor(this.DoctorsDetails)
      .subscribe(res => {
        if (res.Status === ENUM_DanpheHTTPResponses.OK) {

          ///emiting the event to the parent page
          this.updateDoctor.emit({ SelectedItem: this.SelectedItem });

          //this.changeDetector.detectChanges();
          this.router.navigate(['/Radiology/EditDoctors']);
          this.msgBoxServ.showMessage("success", ["Saved Successfully."]);
        }
        else {
          this.msgBoxServ.showMessage("error", ["Sorry!!! Not able to update the Doctor"]);
          console.log(res.ErrorMessage)
        }

      });

  }


  //used to format the display of item in ng-autocomplete.
  PerformerListFormatter(data: any): string {
    let html = data["EmployeeName"];
    return html;
  }

  showPrescriber() {
    return this.showPrescriberChange = true;
  }
  OnReferrerChanged($event) {
    this.SelectedRefId = $event.ReferrerId;
    this.SelectedReferrerName = $event.ReferrerName;

  }
}
