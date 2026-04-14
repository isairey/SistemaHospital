import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PageNotFound } from '../404-error/404-not-found.component';
import { AuthGuardService } from '../security/shared/auth-guard.service';
import { DanpheDashboardComponent } from './danphe-dashboard.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [

  {
    path: '',
    component: DanpheDashboardComponent, canActivate: [AuthGuardService],
    children: [
      {
        path: '', component: DashboardComponent, canActivate: [AuthGuardService],
      },
      {
        path: '**', component: PageNotFound
      }
    ]

  },
  { path: '**', component: PageNotFound }


];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DanpheDashboardRoutingModule { }
