import { FiscalYearModel } from "../settings/shared/fiscalyear.model";

//We can extend this model to fill up other information of current hospital whenever required.

export class CommonHospitalInfoVM {
    public ActiveHospitalId: number = 0;
    public FiscalYearList: Array<FiscalYearModel> = [];
    public TodaysDate: string = null;
    public CurrFiscalYear: FiscalYearModel = new FiscalYearModel();
}

