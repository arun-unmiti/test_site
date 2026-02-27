import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { UserDetailService } from './user-detail.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let userDetailService: jest.Mocked<UserDetailService>;
  let router: jest.Mocked<Router>;

  const mockRoute = (data: any = {}): ActivatedRouteSnapshot =>
    ({
      data,
    } as unknown as ActivatedRouteSnapshot);

  const mockState = (url: string = '/some-route'): RouterStateSnapshot =>
    ({
      url,
    } as unknown as RouterStateSnapshot);

  beforeEach(() => {
    userDetailService = {
      getUserDetail: jest.fn(),
    } as any;

    router = {
      createUrlTree: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: UserDetailService, useValue: userDetailService },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(RoleGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow activation if user has valid role and details', () => {
    userDetailService.getUserDetail.mockReturnValue({
      user_id: 1,
      user_role: 'admin',
      screens: { screen1: 1 },
      unit_id: 'client1',
    });

    const route = mockRoute({
      authRole: ['admin'],
      authAgencyScreen: 'screen1',
      authClient: ['client1'],
    });

    const result = guard.canActivate(route, mockState());

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login if no user detail or user_id', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute(), mockState('/some-route'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/some-route' },
    });
  });

  it('should allow if already on login and no user', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const result = guard.canActivate(mockRoute(), mockState('/login'));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to home if wrong role', () => {
    userDetailService.getUserDetail.mockReturnValue({
      user_id: 1,
      user_role: 'user',
      screens: {},
      unit_id: 'client1',
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const route = mockRoute({
      authRole: ['admin'],
    });

    const result = guard.canActivate(route, mockState());

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to home if wrong screen', () => {
    userDetailService.getUserDetail.mockReturnValue({
      user_id: 1,
      user_role: 'admin',
      screens: { screen2: 1 },
      unit_id: 'client1',
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const route = mockRoute({
      authRole: ['admin'],
      authAgencyScreen: 'screen1',
    });

    const result = guard.canActivate(route, mockState());

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to home if wrong client', () => {
    userDetailService.getUserDetail.mockReturnValue({
      user_id: 1,
      user_role: 'admin',
      screens: { screen1: 1 },
      unit_id: 'client2',
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const route = mockRoute({
      authRole: ['admin'],
      authClient: ['client1'],
    });

    const result = guard.canActivate(route, mockState());

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should redirect to login on error', () => {
    userDetailService.getUserDetail.mockImplementation(() => {
      throw new Error('Test error');
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute(), mockState());

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});