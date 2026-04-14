import { ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MessageboxService } from '../../../shared/messagebox/messagebox.service';
import { UploadedFile_DTO } from '../dto/uploaded-file.dto';

@Component({
  selector: 'document-upload',
  templateUrl: './document-upload.component.html',
  styleUrls: ['./document-upload.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentUploadComponent implements OnInit {

  constructor(
    private _messageBoxService: MessageboxService
  ) {

  }

  ngOnInit(): void { }

  @Output() fileUploaded = new EventEmitter<UploadedFile_DTO>();

  HandleFileInput(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (): void => {
        const tempFile: string = reader.result.toString();
        const index: number = tempFile.indexOf(',');
        const binaryString: string = tempFile.substring(index + 1);
        const result = {
          FileName: file.name,
          Type: file.type,
          Size: file.size,
          BinaryData: binaryString
        };
        this.fileUploaded.emit(result);
      };
      reader.readAsDataURL(file);
    }
  }
}
