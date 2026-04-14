import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";
import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";
import { Subscription } from "rxjs";
import { ClaimManagementBLService } from "../../claim-management/shared/claim-management.bl.service";
import { DoctorNMCNo_DTO } from "../../claim-management/shared/DTOs/doctors-nmc.dto";
import { CoreService } from "../../core/shared/core.service";
import { DanpheHTTPResponse } from "../common-models";
import { SelectedPatientDto } from "../diagnosis/dto/selected-patient.dto";
import { MessageboxService } from "../messagebox/messagebox.service";
import { ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status } from "../shared-enums";
import { HibLiveClaimDTO } from "./dtos/hib-live-claim.dto";

@Component({
  selector: 'hib-live-claim',
  templateUrl: './hib-live-claim.component.html',
  styleUrls: ['./hib-live-claim.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HibLiveClaimComponent {

  @Input('selected-patient')
  SelectedPatient = new SelectedPatientDto();
  @Input('invoice')
  Invoice = { InvoiceId: 0, ModuleName: "" };
  @Input('invoice-page-print-id')
  InvoicePagePrintId: string = "";
  HibLiveClaimSubscriptions = new Subscription();
  DoctorsNMCNoList = new Array<DoctorNMCNo_DTO>();
  SelectedNMCNo = new DoctorNMCNo_DTO()
  SelectedNMCNoList = new Array<DoctorNMCNo_DTO>();
  ExplanationContent: string = '';
  ExplanationContents: string[] = [];
  loading: boolean = false;
  HibLiveClaim = new HibLiveClaimDTO();
  ClaimDoc: string = "";
  HibLiveClaimConfig = { "IsEnabled": false, "EnableManualLiveClaim": false, "EnableAutoLiveClaim": false, "EnableLiveDocumentSubmission": false };


  constructor(
    private _claimManagementBlService: ClaimManagementBLService,
    private _messageBoxService: MessageboxService,
    private _changeDetector: ChangeDetectorRef,
    private _coreService: CoreService
  ) {
    this.GetHibLiveClaimParameter();
  }
  ngOnInit(): void {
    this.GetDoctorListWithNMCNo();
  }

  GetHibLiveClaimParameter() {
    const param = this._coreService.Parameters.find(p => p.ParameterGroupName === "GovInsurance" && p.ParameterName === "HIBLiveClaimConfig");
    if (param) {
      this.HibLiveClaimConfig = JSON.parse(param.ParameterValue);
    }
  }

  GetDoctorListWithNMCNo() {
    this.HibLiveClaimSubscriptions.add(
      this._claimManagementBlService.GetDoctorListWithNMCNo().subscribe((res: DanpheHTTPResponse) => {
        if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
          this.DoctorsNMCNoList = res.Results;
          if (this.DoctorsNMCNoList && this.DoctorsNMCNoList.length) {
            const performer = this.GetPerformer(this.DoctorsNMCNoList);
            if (performer) {
              this.SelectedNMCNo = performer;
              this.OnNMCNoSelect();
            }
            this._changeDetector.detectChanges();
          }
        }
      }, err => {
        console.error(err);
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Something Went Wrong while Reading Doctor NMC the patient']);
      })
    );
  }

  GetPerformer(doctorsNMCNoList: DoctorNMCNo_DTO[]): DoctorNMCNo_DTO {
    const performer = doctorsNMCNoList.find(d => d.EmployeeId === this.SelectedPatient.PerformerId);
    return performer;
  }
  NMCNoListFormatter(data: any): string {
    return (`${data["DoctorName"]}(${data["NMCNo"]})`);
  }

  OnNMCNoSelect() {
    if (this.SelectedNMCNo && this.SelectedNMCNo.NMCNo) {
      let nmcAlreadySelected = this.SelectedNMCNoList.find(a => a.NMCNo === this.SelectedNMCNo.NMCNo);
      if (nmcAlreadySelected) {
        this.SelectedNMCNo = null;
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['NMC No Already Selected']);
        return;
      }
      this.SelectedNMCNoList.push(this.SelectedNMCNo);
      this.SelectedNMCNo = new DoctorNMCNo_DTO();
    }
  }
  RemoveSelectedNMCNO(index: number): void {
    this.SelectedNMCNoList.splice(index, 1);
  }

  AddExplanation() {
    if (!this.ExplanationContent.trim()) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['Input some explanation details.']);
      return;
    }
    let isExplanationAlreadyExists = this.ExplanationContents.find(explanation => explanation === this.ExplanationContent.trim());
    if (isExplanationAlreadyExists) {
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, ['This explanation is already added.']);
      return;
    }
    this.ExplanationContents.push(this.ExplanationContent);
    this.ExplanationContent = '';
  }

  RemoveExplanation(index: number): void {
    this.ExplanationContents.splice(index, 1);
  }

  async SubmitHibLiveClaim(): Promise<void> {
    try {
      this.HibLiveClaim = new HibLiveClaimDTO();

      // Create PDF
      const pdfDoc = await PDFDocument.create();

      // Wait for PrepareClaimDoc to complete

      if (this.HibLiveClaimConfig && this.HibLiveClaimConfig.IsEnabled && this.HibLiveClaimConfig.EnableLiveDocumentSubmission) {
        await this.PrepareClaimDoc(this.InvoicePagePrintId, pdfDoc);
      }

      this.HibLiveClaim.Explanation = this.ExplanationContents;
      this.HibLiveClaim.InvoiceId = this.Invoice.InvoiceId;
      this.HibLiveClaim.ModuleName = this.Invoice.ModuleName;
      this.HibLiveClaim.ClaimDoc = this.ClaimDoc ? this.ClaimDoc : "";

      const res: DanpheHTTPResponse = await this._claimManagementBlService.SubmitHibLiveClaim(this.HibLiveClaim).toPromise();

      if (res && res.Status === ENUM_DanpheHTTPResponses.OK) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Success, [res.Results]);
      } else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, ['Live Claim Submission Failed.']);
      }
    } catch (err) {
      console.error(err);
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, ['Live Claim Submission Failed.']);
    }
  }
  async PrepareClaimDoc(id: string, pdfDoc: PDFDocument): Promise<void> {
    const dom = document.getElementById(id);
    if (dom) {
      dom.style.border = "none";
      dom.style.width = "1020px";
      const canvas = await html2canvas(dom, {
        useCORS: true,
        allowTaint: true,
        scrollY: 0
      });

      const pageWidth = 595.28;  // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const scaleFactor = pageWidth / canvas.width;
      const scaledHeight = canvas.height * scaleFactor;

      // Convert canvas to PNG
      const pngImage = await canvas.toDataURL('image/png');
      const pngImageBytes = await fetch(pngImage).then(res => res.arrayBuffer());
      const image = await pdfDoc.embedPng(pngImageBytes);

      let yOffset = 0;
      while (yOffset < scaledHeight) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const heightLeft = scaledHeight - yOffset;
        const heightToDraw = Math.min(pageHeight, heightLeft);

        page.drawImage(image, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: heightToDraw,
        });

        yOffset += pageHeight;
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `${this.SelectedPatient.PatientCode}_${this.Invoice.ModuleName}_Invoice_${this.Invoice.InvoiceId}.pdf`;

      await this.SetClaimDoc(pdfBlob, fileName);
    }
  }

  private SetClaimDoc(pdfBlob: Blob, fileName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const tempFile = reader.result.toString();
        const indx = tempFile.indexOf(',');
        this.ClaimDoc = tempFile.substring(indx + 1);
        resolve();
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    });
  }
  ngOnDestroy(): void {
    this.HibLiveClaimSubscriptions.unsubscribe();
  }
}
