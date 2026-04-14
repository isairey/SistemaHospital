export class CheckBookingStatus_DTO {
    resourceType: string = "";
    payload = new CheckBookingStatus_Payload();

    constructor(policyNo: string) {
        this.payload.chfid = policyNo;
    }
}

export class CheckBookingStatus_Payload {
    cmd_action: string = "";
    chfid: string;
}