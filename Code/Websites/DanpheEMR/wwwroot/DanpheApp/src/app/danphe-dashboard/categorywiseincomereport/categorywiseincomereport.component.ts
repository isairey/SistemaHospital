import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ChartService } from '../Services/chart.service';
import { DashboardService } from '../Services/dashboard.service';
import { ChartConfig, Dataset } from '../danphe-dashboard.models';

@Component({
  selector: 'app-categorywiseincomereport',
  templateUrl: './categorywiseincomereport.component.html',
  styleUrls: ['./categorywiseincomereport.component.css']
})
export class CategoryWiseIncomeReportComponent implements OnInit, OnDestroy {

  /**
   * @summary - Reference to the canvas element for the category-wise chart.
   */
  @ViewChild('categorywisechart') CategoryWiseChart!: ElementRef<HTMLCanvasElement>;

  /**
   * @summary The selected time period for displaying the chart.
   * @default 'yearly'
   */
  @Input() TimePeriod: string = 'yearly';

  private Subscriptions = new Subscription();


  constructor(private _chartService: ChartService, private _dashboardService: DashboardService) { }

  ngOnInit(): void {
    /**
     * @summary Initializes the component and loads data for the chart.
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

  categoryReports = [
    { id: 1, categoryreport: 'OT', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 2, categoryreport: 'Consultation', collection: 'Rs.4,002,720.00', return: '4652245' },
    { id: 3, categoryreport: 'Biochemistry', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 4, categoryreport: 'Uro Surgery', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 5, categoryreport: 'Immunology', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 6, categoryreport: 'Round Charge', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 7, categoryreport: 'Ultrasound', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 8, categoryreport: 'Bed Charge', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 9, categoryreport: 'XRAY', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 10, categoryreport: 'ICU', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 11, categoryreport: 'CT Scan', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 12, categoryreport: 'Dialysis', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 13, categoryreport: 'Double Cabin', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 14, categoryreport: 'Procedure', collection: 'Rs.4,002,720.00', return: '46545' },
    { id: 15, categoryreport: 'Hematology', collection: 'Rs.4,002,720.00', return: '46545' },
  ];

  LoadData(): void {
    this.CreateCategoryReportChart();
  }

  /**
   * @summary Generates a bar chart representing collection and return counts across different categories.
   */
  CreateCategoryReportChart(): void {
    // Filtering out empty or invalid entries
    const validCategoryReports = this.categoryReports.filter(report => report.categoryreport && report.collection && report.return);

    if (validCategoryReports.length === 0) {
      console.log('No valid data available for creating the Category Wise Income chart.');
      return;
    }

    const labels = validCategoryReports.map(report => report.categoryreport);
    const collections = validCategoryReports.map(report => parseFloat(report.collection.replace('Rs.', '').replace(/,/g, '')));
    const returns = validCategoryReports.map(report => parseInt(report.return, 10));

    const datasets: Dataset[] = [
      {
        label: 'Collection',
        data: collections,
        backgroundColor: Array(validCategoryReports.length).fill('rgba(7, 115, 188, 0.6)'),
        borderColor: Array(validCategoryReports.length).fill('rgba(7, 115, 188)'),
        borderWidth: 1
      },
      {
        label: 'Return',
        data: returns,
        backgroundColor: Array(validCategoryReports.length).fill('rgba(169, 228, 169, 0.6)'),
        borderColor: Array(validCategoryReports.length).fill('rgba(169, 228, 169)'),
        borderWidth: 1
      }
    ];

    const chartConfig: ChartConfig = {
      chartRef: this.CategoryWiseChart.nativeElement,
      chartType: 'bar',
      labels: labels,
      datasets: datasets,
      chartTitle: 'Category Wise Income Report',
      xAxisLabel: 'Category',
      yAxisLabel: 'Amount',
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
