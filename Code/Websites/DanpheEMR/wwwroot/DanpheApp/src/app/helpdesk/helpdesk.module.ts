
import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HlpDskBedInfoComponent } from "./bedinfo/bed-info.component";
import { HlpDskEmployeeInfoComponent } from "./employeeinfo/employee-info.component";
import { HelpdeskMainComponent } from "./helpdesk-main.component";
import { HelpdeskRoutingModule } from "./helpdesk-routing.module";
import { HelpDeskBLService } from './shared/helpdesk.bl.service';
import { HelpDeskDLService } from './shared/helpdesk.dl.service';
import { HlpDskWardInfoComponent } from "./wardinfo/ward-info.component";
//import { Ng2AutoCompleteModule } from 'ng2-auto-complete';
import { DanpheAutoCompleteModule } from '../shared/danphe-autocomplete/danphe-auto-complete.module';
import { SharedModule } from "../shared/shared.module";
import { HlpDskQueueInfoComponent } from './queueinformation/queue-info.componet';
import { HlpDskWardDetailedInfoComponent } from './wardinfo/ward-detailed-info.component';
@NgModule({
  providers: [
    HelpDeskBLService,
    HelpDeskDLService,
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ],
  imports: [
    HelpdeskRoutingModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    DanpheAutoCompleteModule,
    SharedModule,

  ],
  declarations: [
    HelpdeskMainComponent,
    HlpDskBedInfoComponent,
    HlpDskEmployeeInfoComponent,
    HlpDskWardInfoComponent,
    HlpDskQueueInfoComponent,
    HlpDskWardDetailedInfoComponent
  ],
  bootstrap: []
})
export class HelpdeskModule { }
