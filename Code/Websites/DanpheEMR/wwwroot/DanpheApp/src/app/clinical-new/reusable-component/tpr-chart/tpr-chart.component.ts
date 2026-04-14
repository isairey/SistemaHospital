import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart } from "chart.js";
import * as moment from 'moment';
import { CoreService } from '../../../core/shared/core.service';
import { DanpheHTTPResponse } from '../../../shared/common-models';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { ENUM_ClinicalField_InputType, ENUM_DanpheHTTPResponses, ENUM_MessageBox_Status, ENUM_VitalsType } from '../../../shared/shared-enums';
import { ChartsService } from '../../shared/charts.service';
import { ClinicalPatientService } from '../../shared/clinical-patient.service';
import { ClinicalNoteBLService } from '../../shared/clinical.bl.service';
import { Field } from '../../shared/dto/field.dto';
import { GetClnVitalsTXN_DTO } from '../../shared/dto/get-cln-vitals-txn.dto';
import { GetClnVitals_DTO } from '../../shared/dto/get-cln-vitals.dto';
import { GetOutput_DTO } from '../../shared/dto/get-output.dto';


@Component({
  selector: 'tpr-chart',
  templateUrl: './tpr-chart.component.html',
  styleUrls: ['./tpr-chart.component.css'],
})

export class TprChartComponent implements OnInit {
  Field: Field;
  IsAcrossVisitAvailability: boolean = false;
  @ViewChild('tprChart') tprChart!: ElementRef;
  ShowChart: boolean = false;
  AllMSTVitals = new Array<GetClnVitals_DTO>();
  FilteredMSTVitals = new Array<GetClnVitals_DTO>();
  PatientId: number = 0;
  PatientVisitId: number = 0;
  PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();
  yAxesConfig = []; //! Sanjeev, There're many properties of yAxes of Chart JS, We are using few of them only, further we might add or remove those properties, there's no exact properties, so we've kept datatype any
  Datasets = []; //! Sanjeev, There're many properties of Datasets of Chart JS, We are using few of them only, further we might add or remove those properties, there's no exact properties, so we've kept datatype any
  VitalsDataArray: any = {};
  GroupedBiometricsByVitalsName: any;
  GroupedOutputsByOutputType: any;
  ShowBiometrics = false;
  NoOfDays: number = 3;     //!Sanjeev Assign Last 3 Day by default
  loading: boolean = false;
  UniqueDateSet: string[] = [];
  AllDateTimeSet: string[] = [];
  UniqueDateSetForOutput: string[] = [];
  AllDateTimeSetForOutput: string[] = [];
  ShowOutput: boolean = false;
  PatientOutputs = new Array<GetOutput_DTO>();
  @ViewChild('headerAndPatientDetail') headerAndPatientDetail: ElementRef;
  @ViewChild('biometricsAndOutput') biometricsAndOutput: ElementRef;

  constructor(
    private _changeDetector: ChangeDetectorRef,
    private _selectedPatientsService: ClinicalPatientService,
    private _clinicalBLService: ClinicalNoteBLService,
    private _messageBoxService: MessageboxService,
    public coreService: CoreService,
    private _chartService: ChartsService,
  ) {

  }

  ToggleFullScreen() {
    const elem = this.tprChart.nativeElement;
    const doc: any = document;

    if (!doc.fullscreenElement) {

      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }

      elem.style.width = '100%';
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }

