import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { Folder } from '../../shared/interface/folder-file/folder.interface';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Response } from '../../shared/interface/response.interface';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { IFile } from '../../shared/interface/folder-file/file.interface';
import { SERVER_URL } from '../../environments/environment';
@Component({
  selector: 'app-move-folder-file',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    TableModule,
    CommonModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './move-folder-file.component.html',
  styleUrl: './move-folder-file.component.css',
})
export class MoveFolderFileComponent implements OnChanges {
  @Input() moveItem: any | null = null;
  @Input() currentFolder!: Folder;
  @Output() closeEvent: EventEmitter<any> = new EventEmitter();
  @Output() responseEvent: EventEmitter<any> = new EventEmitter();
  tableData: Folder[] = [];
  tableLoading: boolean = false;

  constructor(private http: HttpClient) {}
  ngOnChanges(changes: SimpleChanges): void {
    this.getData(this.currentFolder._id);
  }

  async getData(folderId: string) {
    const url = `${SERVER_URL}/files/get-folder-file?parentFolderId=${folderId}`;

    try {
      this.tableLoading = true;
      const res: Response = await firstValueFrom(this.http.get<Response>(url));
      if (res?.success) {
        this.currentFolder = res.data.currentFolder;
        this.tableData = res.data.data.filter((item: any) => !item.fileUrl);
      }
      // Call your API to get the list of folders and files in the current folder
    } catch (e) {
      console.error('Error getting data', e);
    } finally {
      this.tableLoading = false;
    }
  }

  BackToParent() {
    if (this.currentFolder?.parentFolderId) {
      this.getData(this.currentFolder.parentFolderId);
    }
  }
  navigateToChildFolder(folderId: string) {
    this.getData(folderId);
  }
  async moveItemFn() {
    try {
      let res: Response;
      if (this.moveItem && 'fileUrl' in this.moveItem) {
        res = await firstValueFrom(
          this.http.put<Response>(`${SERVER_URL}/files/move-file`, {
            fileId: this.moveItem._id,
            destinationFolderId: this.currentFolder._id,
          })
        );
      } else {
        res = await firstValueFrom(
          this.http.put<Response>(`${SERVER_URL}/files/move-folder`, {
            folderId: this.moveItem?._id,
            newParentFolderId: this.currentFolder._id,
          })
        );
      }
      if (res?.success) {
        this.moveItem = null;
        this.responseEvent.emit();
      }
    } catch (error) {
      console.error('Error moving file', error);
    }
  }
  cancelMoveFn() {
    this.closeEvent.emit();
  }
  checkFolder() {
    return this.tableData.some((item) => item._id === this.moveItem?._id);
  }
}
