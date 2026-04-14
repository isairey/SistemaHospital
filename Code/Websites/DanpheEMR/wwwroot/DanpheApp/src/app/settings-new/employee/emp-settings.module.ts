import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthGuardService } from '../../security/shared/auth-guard.service';
import { DanpheAutoCompleteModule } from '../../shared/danphe-autocomplete';
import { SharedModule } from '../../shared/shared.module';
import { EmployeeAddComponent } from './emp-mst/employee-add.component';
import { EmployeeListComponent } from './emp-mst/employee-list.component';
import { EmployeeRoleAddComponent } from './emp-role/employee-role-add.component';
import { EmployeeRoleListComponent } from './emp-role/employee-role-list.component';
import { EmpSalutationComponent } from './emp-salutation/emp-salutation.component';
import { EmpSettingsMainComponent } from './emp-settings-main.component';
import { EmployeeTypeAddComponent } from './emp-types/employee-type-add.component';
import { EmployeeTypeListComponent } from './emp-types/employee-type-list.component';

export const empSettingsRoutes =
  [
    {
      path: '', component: EmpSettingsMainComponent,
      children: [
        { path: '', redirectTo: 'ManageEmployee', pathMatch: 'full' },
        { path: 'ManageSalutation', component: EmpSalutationComponent, canActivate: [AuthGuardService] },
        { path: 'ManageEmployee', component: EmployeeListComponent, canActivate: [AuthGuardService] },
        { path: 'ManageEmployeeRole', component: EmployeeRoleListComponent, canActivate: [AuthGuardService] },
        { path: 'ManageEmployeeType', component: EmployeeTypeListComponent, canActivate: [AuthGuardService] }
      ]
    }
  ]


@NgModule({
  providers: [

    { provide: LocationStrategy, useClass: HashLocationStrategy }],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    DanpheAutoCompleteModule,
    RouterModule.forChild(empSettingsRoutes),
  ],
  declarations: [
    EmpSettingsMainComponent,
    EmployeeAddComponent,
    EmployeeListComponent,
    EmployeeRoleAddComponent,
    EmployeeRoleListComponent,
    EmployeeTypeAddComponent,
    EmployeeTypeListComponent,
    EmpSalutationComponent
  ],

  exports: [
    EmployeeRoleAddComponent
  ],
  bootstrap: []
})
export class EmpSettingsModule {

}
