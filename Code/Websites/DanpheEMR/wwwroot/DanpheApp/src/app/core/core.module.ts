import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';

import { SettingsBLService } from '../settings-new/shared/settings.bl.service';
import { authInterceptorProviders } from '../shared/token-interceptor/token-interceptor.service';
import { CoreBLService } from './shared/core.bl.service';
import { CoreDLService } from './shared/core.dl.service';
import { CoreService } from './shared/core.service';
//import { BackButtonDisable } from './shared/backbutton-disable.service'

@NgModule({
    //* AuthInterceptor needed in order to inject LoginJwtToken in Request Header of every request created from this module since it is not using SharedModule
    providers: [CoreDLService, CoreBLService, CoreService, SettingsBLService, authInterceptorProviders],
    imports: [
        CommonModule,
        //BackButtonDisable,
        HttpClientModule
    ],
    declarations: [

    ],
    bootstrap: []//do we need anything here ? <sudarshan:2jan2017>
})
export class CoreModule {

}