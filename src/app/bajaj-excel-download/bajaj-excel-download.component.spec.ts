import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { BajajExcelDownloadComponent } from './bajaj-excel-download.component';
import { CoreService } from '../utilities/core.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { By } from '@angular/platform-browser';

describe('BajajExcelDownloadComponent', () => {
  let component: BajajExcelDownloadComponent;
  let fixture: ComponentFixture<BajajExcelDownloadComponent>;
  let coreService: jest.Mocked<CoreService>;
  let featureToggleService: jest.Mocked<FeatureToggleService>;

  beforeEach(async () => {
    coreService = {
      toast: jest.fn(),
    } as any;

    featureToggleService = {
      getConfig: jest.fn().mockReturnValue({ BASEDATAURI: 'mock-uri/' }),
    } as any;

    await TestBed.configureTestingModule({
      declarations: [BajajExcelDownloadComponent],
      imports: [FormsModule],
      providers: [
        { provide: CoreService, useValue: coreService },
        { provide: FeatureToggleService, useValue: featureToggleService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BajajExcelDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('downloadExcel', () => {
    it('should show toast if no survey selected', () => {
      component.surveyFile = '';
      component.downloadExcel(null);

      expect(coreService.toast).toHaveBeenCalledWith('warn', 'Please select survey');
    });

    it('should set href and click anchor if survey selected', () => {
      component.surveyFile = 'survey1.xlsx';
      const anchor = { href: '', click: jest.fn() } as any;

      component.downloadExcel(anchor);

      expect(anchor.href).toBe('mock-uri/survey1.xlsx');
      expect(anchor.click).toHaveBeenCalled();
      expect(coreService.toast).not.toHaveBeenCalled();
    });

    it('should not do anything if anchor is falsy', () => {
      component.surveyFile = 'survey1.xlsx';
      component.downloadExcel(null);

      expect(coreService.toast).not.toHaveBeenCalled();
    });
  });
});