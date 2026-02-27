import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouteChildGuard } from './route-child.guard';
import { UserDetailService } from './user-detail.service';

describe('RouteChildGuard', () => {
  let guard: RouteChildGuard;
  let userDetailService: jest.Mocked<UserDetailService>;
  let router: jest.Mocked<Router>;

  // Matches public routes in RouteChildGuard
  const PUBLIC_ROUTES = ['/forgot-password', '/privacy_policy'];

  const mockRoute = (): ActivatedRouteSnapshot =>
    ({} as unknown as ActivatedRouteSnapshot);

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
        RouteChildGuard,
        { provide: UserDetailService, useValue: userDetailService },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(RouteChildGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the component', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow activation for public routes', () => {
    for (const url of PUBLIC_ROUTES) {
      const result = guard.canActivateChild(mockRoute(), mockState(url));
      expect(result).toBe(true);
    }

    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should allow activation for /login if not authenticated', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const result = guard.canActivateChild(mockRoute(), mockState('/login'));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login if no user on private route', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivateChild(mockRoute(), mockState('/some-route'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/some-route' },
    });
  });

  it('should redirect to home if on login and authenticated', () => {
    userDetailService.getUserDetail.mockReturnValue({ user_id: 1 });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivateChild(mockRoute(), mockState('/login'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should allow activation if authenticated and not on public route', () => {
    userDetailService.getUserDetail.mockReturnValue({ user_id: 1 });

    const result = guard.canActivateChild(mockRoute(), mockState('/some-route'));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login on error', () => {
    userDetailService.getUserDetail.mockImplementation(() => {
      throw new Error('Test error');
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivateChild(mockRoute(), mockState('/some-route'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should prevent navigation if already navigating', () => {
    // Simulate isNavigating = true
    (guard as any).isNavigating = true;

    const result = guard.canActivateChild(mockRoute(), mockState('/some-route'));

    expect(result).toBe(false);
  });
});