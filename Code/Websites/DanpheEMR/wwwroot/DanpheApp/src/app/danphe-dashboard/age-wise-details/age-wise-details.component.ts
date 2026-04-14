import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartService } from '../Services/chart.service';
import { DashboardService } from '../Services/dashboard.service';
import { ChartConfig } from '../danphe-dashboard.models';

@Component({
  selector: 'app-age-wise-details',
  templateUrl: './age-wise-details.component.html',
  styleUrls: ['./age-wise-details.component.css']
})
export class AgeWiseDetailsComponent implements OnInit, OnDestroy {

  /**
   * @summary - Reference to the canvas element for the age-wise chart.
   */
  @ViewChild('agewisechart') Agewisechart!: ElementRef<HTMLCanvasElement>;

  /**
   * @summary The selected time period for displaying the chart.
   * @default 'yearly'
   */
  @Input() TimePeriod: string = 'yearly';


  private Subscriptions = new Subscription();

  /** 
   * @summary - Age-wise reports data 
   */
  AgeWiseReports = [
    { ageRange: '0-9 Years', maleCount: 1045, femaleCount: 1552 },
    { ageRange: '10-14 Years', maleCount: 5255, femaleCount: 7526 },
    { ageRange: '15-19 Years', maleCount: 5522, femaleCount: 222 },
    { ageRange: '20-59 Years', maleCount: 222, femaleCount: 258 },
    { ageRange: '60-69 Years', maleCount: 2552, femaleCount: 5895 },
    { ageRange: '70 above Years', maleCount: 252, femaleCount: 5525 },
  ];

  constructor(private _chartService: ChartService, private _dashboardService: DashboardService) { }

  ngOnInit(): void {
    /**
    * @summary Initializes the component and loads data for the chart.
    * 
    * Subscribes to changes in the current time period and reloads the chart data
    * whenever the time period is updated.
    */
    this.LoadData();
    this.Subscriptions.add(this._dashboardService.CurrentTimePeriod$.subscribe(period => {
      this.TimePeriod = period;
      this.LoadData();
    }));
  }

  ngOnDestroy(): void {
    this.Subscriptions.unsubscribe();
  }

  LoadData(): void {
    this.CreateAgeWiseChart();
  }

  /**
   * @summary Generates a bar chart representing male and female counts across different age ranges.
   */
  CreateAgeWiseChart(): void {
    const validAgeWiseReports = this.AgeWiseReports.filter(report => report.ageRange && report.maleCount >= 0 && report.femaleCount >= 0);

    if (validAgeWiseReports.length === 0) {
      console.log('No valid data available for creating the Age Wise chart.');
      return;
    }

    const labels = validAgeWiseReports.map(report => report.ageRange);
    const maleCounts = validAgeWiseReports.map(report => report.maleCount);
    const femaleCounts = validAgeWiseReports.map(report => report.femaleCount);

    const datasets = [
      {
        label: 'Male',
        data: maleCounts,
        backgroundColor: Array(validAgeWiseReports.length).fill('rgba(7, 115, 188, 0.6)'),
        borderColor: Array(validAgeWiseReports.length).fill('rgba(7, 115, 188)'),
        borderWidth: 1
      },
      {
        label: 'Female',
        data: femaleCounts,
        backgroundColor: Array(validAgeWiseReports.length).fill('rgba(132, 227, 132, 0.6)'),
        borderColor: Array(validAgeWiseReports.length).fill('rgba(132, 227, 132)'),
        borderWidth: 1
      }
    ];

    const chartConfig: ChartConfig = {
      chartRef: this.Agewisechart.nativeElement,
      chartType: 'bar',
      labels: labels,
      datasets: datasets,
      chartTitle: 'Age Wise Details Chart',
      xAxisLabel: 'Age Range',
      yAxisLabel: 'Count',
      colors: [],
      legendPosition: 'top'
    };

    this._chartService.CreateChart(chartConfig);
  }


  /**
   * @summary Updates the selected time period and reloads data for the chart.
   * @param newTimePeriod - The new time period selected by the user.
   */
  OnTimePeriodChange(newTimePeriod: string): void {
    this.TimePeriod = newTimePeriod;
    this.LoadData();
  }

  OnButtonClick() {

  }

}