      elem.style.width = '95%'; // Adjust to your desired width
    }
  }
  ngAfterViewInit() {
    document.addEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }

  onFullscreenChange() {
    const doc: any = document;
    const elem = this.tprChart.nativeElement;

    if (!doc.fullscreenElement) {

      elem.style.width = '95%';
    } else {

      elem.style.width = '100%';
    }
  }

  ngOnDestroy() {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange.bind(this));
  }
  ngOnInit(): void {
    if (this.Field) {
      this.IsAcrossVisitAvailability = this.Field.IsAcrossVisitAvailability;
    } else {
      this.IsAcrossVisitAvailability = false;
    }
    let selectedPatient = this._selectedPatientsService.SelectedPatient;
    if (selectedPatient) {
      this.PatientId = selectedPatient.PatientId;
      this.PatientVisitId = selectedPatient.PatientVisitId;
    }
    (async (): Promise<void> => {
      try {
        await this.GetMSTVitals();
        await this.GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability, this.NoOfDays);
        await this.GetOutputDetailsByPatientVisitId(this.PatientVisitId, this.PatientId, this.IsAcrossVisitAvailability, this.NoOfDays);
        if (this.PatientAllVitals && this.PatientAllVitals.length) {
          this.FilterAndProcessPatientVitals();
          this.InitializeVitalsLabelAndInputField();
          this.ShowChart = true;
          this._changeDetector.detectChanges();
          if (this.ShowChart) {
            this.CreateDynamicTPRChart();
          }
        }
        else {
          this.ShowChart = false;
          this.ShowBiometrics = false;
        }
        if (this.PatientOutputs && this.PatientOutputs.length) {
          this.GroupPatientOutputs(this.PatientOutputs);
          this.ShowOutput = true;
        }
        else {
          this.ShowOutput = false;
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  LoadVitals(): void {
    (async (): Promise<void> => {
      try {
        await this.GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(this.PatientId, this.PatientVisitId, this.IsAcrossVisitAvailability, this.NoOfDays);
        await this.GetOutputDetailsByPatientVisitId(this.PatientVisitId, this.PatientId, this.IsAcrossVisitAvailability, this.NoOfDays);
        if (this.PatientAllVitals && this.PatientAllVitals.length) {
          this.FilterAndProcessPatientVitals();
          this.InitializeVitalsLabelAndInputField();
          this._changeDetector.detectChanges();
          if (this.ShowChart) {
            this.CreateDynamicTPRChart();
          }
        }
        else {
          this.ShowChart = false;
          this.ShowBiometrics = false;
        }
        if (this.PatientOutputs && this.PatientOutputs.length) {
          this.GroupPatientOutputs(this.PatientOutputs);
          this.ShowOutput = true;
        }
        else {
          this.ShowOutput = false;
        }
      }
      catch (err) {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Error, [`Error: ${err.ErrorMessage}`]);
      }
    })();
  }

  OnNumberOfDaysChange(days: number): void {
    if (days < 0) {
      this.NoOfDays = 0;
    }
  }

  async GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(patientId: number, patientVisitId: number, isAcrossVisitAvailability: boolean, noOfDays: number): Promise<void> {
    this.loading = true;
    this.VitalsDataArray = {};
    this.Datasets = [];
    this.GroupedBiometricsByVitalsName = null;
    this.PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();
    try {
      const res: DanpheHTTPResponse = await this._clinicalBLService.GetVitalsByPatientIdAndPatientVisitIdForTPRGraph(patientId, patientVisitId, isAcrossVisitAvailability, noOfDays).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results.length) {
          // this.PatientAllVitals = new Array<GetClnVitalsTXN_DTO>();
          this.PatientAllVitals = res.Results;
          this.PatientAllVitals = this.PatientAllVitals.map(vital => {
            // Replace spaces and periods with underscores in the VitalsName property
            vital.VitalsName = vital.VitalsName.replace(/\s/g, '_').replace(/\./g, '');
            return vital;
          });
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No vitals available for current patient.`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed : ${res.ErrorMessage}`]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
    finally {
      this.loading = false;
    }
  }

  async GetOutputDetailsByPatientVisitId(patientVisitId: number, patientId: number, isAcrossVisitAvailability: boolean, noOfDays: number): Promise<void> {
    this.loading = true;
    this.PatientOutputs = new Array<GetOutput_DTO>();
    try {
      const res: DanpheHTTPResponse = await this._clinicalBLService.GetOutputDetailsByPatientVisitId(patientVisitId, patientId, isAcrossVisitAvailability, noOfDays).toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results.length) {
          this.PatientOutputs = res.Results;
        }

      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed : ${res.ErrorMessage}`]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
    finally {
      this.loading = false;
    }
  }

  FilterAndProcessPatientVitals(): void {
    const patientVitals = this.PatientAllVitals.filter(v => v.VitalsType === ENUM_VitalsType.Vitals && v.InputType === ENUM_ClinicalField_InputType.Number);
    const patientBiometrics = this.PatientAllVitals.filter(v => v.VitalsType === ENUM_VitalsType.Biometric && v.InputType === ENUM_ClinicalField_InputType.Number);
    if (patientVitals && patientVitals.length) {
      this.GroupPatientVitals(patientVitals);
      this.ShowChart = true;
    }
    else {
      this.ShowChart = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No data available for patient vitals.`]);
    }
    if (patientBiometrics && patientBiometrics.length) {
      this.GroupPatientBiometrics(patientBiometrics);
      this.ShowBiometrics = true;
    }
    else {
      this.ShowBiometrics = false;
      this._messageBoxService.showMessage(ENUM_MessageBox_Status.Notice, [`No data available for patient biometrics.`]);
    }
  }

  GroupPatientVitals(patientVitals: GetClnVitalsTXN_DTO[]): void {
    const groupedVitalsByCreatedOn = patientVitals.reduce((acc, obj) => {
      const key = obj.CreatedOn;
      if (!acc[key]) {
        acc[key] = {};
      }
      if (!acc[key][obj.VitalsName]) {
        acc[key][obj.VitalsName] = [];
      }
      acc[key][obj.VitalsName].push(obj);
      return acc;
    }, {});
    console.log(groupedVitalsByCreatedOn);
    let vitals = this.ConvertVitalsDataToArray(groupedVitalsByCreatedOn);
    if (vitals && vitals.length) {
      // Iterate over each object in the vitals array
      vitals.forEach(item => {
        // Iterate over each key in the object
        for (let key in item) {
          // If the key doesn't exist in the keyArrays, initialize it as an array
          if (!this.VitalsDataArray[key]) {
            this.VitalsDataArray[key] = [];
          }
          // Push the value of the key into the corresponding array
          this.VitalsDataArray[key].push(item[key]);
        }
      });
      console.log(this.VitalsDataArray);
    }
  }

  GroupPatientBiometrics(patientBiometrics: GetClnVitalsTXN_DTO[]): void {
    const groupedOutputsByVitalsName = patientBiometrics.reduce((acc, obj) => {
      const key = obj.VitalsName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
    this.GroupedBiometricsByVitalsName = groupedOutputsByVitalsName;
    this.UpdateColumns();
  }

  GroupPatientOutputs(patientOutputs: GetOutput_DTO[]): void {
    const groupedOutputsByOutputType = patientOutputs.reduce((acc, obj) => {
      const key = obj.OutputType;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
    this.GroupedOutputsByOutputType = groupedOutputsByOutputType;
    this.UpdateColumnsForOutput();
  }

  GetColSpan(column: string, columns: string[]): number {
    const dateToCompare = column.split('T')[0]; // Extracting only the date part
    let count = 0;
    for (const col of columns) {
      if (col.split('T')[0] === dateToCompare) { // Comparing only the date part
        count++;
      }
    }
    return count;
  }

  GetUniqueColumns(): string[] {
    const columns = new Set<string>();
    for (const key in this.GroupedBiometricsByVitalsName) {
      this.GroupedBiometricsByVitalsName[key].forEach((item: GetClnVitalsTXN_DTO) => {
        // Extract only the date part
        const date = new Date(item.CreatedOn).toISOString().split('T')[0];
        columns.add(date);
      });
    }
    return Array.from(columns).sort(); // Sorting columns by date
  }

  GetColumns(): string[] {
    const columns = new Set<string>();
    for (const key in this.GroupedBiometricsByVitalsName) {
      this.GroupedBiometricsByVitalsName[key].forEach((item: GetClnVitalsTXN_DTO) => {
        columns.add(item.CreatedOn);
      });
    }
    console.log(Array.from(columns).sort());
    return Array.from(columns).sort(); // Sorting columns by date
  }

  UpdateColumns(): void {
    const uniqueColumnsSet = new Set<string>();
    const allColumnsSet = new Set<string>();
    for (const key in this.GroupedBiometricsByVitalsName) {
      this.GroupedBiometricsByVitalsName[key].forEach((item: GetClnVitalsTXN_DTO) => {
        const date = new Date(item.CreatedOn).toISOString().split('T')[0];
        uniqueColumnsSet.add(date);
        allColumnsSet.add(item.CreatedOn);
      });
    }
    this.UniqueDateSet = Array.from(uniqueColumnsSet).sort();
    this.AllDateTimeSet = Array.from(allColumnsSet).sort();
  }

  UpdateColumnsForOutput(): void {
    const uniqueColumnsSet = new Set<string>();
    const allColumnsSet = new Set<string>();
    for (const key in this.GroupedOutputsByOutputType) {
      this.GroupedOutputsByOutputType[key].forEach((item: GetOutput_DTO) => {
        const date = new Date(item.CreatedOn);
        const roundedDateTime = moment(date).format('YYYY-MM-DD HH:mm');
        uniqueColumnsSet.add(date.toISOString().split('T')[0]);;
        allColumnsSet.add(roundedDateTime);// Store only "YYYY-MM-DD HH:mm"
      });
    }
    this.UniqueDateSetForOutput = Array.from(uniqueColumnsSet).sort();
    this.AllDateTimeSetForOutput = Array.from(allColumnsSet).sort();
  }

  GetVitalsNames(): string[] {
    const vitalsNamesWithUnits: string[] = [];
    if (this.GroupedBiometricsByVitalsName) {
      for (const key in this.GroupedBiometricsByVitalsName) {
        if (this.GroupedBiometricsByVitalsName[key].length > 0) {
          // Get the first item in the group to extract the unit
          const firstItem = this.GroupedBiometricsByVitalsName[key][0];
          const nameWithUnit = `${firstItem.VitalsName} (${firstItem.Unit})`;
          vitalsNamesWithUnits.push(nameWithUnit);
        }
      }
    }
    return vitalsNamesWithUnits;
  }
  GetOutputTypes(): { baseType: string; displayName: string }[] {
    const outputTypes: { baseType: string; displayName: string }[] = [];
    if (this.GroupedOutputsByOutputType) {
      for (const key in this.GroupedOutputsByOutputType) {
        if (this.GroupedOutputsByOutputType[key].length > 0) {
          // Get the first item in the group to extract the unit
          const firstItem = this.GroupedOutputsByOutputType[key][0];
          const displayName = `${key} (${firstItem.Unit})`;
          outputTypes.push({ baseType: key, displayName });
        }
      }
    }
    return outputTypes;
  }
  GetVitalsValues(vitalName: string, date: string): any {
    vitalName = vitalName.split(' ')[0]; // Extract the vital name
    const vital = this.GroupedBiometricsByVitalsName[vitalName].find(vital => vital.CreatedOn === date);
    return vital ? vital.VitalsValue : '-';
  }

  GetOutputValuesForOutput(outputType: string, date: string): any {
    const outputGroup = this.GroupedOutputsByOutputType[outputType];

    if (!outputGroup) {
      return '-';
    }
    const output = outputGroup.find(output => {
      const recordDate = new Date(output.CreatedOn);
      const roundedRecordDate = moment(recordDate).format('YYYY-MM-DD HH:mm');
      return roundedRecordDate === date;
    });
    return output ? output.OutputValue : '-';
  }
  ConvertVitalsDataToArray(data: any): any[] {
    const vitalsArray: any[] = [];
    for (const [timestamp, vitalsGroup] of Object.entries(data)) {
      const transformedData: any = { CreatedOn: timestamp };
      for (const [vitalName, vitalDetails] of Object.entries(vitalsGroup)) {
        transformedData[vitalName] = vitalDetails[0].VitalsValue;
      }
      vitalsArray.push(transformedData);
    }
    return vitalsArray;
  }

  async GetMSTVitals(): Promise<void> {
    try {
      const res: DanpheHTTPResponse = await this._clinicalBLService.GetMSTVitals().toPromise();
      if (res.Status === ENUM_DanpheHTTPResponses.OK) {
        if (res.Results && res.Results.length > 0) {
          this.AllMSTVitals = res.Results;
        }
        else {
          this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`MST Vitals is empty.`]);
        }
      }
      else {
        this._messageBoxService.showMessage(ENUM_MessageBox_Status.Failed, [`Failed: ${res.ErrorMessage}`]);
      }
    }
    catch (err) {
      throw new Error(err);
    }
  }

  InitializeVitalsLabelAndInputField(): void {
    this.FilteredMSTVitals = this.AllMSTVitals.filter(f => f.InputType === ENUM_ClinicalField_InputType.Number && f.VitalsType === ENUM_VitalsType.Vitals).sort((a, b) => a.DisplayOrder - b.DisplayOrder);
  }

  CreateDynamicTPRChart(): void {
    this.yAxesConfig = [];
    this.Datasets = [];
    this._chartService.CreateDatasetsAndYAxisConfig(this.VitalsDataArray, this.Datasets, this.yAxesConfig);

    let ctx = document.getElementById("canvas") as HTMLCanvasElement;
    let chart = new Chart(ctx, {
      // interactivityEnabled: false,
      // showTooltips: false,
      type: "line",
      data: {
        labels: this.VitalsDataArray.CreatedOn,
        datasets: this.Datasets
      },
      options: {
        // events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
        events: ['mouseout', 'click', 'touchstart', 'touchmove'],
        animation: {
          duration: 500,
          easing: 'linear',
        },
        legend: {
          onClick: (e, legendItem) => {
            const index = legendItem.datasetIndex;
            if (index !== undefined && chart && chart.data && chart.data.datasets) {
              const dataset = chart.data.datasets[index];
              if (dataset) {
                dataset.hidden = !dataset.hidden;
                chart.update();

                // Call the method to update y-axes visibility
                this.UpdateYAxisVisibility(chart);
              }
            }
          },
        },

        // tooltips: {
        // mode: 'index',
        //   intersect: false,
        // position: 'nearest',
        // // mode: 'dataset',
        // },
        tooltips: {
          enabled: true,
          mode: 'index',
        },
        // hover: {
        // mode: null
        // },
        scales: {
          xAxes: [{
            type: "time",
            time: {
              unit: 'hour',
              stepSize: 4,
              tooltipFormat: 'MMM D h:mm A',
              displayFormats: {
                hour: 'MMM D hA',
              },
              // min: new Date(this.VitalsDataArray.CreatedOn[0]).setHours(2, 0, 0, 0),
              // max: new Date(this.VitalsDataArray.CreatedOn[this.VitalsDataArray.CreatedOn.length - 1]).setHours(22, 0, 0, 0)
            },
            offset: true,
            scaleLabel: {
              display: true,
              labelString: 'Time',
            },
            ticks: {
              fontColor: '#000000',
              min: new Date(this.VitalsDataArray.CreatedOn[0]).setHours(2, 0, 0, 0),
              max: new Date(this.VitalsDataArray.CreatedOn[this.VitalsDataArray.CreatedOn.length - 1]).setHours(22, 0, 0, 0),
            },
            gridLines: {
              display: true,
              drawOnChartArea: true,
              color: '#cfcfcf'
            }
          }],
          yAxes: this.yAxesConfig
        },
        elements: {
          line: {
            tension: 0
          }
        }
      },
    });
  }

  PrintTPRGraph(): void {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    const headerAndPatientDetail = this.headerAndPatientDetail.nativeElement.innerHTML;
    const biometricsAndOutput = this.biometricsAndOutput.nativeElement.innerHTML;
    const image = canvas.toDataURL('image/png', 1);

    // Create an iframe for printing
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    // Reference to the iframe's document
    const doc = iframe.contentWindow.document;

    // Get the current page's CSS
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    // Create the content to print
    const printContent = `
    <html>
    <head>
    <title>Print TPR Graph</title>
    <link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/ClinicalNewPrintStyle.css"/>
    <link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>
    <style>
      @media print {
          .border {
                   border: 1px solid lightgray;
                   }
          .row {
                 display: flex;
                 flex-wrap: wrap;
               }
          .col {
                flex: 1;
                padding: 0 15px;
                box-sizing: border-box;
                font-size: 12px;
               }
            }
           th,td{
              font-size: 11px;
           }
      }

    </style>
    </head>
    <body onload="window.print()">
        <div>${headerAndPatientDetail}</div>
        <img id="printImage" src="${image}" style="margin: 0px 15px;"/>
        <div>${biometricsAndOutput}</div>
    </body>
    </html>
    `;

    // Write content to the iframe's document
    doc.open();
    doc.write(printContent);
    doc.close();

    // Ensure the image is loaded before printing
    doc.getElementById('printImage').onload = function () {
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);
    };


    // Error handling
    doc.getElementById('printImage').onerror = function () {
      console.error('Error loading image');
      document.body.removeChild(iframe);
    };
  }

  UpdateYAxisVisibility(chart: Chart): void {
    if (chart && chart.data && chart.data.datasets) {
      const datasets = chart.data.datasets;

      // Create a set of yAxisIDs from visible datasets
      const visibleYAxisIDs = new Set(
        datasets
          .filter(dataset => !dataset.hidden)
          .map(dataset => dataset.yAxisID)
      );

      // Ensure `scales` and `yAxes` are defined before accessing
      const scales = chart.options.scales;
      if (scales && scales.yAxes) {
        scales.yAxes.forEach(yAxis => {
          if (yAxis) {
            yAxis.display = visibleYAxisIDs.has(yAxis.id);
          }
        });
      }

      // Update the chart with new options
      chart.update();
    }
  }
  GetColSpanForOutput(date: string, allDateTimes: string[]): number {
    return allDateTimes.filter(dateTime => dateTime.startsWith(date)).length || 1;
  }

}
