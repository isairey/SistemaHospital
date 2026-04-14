import { Injectable } from '@angular/core';
import { Chart } from 'chart.js';
import { ChartConfig, DoughnutChartConfig } from '../danphe-dashboard.models';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  constructor() { }

  /**
   * Creates a chart using Chart.js.
   * @param config - Configuration object for the chart.
   * @summary Creates a chart using Chart.js and returns the created chart instance.
   * @returns The created chart instance.
   */
  CreateChart(config: ChartConfig): Chart {
    const data = {
      labels: config.labels,
      datasets: config.datasets.map((dataset) => ({
        label: dataset.label,
        data: dataset.data,
        backgroundColor: dataset.backgroundColor || this.generateRandomColor(),
        borderColor: dataset.borderColor || this.generateRandomColor(),
        borderWidth: dataset.borderWidth,
        fill: true
      }))
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: config.legendPosition
      },
      title: {
        display: true,
        text: config.chartTitle
      },
      scales: {
        xAxes: [{
          scaleLabel: {
            display: true,
            labelString: config.xAxisLabel
          }
        }],
        yAxes: [{
          scaleLabel: {
            display: true,
            labelString: config.yAxisLabel
          }
        }]
      }
    };

    return new Chart(config.chartRef, {
      type: config.chartType,
      data: data,
      options: options
    });
  }

  /**
   * Creates a doughnut chart using Chart.js.
   * @param config - Configuration object for the doughnut chart.
   * @summary Creates a doughnut chart using Chart.js and returns the created chart instance.
   * @returns The created chart instance.
   */
  CreateDoughnutChart(config: DoughnutChartConfig): Chart {
    const chartData = {
      labels: config.labels,
      datasets: [{
        label: 'Number of Tests',
        data: config.data,
        backgroundColor: config.colors,
        hoverOffset: 4
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: config.legendPosition
        },
        title: {
          display: true,
          text: config.chartTitle
        }
      }
    };

    return new Chart(config.chartRef, {
      type: 'doughnut',
      data: chartData,
      options: options
    });
  }

  /**
 
* @summary  It gives a random color in RGBA format with 50% opacity.
* @returns returns a string representing the RGBA color.
*/
  private generateRandomColor(): string {
    return `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.5)`;
  }

}
