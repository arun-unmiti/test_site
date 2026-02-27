import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ProposalManagementComponent } from './proposal-management.component';
import { UserDetailService } from '../auth/user-detail.service';

// ✅ Mock Services
const mockUserDetailService = {
  getUserDetail: jest.fn(() => ({ user_role: '1' })),
};

describe('ProposalManagementComponent', () => {
  let component: ProposalManagementComponent;
  let fixture;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
      ],
      declarations: [ProposalManagementComponent],
      providers: [
        { provide: UserDetailService, useValue: mockUserDetailService },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProposalManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});