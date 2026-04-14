//This grid is to show list of Lab Report Templates
import { SecurityService } from '../../../security/shared/security.service';

export default class LabLISGridColumnSettings {

    static securityServ: any;
    constructor(public securityService: SecurityService) {
        LabLISGridColumnSettings.securityServ = this.securityService;
    }


    public static ComponentMappingListCols = [
        { headerName: "Machine Name", field: "MachineName", width: 120 },
        { headerName: "Component Name", field: "ComponentName", width: 140 },
        { headerName: "LIS Component Name", field: "LISComponentName", width: 140 },
        { headerName: "Conversion Factor", field: "ConversionFactor", width: 80 },
        { headerName: "IsActive", width: 50, cellRenderer: LabLISGridColumnSettings.GetIsActive },
        {
            headerName: "Actions",
            width: 100,
            cellRenderer: LabLISGridColumnSettings.GetLISMappingActions
        }

    ];

    public static GetLISMappingActions(param) {
        let template = `<a danphe-grid-action="edit" class="grid-action">
        Edit
        </a>`;
        if (param.data.IsActive) {
            template += `
            <a danphe-grid-action="delete" class="grid-action">
            Deactivate
            </a>`
        }
        else {
            template += `
            <a danphe-grid-action="activate" class="grid-action">
            Activate
            </a>`
        }
        return template;
    }

    public static GetIsActive(param) {
        let template = ``;
        if (param.data.IsActive) {
            template += `
            <p style="color:green;font-weight: bold;">
            YES
            </p>`
        }
        else {
            template += `
            <p style="color:red;font-weight: bold;">
            NO
            </p>`
        }
        return template;
    }
}
