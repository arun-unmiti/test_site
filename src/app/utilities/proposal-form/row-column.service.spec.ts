import { TestBed } from '@angular/core/testing';
import { RowColumnService } from './row-column.service';
import { CoreService } from '../core.service';

class MockCoreService {
  clone = jest.fn(obj => JSON.parse(JSON.stringify(obj)));
}

describe('RowColumnService', () => {
  let service: RowColumnService;
  let coreService: MockCoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RowColumnService,
        { provide: CoreService, useClass: MockCoreService },
      ],
    });

    service = TestBed.inject(RowColumnService);
    coreService = TestBed.inject(CoreService) as any;
  });

  it('should create the component', () => {
    expect(service).toBeTruthy();
  });

  describe('generateRowData', () => {
    it('should process survey data and generate row data', () => {
      const component: any = {
        loading: 0,
        surveyData: [{ user_id: '1', approved_reject: '1', first_name: 'John', last_name: 'Doe' }],
        currentpage: 1,
        recordsPerPage: 10,
        userPhoneMap: { '1': '1234567890' },
        stateMap: new Map([['1', 'State1']]),
        url_id: 'non-22',
        typeFields: [{ field: 'state', type: 'text' }],
        pagination: { updatePagination: jest.fn() },
      };
      service.generateRowData(component);
      expect(component.tableData[0].sno).toBe(1);
      expect(component.tableData[0].approved_reject).toBe('Approved');
      expect(component.tableData[0].user_phone).toBe('1234567890');
    });
  });

  describe('generateColDef', () => {
    it('should generate column definitions correctly', () => {
      const component: any = { url_id: 'non-22', fields: [{ field_id: 1, display_name: 'Field1', type: 'text' }], canViewData: true, dataPurpose: 'get_data', showApproveColumn: true, parentSurveyId: true };
      service.generateColDef(component);
      expect(component.colDefs[0].field).toBe('sno');
      expect(component.colDefs[1].field).toBe('action');
      expect(component.colDefs.some((col: any) => col.field === 'no_of_visit')).toBe(true);
    });
  });
});