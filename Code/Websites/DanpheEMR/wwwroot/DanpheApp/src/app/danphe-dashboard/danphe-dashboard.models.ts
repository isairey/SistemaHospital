import { ChartType } from 'chart.js';

export class Dataset {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
}

export class ChartConfig {
    chartRef!: HTMLCanvasElement;
    chartType!: ChartType;
    labels!: string[];
    datasets!: Dataset[];
    chartTitle!: string;
    colors!: string[];
    legendPosition: 'top' | 'left' | 'bottom' | 'right' = 'top';
    xAxisLabel?: string;
    yAxisLabel?: string;
}

export class DoughnutChartConfig {
    chartRef!: HTMLCanvasElement;
    labels!: string[];
    data!: number[];
    colors!: string[];
    chartTitle!: string;
    legendPosition: 'top' | 'left' | 'bottom' | 'right' = 'top';
}
