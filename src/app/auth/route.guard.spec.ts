import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RouteGuard } from './route.guard';
import { UserDetailService } from './user-detail.service';

describe('RouteGuard', () => {
  let guard: RouteGuard;
  let userDetailService: jest.Mocked<UserDetailService>;
  let router: jest.Mocked<Router>;

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
        RouteGuard,
        { provide: UserDetailService, useValue: userDetailService },
        { provide: Router, useValue: router },
      ],
    });

    guard = TestBed.inject(RouteGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow activation for public routes', () => {
    const publicUrls = ['/forgot-password', '/privacy_policy'];

    for (const url of publicUrls) {
      const result = guard.canActivate(mockRoute(), mockState(url));
      expect(result).toBe(true);
    }

    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should allow activation for /login if not authenticated', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const result = guard.canActivate(mockRoute(), mockState('/login'));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login if no user on private route', () => {
    userDetailService.getUserDetail.mockReturnValue(null);

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute(), mockState('/some-route'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/some-route' },
    });
  });

  it('should redirect to home if on login and authenticated', () => {
    userDetailService.getUserDetail.mockReturnValue({ user_id: 1 });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute(), mockState('/login'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/']);
  });

  it('should allow activation if authenticated and not on public route', () => {
    userDetailService.getUserDetail.mockReturnValue({ user_id: 1 });

    const result = guard.canActivate(mockRoute(), mockState('/some-route'));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to login on error', () => {
    userDetailService.getUserDetail.mockImplementation(() => {
      throw new Error('Test error');
    });

    const urlTree = {} as UrlTree;
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute(), mockState('/some-route'));

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should prevent navigation if already navigating', () => {
    // Simulate isNavigating = true
    (guard as any).isNavigating = true;

    const result = guard.canActivate(mockRoute(), mockState('/some-route'));

    expect(result).toBe(false);
  });
});