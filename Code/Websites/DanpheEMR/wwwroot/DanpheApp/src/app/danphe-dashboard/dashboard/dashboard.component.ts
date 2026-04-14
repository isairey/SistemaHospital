import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartService } from '../Services/chart.service';
import { DashboardService } from '../Services/dashboard.service';
import { DoughnutChartConfig } from '../danphe-dashboard.models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  /** 
   * @summary - Reference to the canvas element for the lab details chart.
   */
  @ViewChild('labDetailsChart') LabDetailsChartRef!: ElementRef;

  /** 
   * @summary - Reference to the canvas element for the radio details chart. 
   */
  @ViewChild('radioDetailsChart') RadioDetailsChartRef!: ElementRef;

  ActiveButton: string = 'yearly';

  private Subscriptions = new Subscription();

  constructor(private chartService: ChartService, private _dashboardService: DashboardService) { }

  ngOnInit(): void {
    /**
     * @summary Initializes the component and subscribes to changes in the current time period.
     */
    this.Subscriptions.add(this._dashboardService.CurrentTimePeriod$.subscribe(() => {
      this.LoadCharts();
    }));
  }

  ngOnDestroy(): void {
    this.Subscriptions.unsubscribe();
  }

  /**
   * @summary Sets the active time period button and notifies the service.
   * @param period - The selected time period (e.g., 'daily', 'weekly', 'monthly', 'yearly').
   */
  SetActiveButton(period: string): void {
    this.ActiveButton = period;
    this._dashboardService.ChangeTimePeriod(period);
  }

  /**
   * @summary Loads all charts when the time period changes.
   */
  LoadCharts(): void {
    this.CreateLabDetailsChart();
    this.CreateRadioDetailsChart();
  }

  /**
   * @summary - Generates a doughnut chart representing various lab status counts.
   */
  CreateLabDetailsChart(): void {
    const labels = ['Ordered', 'Sampled', 'Received', 'Reported', 'PreVerified', 'Verified'];
    const data = [300, 50, 100, 600, 20, 89];
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(132, 227, 132)',
      'rgb(255, 205, 86)',
      'rgb(7, 115, 188)',
      'rgb(153, 102, 255)',
      'rgb(255, 159, 64)'
    ];

    const validLabels = labels.filter(label => label.trim() !== '');
    const validData = data.filter(num => num >= 0);

    if (validLabels.length > 0 && validData.length > 0 && validLabels.length === validData.length) {
      const chartConfig: DoughnutChartConfig = {
        chartRef: this.LabDetailsChartRef.nativeElement,
        labels: validLabels,
        data: validData,
        colors: colors,
        chartTitle: 'Lab Status Distribution',
        legendPosition: 'bottom'
      };

      this.chartService.CreateDoughnutChart(chartConfig);
    } else {
      console.log('Invalid data or labels for Lab Details Chart.');
    }
  }

  /**
   * @summary Generates a doughnut chart representing various radio status counts.
   */
  CreateRadioDetailsChart(): void {
    const labels = ['Waiting', 'CheckIn', 'Reported', 'Verified', 'Appointment'];
    const data = [300, 50, 100, 600, 20];
    const colors = [
      'rgb(255, 99, 132)',
      'rgb(132, 227, 132)',
      'rgb(153, 102, 255)',
      'rgb(7, 115, 188)',
      'rgb(255, 159, 64)'
    ];

    const validLabels = labels.filter(label => label.trim() !== '');
    const validData = data.filter(num => num >= 0);

    if (validLabels.length > 0 && validData.length > 0 && validLabels.length === validData.length) {
      const chartConfig: DoughnutChartConfig = {
        chartRef: this.RadioDetailsChartRef.nativeElement,
        labels: validLabels,
        data: validData,
        colors: colors,
        chartTitle: 'Radio Status Distribution',
        legendPosition: 'top'
      };

      this.chartService.CreateDoughnutChart(chartConfig);
    } else {
      console.log('Invalid data or labels for Radio Details Chart.');
    }
  }


  OnButtonClick() {
    console.log('Button clicked');

  }

}
