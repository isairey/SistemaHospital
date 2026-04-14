import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fractionsummary',
  templateUrl: './fractionsummary.component.html',
  styleUrls: ['./fractionsummary.component.css']
})
export class FractionSummaryComponent implements OnInit {

  public SelectedDate: string = '2059-03-04';
  public goToDatePick: boolean = false;
  public isFutureDateEnabled: boolean = true;

  constructor() { }

  ngOnInit() {
  }

  FocusOutFromDatePicker(event: any) {

  }

  OnButtonClick() {

  }

}
