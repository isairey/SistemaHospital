import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class LoadingSpinnerComponent {
  constructor() { }
}