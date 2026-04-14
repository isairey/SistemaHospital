export class ClaimBookingDetailsFromSSFServer_Root_DTO {
    resourceType: string = "";
    response: ClaimBookingDetailsFromSSFServer_Response_DTO;
    success: number = 0;
    msg: string = "";
}

export class ClaimBookingDetailsFromSSFServer_Response_DTO {
    data: ClaimBookingDetailsFromSSFServer_Data_DTO[];
}

export class ClaimBookingDetailsFromSSFServer_Data_DTO {
    scheme: string = "";
    chfid: string = "";
    subProduct: string = "";
    booked: string = "";
    booked_by: string = "";
    date: string = "";
    clientClaimId: string = "";
    clientInvoiceNumber: string = "";
}