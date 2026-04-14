import { Allergy } from "../model/allergy.model";

export class PatientDetails_DTO {
  public PatientId: number = 0;
  public PatientCode: string = "";
  public ShortName: string = "";
  public Name: string = "";
  public FirstName: string = "";
  public LastName: string = "";
  public MiddleName: string = "";
  public FullName: string = "";
  public Age: string = "";
  public Gender: string = "";
  public PhoneNumber: string = "";
  public DateOfBirth: string = "";
  public Address: string = "";
  public SchemeName: string = "";
  //public WardName: string = "";
  public VisitCode: string = "";
  public VisitType: string = '';
  public Unit: string = "";
  public Rank: string = "";
  public AdmittedDate: string = "";
  public PatientVisitId: number = 0;
  public CountryName: string = "";
  public WardBed: string = "";
  public SchemeId: number = 0;
  public PriceCategoryId: number = 0;
  public DepartmentName: string = "";
  public BedId: number = 0;
  public WardId: number = 0;
  public BedNumber: number = 0;
  public WardName: string = "";
  public BedCode: string = "";
  public AdmittingDoctorName: string = "";
  public Doctor: string = "";
  public AppointmentDate: string = "";
  public AppointmentTime: string = "";
  public CareOfPersonName: string = "";
  public CareOfPersonPhoneNo: string = "";
  public AdmissionStatus: string = "";
  public DischargeDate: string = "";
  public CountrySubDivisionName: string = "";
  public MunicipalityName: string = "";
  public WardNumber: number = 0;
  public BedFeature: string = "";
  public VisitDateTime: string = "";
  public AppointmentType: string = "";
  public Allergies: Array<Allergy> = new Array<Allergy>();


  //added: sud-15Jun'18-- to show in patientoverview page, use it in other places as well if required.
  public AllergyFormatted = { Primary: "", Secondary: "" };
  public AdmittingDoctorId: number = 0;
  public PerformerId: number = 0;


  public FormatPatientAllergies() {

    if (this.Allergies && this.Allergies.length > 0) {
      //First allergy will be Primary, and remaining will come as secondary allergies.
      //Priority Sequence is by type:  Allergy > AdvRec > Others.
      let primAllerg = this.Allergies.find(alrg => alrg.AllergyType == "Medication")
        || this.Allergies.find(alrg => alrg.AllergyType == "Non Medication") || this.Allergies.find(alrg => alrg.AllergyType == "Others");

      if (primAllerg) {
        this.AllergyFormatted.Primary = primAllerg.AllergenAdvRecName;

        let secAllrgString = "";
        //if (secAllrgs && secAllrgs.length > 0) {
        this.Allergies.forEach(a => {
          secAllrgString += a.AllergenAdvRecName + "<br/>";
        });
        this.AllergyFormatted.Secondary = secAllrgString;
        // }

      }


    }

  }
}
