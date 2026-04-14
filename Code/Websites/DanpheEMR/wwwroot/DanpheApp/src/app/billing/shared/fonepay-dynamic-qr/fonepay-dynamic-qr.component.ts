import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { InvoiceDetail } from '../dto/invoice-detail.dto';

@Component({
  selector: 'fonepay-dynamic-qr',
  templateUrl: 'fonepay-dynamic-qr.component.html',
  styleUrls: ['fonepay-dynamic-qr.component.css']
})
export class FonePayDynamicQRComponent {

  @Input('dynamic-qr-message')
  DynamicQrMessage: string = "";
  @Input('total-amount')
  TotalInvoiceAmount: number = 0;

  @Output('callback-message')
  DynamicQrCallback = new EventEmitter<InvoiceDetail>();

  SignalRHubConnection: signalR.HubConnection;
  IsFonePayPaymentSuccessful: boolean = false;
  InvoiceDetail = new InvoiceDetail();

  constructor(private _changeDetectorRef: ChangeDetectorRef,) {
    this.StartSignalRConnection();//! this will start the signalR connection.
  }

  ngOnDestroy(): void {
    this.SignalRHubConnection.stop();
    this.SignalRHubConnection = undefined;
  }
  public StartSignalRConnection = () => {
    this.SignalRHubConnection = new signalR.HubConnectionBuilder()
      .withUrl('/FonePayTransactionStatus')
      .build();
    this.SignalRHubConnection
      .start()
      .then(() => {
        console.log('Connection started');
        this.ListenInvoiceData();
      })
      .catch(err => console.log('Error while starting connection: ' + err))
  }

  public ListenInvoiceData = () => {
    this.SignalRHubConnection.on('InvoiceData', (invoice: InvoiceDetail) => {
      this.IsFonePayPaymentSuccessful = invoice.paymentStatus
      this._changeDetectorRef.detectChanges();
      if (invoice.paymentStatus) {
        this.InvoiceDetail = invoice;
      }
    });
  }

  CloseDynamicQrPopup() {
    if (this.InvoiceDetail && this.InvoiceDetail.paymentStatus) {
      this.DynamicQrCallback.emit(this.InvoiceDetail);
    } else {
      this.DynamicQrCallback.emit(null);
    }
  }
}
