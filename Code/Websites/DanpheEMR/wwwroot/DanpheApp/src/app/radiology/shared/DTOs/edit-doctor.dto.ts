import { Employee_DTO } from "./employee.dto";

export class EditDoctor_DTO {
  NewPerformer = new Employee_DTO;
  NewPrescriber = new Employee_DTO;
  BillTxnItemId: number = 0;
  RequisitionId: number = 0;
  NewReferrer = new Employee_DTO;
}
