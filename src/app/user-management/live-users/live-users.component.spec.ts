import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { LiveUsersComponent } from './live-users.component';
import { UserDetailService } from 'src/app/auth/user-detail.service';

// Mock Services
class MockUserDetailService {
  getUserDetail = jest.fn(() => ({ user_role: '1', name: 'Test User' }));
}

describe('LiveUsersComponent', () => {
  let component: LiveUsersComponent;
  let fixture: ComponentFixture<LiveUsersComponent>;
  let userService: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LiveUsersComponent],
      providers: [
        { provide: UserDetailService, useClass: MockUserDetailService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LiveUsersComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserDetailService);
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set user from service', () => {
      component.ngOnInit();
      expect(component.user).toEqual({ user_role: '1', name: 'Test User' });
      expect(userService.getUserDetail).toHaveBeenCalled();
    });
  });
});