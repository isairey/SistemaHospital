import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CoreService } from '../../../core/shared/core.service';
import { InventoryService } from '../../../inventory/shared/inventory.service';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { RouteFromService } from '../../../shared/routefrom.service';
import { InventoryBLService } from '../../shared/inventory.bl.service';
import { ReturnToVendorItem } from '../return-to-vendor-items.model';
import { GeneralFieldLabels } from '../../../shared/DTOs/general-field-label.dto';

@Component({
  selector: 'app-return-to-vendor-view',
  templateUrl: './return-to-vendor-view.component.html',
  styleUrls: ['./return-to-vendor-view.component.css']
})
export class ReturnToVendorViewComponent implements OnInit {
  CCAmount: number = 0;
  DiscountAmount: number = 0;
  ;
  ngOnInit() {
    document.getElementById("printBtn").focus();
  }


  public returnItemDetails: Array<ReturnToVendorItem> = new Array<ReturnToVendorItem>();
  public returnDate: string = null;
  public createdOn: string = null;
  public vendorId: number = 0;
  public header: any = null;
  public returnBy: string = null;
  public vendorName: string = null;
  public SubTotal: number = 0;
  public VATTotal: number = 0;
  public AllTotalAmount: number = 0;
  public PurchaseReturnNumber: string = "PI000";
  public printDetaiils: any;
  public showPrint: boolean = false;


  msgBoxServ: any;

  public GeneralFieldLabel = new GeneralFieldLabels();

  constructor(
    public inventoryBLService: InventoryBLService,
    public messageBoxService: MessageboxService,
    public inventoryService: InventoryService,
    public routeFrom: RouteFromService,
    public changeDetector: ChangeDetectorRef,
    public router: Router,
    public coreService: CoreService) {
    this.LoadReturnItems(this.inventoryService.CreatedOn, this.inventoryService.VendorId);
    this.GetInventoryBillingHeaderParameter();
    this.GeneralFieldLabel = coreService.GetFieldLabelParameter();
  }

  LoadReturnItems(CreatedOn: string, VendorId: number) {
    if (CreatedOn != null && VendorId != 0) {
      this.createdOn = CreatedOn;
      this.vendorId = VendorId;
      this.inventoryBLService.GetReturnItemList(CreatedOn, VendorId)
        .subscribe(res => this.ShowReturnItemDetails(res));
    } else {
      this.messageBoxService.showMessage("notice-message", ['Invalid Data to list itmes.']);
    }
  }

  ShowReturnItemDetails(res) {
    if (res.Status == "OK") {
      this.returnItemDetails = res.Results;
      this.returnDate = this.returnItemDetails[0].CreatedOn;
      this.returnBy = this.returnItemDetails[0].CreatedByName;
      this.vendorName = this.returnItemDetails[0].VendorName;
      this.PurchaseReturnNumber = this.PurchaseReturnNumber + this.returnItemDetails[0].ReturnToVendorItemId;
      this.returnItemDetails.forEach(
        r => {
          // this.SubTotal += r.TotalAmount;
          // this.VATTotal += r.VAT = !isNaN ? r.VAT : 0;
          // this.AllTotalAmount += r.TotalAmount + r.VAT;
          this.SubTotal += r.SubTotal;
          this.DiscountAmount += r.DiscountAmount;
          this.VATTotal += r.VATAmount;
          this.CCAmount += r.CCAmount;
          this.AllTotalAmount += r.TotalAmount;

        });
    }
    else {
      this.messageBoxService.showMessage("notice-message", ["No data for the return items."]);
      this.returnToVendorList();
    }
  }

  //route back
  returnToVendorList() {
    this.router.navigate(['/Inventory/ReturnToVendor/ReturnToVendorList']);
  }

  //this is used to print the receipt
  print() {
    this.showPrint = false;
    this.changeDetector.detectChanges();
    this.showPrint = true;

    const printContent = document.getElementById("printpage");

    if (printContent) {
      this.printDetaiils += `<style>
      .printStyle {
        border: dotted 1px;
        margin: 10px 455px !important;
      }
      
      .print-border-top {
        border-top: dotted 1px;
      }
      
      .print-border-bottom {
        border-bottom: dotted 1px;
      }
      
      .print-border {
        border: dotted 1px;
      }
      
      .center-style {
        text-align: center;
      }
      
      .border-up-down {
        border-top: dotted 1px;
        border-bottom: dotted 1px;
      }
      
      .table-details-value {
        margin-left: 10px;
        text-align: center;
      }
      
      .img-responsive {
        position: relative;
        top: 14px;
      }
      </style>`
      this.printDetaiils = printContent.innerHTML;

    }
  }




  public headerDetail: { header1, header2, header3, header4, hospitalName, address, email, PANno, tel, DDA };

  //Get Pharmacy Billing Header Parameter from Core Service (Database) assign to local variable
  GetInventoryBillingHeaderParameter() {
    var paramValue = this.coreService.Parameters.find(a => a.ParameterName == 'Inventory Receipt Header').ParameterValue;
    if (paramValue)
      this.headerDetail = JSON.parse(paramValue);
    else
      this.msgBoxServ.showMessage("error", ["Please enter parameter values for BillingHeader"]);
  }

}
