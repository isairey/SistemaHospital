import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export class RegistrationStickerSettingsModel {
    public RegistrationStickerSettingsId: number = 0;
    public StickerName: string = "";
    public StickerGroupCode: string = "";
    public VisitType: string = "";
    public IsDefaultForCurrentVisitType: boolean = false;
    public VisitDateLabel: string = "";
    public ShowSchemeCode: boolean = false;
    public ShowMemberNo: boolean = false;
    public MemberNoLabel: string = "";
    public ShowClaimCode: boolean = false;
    public ShowIpdNumber: boolean = false;
    public ShowWardBedNo: boolean = false;
    public ShowRegistrationCharge: boolean = false;
    public ShowPatContactNo: boolean = false;
    public ShowPatientDesignation: boolean = false;
    public PatientDesignationLabel: string = "";
    public ShowQueueNo: boolean = false;
    public IsActive: boolean = false;
    public QueueNoLabel: string = "";
    public RegistrationStickerValidator: FormGroup = null;


    constructor() {

        const _formBuilder = new FormBuilder();
        this.RegistrationStickerValidator = _formBuilder.group({
            'RegistrationStickerSettingsId': [0],
            'StickerGroupCode': ['', Validators.compose([Validators.maxLength(20), Validators.required])],
            'StickerName': ['', Validators.compose([Validators.required])],
            'VisitType': ['', Validators.compose([Validators.maxLength(15), , Validators.required])],
            'VisitDateLabel': ['', Validators.compose([Validators.required])],
            'MemberNoLabel': ['', Validators.compose([Validators.required])],
            'PatientDesignationLabel': ['', Validators.compose([Validators.required])],
            'QueueNoLabel': ['', Validators.compose([Validators.required])],
            'IsDefaultForCurrentVisitType': [false],
            'ShowSchemeCode': [false],
            'ShowMemberNo': [false],
            'ShowClaimCode': [false],
            'ShowIpdNumber': [false],
            'ShowWardBedNo': [false],
            'ShowRegistrationCharge': [false],
            'ShowPatContactNo': [false],
            'ShowPatientDesignation': [false],
            'ShowQueueNo': [false]
        });
    }

    public IsDirty(fieldName): boolean {
        if (fieldName == undefined)
            return this.RegistrationStickerValidator.dirty;
        else
            return this.RegistrationStickerValidator.controls[fieldName].dirty;
    }

    public IsValid(): boolean { if (this.RegistrationStickerValidator.valid) { return true; } else { return false; } }
    public IsValidCheck(fieldName, validator): boolean {
        if (fieldName == undefined) {
            return this.RegistrationStickerValidator.valid;
        }

        else
            return !(this.RegistrationStickerValidator.hasError(validator, fieldName));
    }
}