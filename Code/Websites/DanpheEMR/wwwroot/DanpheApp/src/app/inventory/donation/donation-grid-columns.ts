
import * as moment from 'moment';
import { DanpheDateTime } from '../../shared/pipes/danphe-datetime.pipe';

export default class DonationGridColumnSettings {
  static DonationList = [
    { headerName: "S.N", field: "SerialNumber", width: 80 },
    { headerName: "Donation No", field: "DonationNo", width: 100 },
    { headerName: "Donated to", field: "VendorName", width: 100 },
    {
      headerName: "Donation Date",
      width: 100,
      cellRenderer: DonationGridColumnSettings.DateFormatRenderer,
      cellRendererParams: {
        dateFieldName: 'DonatedDate'
      }

    },
    { headerName: "Donation Ref No", field: "DonationReferenceNo", width: 120 },
    {
      headerName: "Donation Ref Date",
      width: 120,
      cellRenderer: DonationGridColumnSettings.DateFormatRenderer,
      cellRendererParams: {
        dateFieldName: 'DonationReferenceDate'
      }
    },
    { headerName: "Total Value ", field: "TotalAmount", width: 100 },
    { headerName: "Username ", field: "Username", width: 120 },
    { headerName: "Remarks ", field: "Remarks", width: 120 },
    {
      headerName: "Action",
      field: "",
      width: 120,
      cellRenderer: DonationGridColumnSettings.DonationActionList
    },
  ];
  static DonationActionList() {
    let template = ` 
                <a danphe-grid-action="view" class="grid-action">
                  View
                </a>`;
    return template;
  }
  static datTime: DanpheDateTime = new DanpheDateTime();

  static DateFormatRenderer(params) {
    const dateFieldName = params.colDef.cellRendererParams.dateFieldName;
    const date = params.data[dateFieldName];
    if (date != null) {
      return moment(date).format("YYYY-MM-DD");
    }
  }

}
