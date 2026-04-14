import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'new-print-page',
  template: ''
})
export class DanphePrintNewComponent implements OnInit {

  public printData: any;
  public pageHeight: number;
  constructor() { }
  @Input("print-data")

  public set value(val: any) {
    
      this.printData = val.innerHTML === undefined ? val : val.innerHTML;
  }
  @Input("print-data-header")
  public set printvalue(val: any) {
    this.printData = val;
  }

  @Output("print-sucess")
  printSucess: EventEmitter<string> = new EventEmitter<string>();

  ngOnInit() {
    console.log("app-print-page called");
    this.print();
  }
  // backup
  print() {
    var contents = this.printData;
    var iframe = document.createElement('iframe');
    document.body.appendChild(iframe);
    let documentContent = "<html><head>";
    documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/CommonPrintStyle.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';
    documentContent += '<link rel="stylesheet" type="text/css" href="../../../themes/theme-default/DanpheStyle.css" />';
    documentContent += '</head>';
    documentContent += '<body onload="window.print()">' + contents + '</body></html>'
    var htmlToPrint = '' + '<style type="text/css">' + '.table_data {' + 'border-spacing:0px' + '}' + '</style>';
    htmlToPrint += documentContent;
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(htmlToPrint);
    iframe.contentWindow.document.close();

    setTimeout(function () {
      document.body.removeChild(iframe);
    }, 500);

    this.printSucess.emit();
  }
  // Assuming you're inside a class with this method to handle printing
  // print() {


  //   let contents = this.printData; // The content to be printed
  //   let iframe = document.createElement('iframe'); // Create a new iframe
  //   document.body.appendChild(iframe); // Add the iframe to the DOM

  //   // Start building the HTML content for the iframe
  //   let documentContent = "<html><head>";

  //   // Add any necessary CSS links
  //   documentContent += '<link rel="stylesheet" type="text/css" media="print" href="../../../themes/theme-default/CommonPrintStyle.css"/>';
  //   documentContent += '<link rel="stylesheet" type="text/css" href="../../../../assets/global/plugins/bootstrap/css/bootstrap.min.css"/>';

  //   // Add a script tag with custom JavaScript
  //   documentContent += '<script type="text/javascript">';
  //   //documentContent += scriptContent;
  //   // documentContent += 'console.log("Print iframe is being prepared.");'; // Simple console log
  //   // documentContent += 'document.addEventListener("DOMContentLoaded", function() {';
  //   // documentContent += '  console.log("Iframe content is loaded.");'; // Another console log on load
  //   // documentContent += '  document.body.style.backgroundColor = "lightgray";'; // Example DOM manipulation
  //   // documentContent += '});';
  //   documentContent += '</script>';

  //   documentContent += '</head>'; // Closing head section

  //   // Body with onload print trigger
  //   documentContent += '<body onload="window.print()">' + contents + '</body></html>'; // Content to print

  //   // Additional style (example with a table style)
  //   const htmlToPrint = '<style type="text/css">.table_data { border-spacing: 0px; }</style>';
  //   const fullHtml = htmlToPrint + documentContent;

  //   // Write and close the iframe document
  //   iframe.contentWindow.document.open();
  //   iframe.contentWindow.document.write(fullHtml);
  //   iframe.contentWindow.document.close();

  //   // Remove the iframe after a delay (example uses 500 ms)
  //   setTimeout(function () {
  //     document.body.removeChild(iframe);
  //   }, 500);

  //   // Emit a success event after printing
  //   this.printSucess.emit();
  // }

}
