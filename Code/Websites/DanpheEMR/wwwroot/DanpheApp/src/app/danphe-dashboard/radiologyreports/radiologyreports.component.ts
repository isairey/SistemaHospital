import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartConfig, Dataset } from '../danphe-dashboard.models';
import { ChartService } from '../Services/chart.service';
import { DashboardService } from '../Services/dashboard.service';

/**
 * @summary Displays the distribution of various radiology report categories using a horizontal bar chart.
 */
@Component({
  selector: 'app-radiologyreports',
  templateUrl: './radiologyreports.component.html',
  styleUrls: ['./radiologyreports.component.css']
})
export class RadiologyReportsComponent implements OnInit, OnDestroy {

  /** 
   * @summary Reference to the canvas element for the radiology chart. 
   */
  @ViewChild('radiologychart') RadiologyChartRef!: ElementRef<HTMLCanvasElement>;

  /** 
   * @summary Time period for the chart data, default is 'yearly'.
   */
  @Input() TimePeriod: string = 'yearly';

  private Subscriptions = new Subscription();


  constructor(private chartService: ChartService, private _dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.LoadData();
    // Subscribe to changes in the selected time period
    this.Subscriptions.add(this._dashboardService.CurrentTimePeriod$.subscribe(period => {
      this.TimePeriod = period;
      this.LoadData();
    }));
  }

  ngOnDestroy(): void {
    this.Subscriptions.unsubscribe();
  }

  LoadData(): void {
    this.CreateRadiologyReportChart();
  }

  /**
   * @summary Generates a horizontal bar chart representing various radiology report statuses across categories.
   */

  CreateRadiologyReportChart(): void {
    const categories = [
      'CT', 'CT Scan', 'Doppler', 'Extra', 'Gastrology',
      'IVU', 'Mammagram', 'Micturating Cystourethro',
      'MRI Report', 'Neurology', 'Sonomammagram',
      'Special Producer', 'UltraSound', 'Ultrasound(USG)', 'X-ray'
    ];

    const statuses = ['Waiting', 'CheckIn', 'Reported', 'Verified', 'Appointment'];

    const colors = [
      'rgba(255, 99, 132, 0.5)',
      'rgba(54, 162, 235, 0.5)',
      'rgba(75, 192, 192, 0.5)',
      'rgba(255, 159, 64, 0.5)',
      'rgba(153, 102, 255, 0.5)'
    ];

    const validCategories = categories.filter(cat => cat.trim() !== '');
    const validStatuses = statuses.filter(stat => stat.trim() !== '');

    if (validCategories.length === 0 || validStatuses.length === 0) {
      console.log('Categories or statuses are empty or invalid. Cannot create chart.');
      return;
    }

    const datasets: Dataset[] = validStatuses.map((status, index) => ({
      label: status,
      data: this.getNumbers(validCategories.length),
      backgroundColor: validCategories.map(() => colors[index % colors.length]),
      borderColor: validCategories.map(() => colors[index % colors.length]),
      borderWidth: 1
    }));

    const chartConfig: ChartConfig = {
      chartRef: this.RadiologyChartRef.nativeElement,
      chartType: 'horizontalBar',
      labels: validCategories,
      datasets: datasets,
      chartTitle: 'Radiology Reports Chart',
      xAxisLabel: 'Count',
      yAxisLabel: 'Categories',
      colors: colors,
      legendPosition: 'top'
    };

    this.chartService.CreateChart(chartConfig);
  }


  /**
   * @summary Generates an array of random numbers for the given count.
   * @param count - The number of random numbers to generate.
   * @returns An array of random numbers.
   */
  private getNumbers(count: number): number[] {
    const numbers = [];
    for (let i = 0; i < count; i++) {
      numbers.push(Math.floor(Math.random() * 4000));
    }
    return numbers;
  }

  /**
   * @summary Updates the time period and reloads the data when it changes.
   * @param newTimePeriod - The new time period selected.
   */
  OnTimePeriodChange(newTimePeriod: string): void {
    this.TimePeriod = newTimePeriod;
    this.LoadData();
  }

  OnButtonClick() {

  }

}
