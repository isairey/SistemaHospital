/**
 * @summary This dto is to represent the response received from the server while fetching Consent Form information
 */
export class ERGetConsentForm_DTO {
    /**
     * @summary ERPatientId refers to the Emergency Patient for which transaction is being done
     */
    ERPatientId: number = 0;
    /**
     * @summary FileId refers to the Consent File
     */
    FileId: number = 0;
    /**
     * @summary PatientId refers to the Patient for which transaction is being done
     */
    PatientId: number = 0;
    /**
     * @summary ShortName refers to Patient's ShortName
     */
    ShortName: string = "";
    /**
     * @summary FileType refers to the type of Consent File
     */
    FileType: string = "";
    /**
     * @summary FileName refers to the Consent File Name
     */
    FileName: string = "";
    /**
     * @summary DisplayName refers to the Consent File DisplayName
     */
    DisplayName: string = "";
    /**
     * @summary BinaryData refers to the Binary Data of the Consent File
     */
    BinaryData: string = "";
}