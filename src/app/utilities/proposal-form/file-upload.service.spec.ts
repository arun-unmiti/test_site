import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import * as XLSX from 'xlsx';
import * as moment from 'moment';

import { FileUploadService } from './file-upload.service';
import { CoreService } from '../core.service';

// Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1 });
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
  toast = jest.fn();
}

describe('FileUploadService', () => {
  let service: FileUploadService;
  let coreService: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        FileUploadService,
        { provide: CoreService, useClass: MockCoreService },
      ],
    });

    service = TestBed.inject(FileUploadService);
    coreService = TestBed.inject(CoreService);
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('uploadChunksSequentially', () => {
    it('should upload chunks sequentially', async () => {
      const component = { chunkSize: 2, submitting: 0, uploadedRecords: 0, totalUploadRecords: 3, progress: 0, isUploading: true, invalidFileData: [], fileData: [], ngbModalService: { dismissAll: jest.fn() } };
      const data = [1, 2, 3];
      coreService.post.mockResolvedValueOnce({ status: 1, failedUploads: [] });
      coreService.post.mockResolvedValueOnce({ status: 1, failedUploads: [] });
      const result = await service.uploadChunksSequentially(component, data);
      expect(result).toBe('');
      expect(component.progress).toBe(100);
    });

    it('should handle errors', async () => {
      const component = { chunkSize: 1, submitting: 0, uploadedRecords: 0, totalUploadRecords: 1, progress: 0, isUploading: true, invalidFileData: [], fileData: [], ngbModalService: { dismissAll: jest.fn() } };
      const data = [1];
      coreService.post.mockRejectedValueOnce(new Error('Error'));
      const result = await service.uploadChunksSequentially(component, data);
      expect(result).toBe('Unable to upload Product Verification data');
    });
  });

  describe('chunkArray', () => {
    it('should chunk array', () => {
      const array = [1, 2, 3, 4, 5];
      const size = 2;
      const result = service.chunkArray(array, size);
      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });
});