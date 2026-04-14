export class ReportGroupServiceItemMappingModel {
    public DynamicReportGroupId: number;
    public ServiceItemId: number = null;
    public IsActive: boolean = false;
    public ServiceDepartmentId: number;

    public ItemName: string = null;
    public ServiceDepartmentName: string = null;
    public IsSelected: boolean = false;
}
