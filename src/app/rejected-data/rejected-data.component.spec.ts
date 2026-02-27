import { ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { RejectedDataComponent } from './rejected-data.component';
import { CoreService } from '../utilities/core.service';
import { InsightsService } from '../utilities/insights.service';

// ✅ Mock Services
class MockCoreService {
  post = jest.fn().mockResolvedValue({ status: 1, surveys: [{ id: 1, title: 'Test Survey' }] });
}

const mockInsightsService = {
  logException: jest.fn(),
};

describe('RejectedDataComponent', () => {
  let component: RejectedDataComponent;
  let fixture: ComponentFixture<RejectedDataComponent>;
  let coreService: any;
  let insightsService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        NgbModule,
      ],
      declarations: [RejectedDataComponent],
      providers: [
        { provide: CoreService, useClass: MockCoreService },
        { provide: InsightsService, useValue: mockInsightsService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(RejectedDataComponent);
    component = fixture.componentInstance;
    coreService = TestBed.inject(CoreService);
    insightsService = TestBed.inject(InsightsService);
    mockInsightsService.logException.mockReset();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call getSurveryData', () => {
      const getSurveryDataSpy = jest.spyOn(component, 'getSurveryData');
      component.ngOnInit();
      expect(getSurveryDataSpy).toHaveBeenCalled();
    });
  });
});