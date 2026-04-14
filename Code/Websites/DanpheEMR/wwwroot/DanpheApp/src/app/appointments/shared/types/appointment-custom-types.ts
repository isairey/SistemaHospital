/* FollowupOption type is to configure the Follow up options for manual follow up in manage visit page*/
export type FollowupOption = { id: number, code: string, value: string };

/* VisitTypeOption is to configure Visit Type Options in Manage Visit page*/
export type VisitTypeOption = { id: number, value: string, displayOutpatient: boolean, displayInPatient: boolean };
