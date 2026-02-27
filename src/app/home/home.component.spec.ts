import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { HomeComponent } from './home.component';
import { UserDetailService } from '../auth/user-detail.service';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';
import { environment, ProjectContext } from '../../environments/environment';

// Mock services
class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ screens: {} }));
}

class MockFeatureToggleService {
  getContext = jest.fn(() => 'saksham' as ProjectContext);
}

// Mock environment
jest.mock('../../environments/environment', () => ({
  environment: {
    projectConfigs: {}
  },
  ProjectContext: 'saksham'
}));

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let userService: any;
  let featureToggle: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomeComponent ],
      imports: [ RouterTestingModule ],
      providers: [
        { provide: UserDetailService, useClass: MockUserDetailService },
        { provide: FeatureToggleService, useClass: MockFeatureToggleService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserDetailService);
    featureToggle = TestBed.inject(FeatureToggleService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('constructor', () => {
    it('should set projectContext from featureToggle', () => {
      featureToggle.getContext.mockReturnValueOnce('munichre');
      const comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.projectContext).toBe('munichre');
    });

    it('should set projectTitle based on projectContext', () => {
      featureToggle.getContext.mockReturnValueOnce('saksham');
      let comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.projectTitle).toBe('Saksham');

      featureToggle.getContext.mockReturnValueOnce('munichre');
      comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.projectTitle).toBe('MR Capture');

      featureToggle.getContext.mockReturnValueOnce('unknown');
      comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.projectTitle).toBe('App');
    });

    it('should set screens from user details, excluding certain keys', () => {
      userService.getUserDetail.mockReturnValueOnce({
        screens: {
          chm: 1,
          added_by: 1,
          status: 1,
          other: 0,
          cls: 1
        }
      });
      const comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.screens).toEqual(['chm', 'cls']);
    });

    it('should set showLinks to true if specific screens are present', () => {
      userService.getUserDetail.mockReturnValueOnce({
        screens: { chm: 1 }
      });
      let comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.showLinks).toBe(true);

      userService.getUserDetail.mockReturnValueOnce({
        screens: { random: 1 }
      });
      comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.showLinks).toBe(false);
    });

    it('should initialize dataLinks correctly', () => {
      const comp = new HomeComponent(userService as any, featureToggle as any);
      expect(comp.dataLinks).toHaveLength(3);
      expect(comp.dataLinks[0].title).toBe('Pending');
      expect(comp.dataLinks[1].title).toBe('Approved');
      expect(comp.dataLinks[2].title).toBe('Rejected');
      expect(comp.dataLinks[0].links).toHaveLength(6);
    });
  });

  describe('ngOnInit', () => {
    it('should be empty', () => {
      expect(component.ngOnInit()).toBeUndefined();
    });
  });
});