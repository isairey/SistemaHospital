import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartsService {

  constructor() { }

  GenerateColorCodeForVitals(key: string): string {
    const reservedColors = [
      'rgb(256, 20, 20)', // Red
      'rgb(52, 165, 14)', // Green
      'rgb(222, 16, 237)', // Purple
      'rgb(0, 0, 0)', // Black
      'rgb(51, 129, 232)', // Blue
      'rgb(234, 152, 28)' // Orange
    ];
    let color: string = '';
    if (key === 'BP_Systolic') {
      color = 'rgb(256, 20, 20)';
    }
    else if (key === 'BP_Diastolic') {
      color = 'rgb(52, 165, 14)';
    }
    else if (key === 'Pulse') {
      color = 'rgb(222, 16, 237)';
    }
    else if (key === 'R_Rate') {
      color = 'rgb(0, 0, 0)';
    }
    else if (key === 'SPO2') {
      color = 'rgb(51, 129, 232)';
    }
    else if (key === 'Temp') {
      color = 'rgb(234, 152, 28)';
    }
    else {
      color = this.GetRandomColor(reservedColors);
    }
    return color;
  }

  GetRandomColor(reservedColors: string[]): string {
    let r, g, b;
    let color: string = '';
    do {
      r = Math.floor(Math.random() * 256);
      g = Math.floor(Math.random() * 256);
      b = Math.floor(Math.random() * 256);
      color = `rgb(${r},${g},${b})`;
    } while (reservedColors.includes(color));
    return color;
  }

  CreateDatasetsAndYAxisConfig(VitalsDataArray: any, Datasets: any[], yAxesConfig: any[]): void {
    // Iterate over each key in VitalsDataArray
    for (let key in VitalsDataArray) {
      if (Array.isArray(VitalsDataArray[key])) {
        if (key === 'CreatedOn') continue;

        let color = this.GenerateColorCodeForVitals(key);

        // Define the yAxisId dynamically based on the key
        let yAxisId = `y-axis-${key}`;

        // Create a dataset object
        let dataset = {
          label: key,
          data: VitalsDataArray[key],
          backgroundColor: color, // Use the same color
          borderColor: color, // Use the same color
          fill: false,
          yAxisID: yAxisId,
          spanGaps: true, // Use to skip the vitals values
        };
        // Push the dataset to the datasets array
        Datasets.push(dataset);

        // Create the yAxis configuration object
        let yAxis = {
          id: yAxisId,
          type: 'linear',
          position: 'left',
          scaleLabel: {
            display: true,
            labelString: key, // Use the key as the label string
            fontColor: color // Use the same color for font as the dataset
          },
          ticks: {
            beginAtZero: true,
            fontColor: color // Use the same color for ticks as the dataset
          },
          gridLines: {
            display: true,
            drawOnChartArea: false,
            color: color // Use the same color for gridLines as the dataset
          }
        };
        // Push the yAxis configuration object to the array
        yAxesConfig.push(yAxis);
      }
    }
  }

}
