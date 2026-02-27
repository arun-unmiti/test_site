import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ModuleGuard } from './module.guard';
import { FeatureToggleService } from '../shared/services/feature-toggle.service';

describe('ModuleGuard', () => {
  let guard: ModuleGuard;
  let featureToggleService: jest.Mocked<FeatureToggleService>;
  let router: jest.Mocked<Router>;

  const mockRoute = (moduleName?: string): ActivatedRouteSnapshot =>
    ({
      data: { module: moduleName }
    } as unknown as ActivatedRouteSnapshot);

  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    featureToggleService = {
      isModuleEnabled: jest.fn()
    } as any;

    router = {
      createUrlTree: jest.fn()
    } as any;

    TestBed.configureTestingModule({
      providers: [
        ModuleGuard,
        { provide: FeatureToggleService, useValue: featureToggleService },
        { provide: Router, useValue: router }
      ]
    });

    guard = TestBed.inject(ModuleGuard);
  });

  it('should allow activation when module is enabled', () => {
    featureToggleService.isModuleEnabled.mockReturnValue(true);

    const result = guard.canActivate(mockRoute('orders'), mockState);

    expect(result).toBe(true);
    expect(featureToggleService.isModuleEnabled).toHaveBeenCalledWith('orders');
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('should redirect to /home when module is disabled', () => {
    const urlTree = {} as UrlTree;
    featureToggleService.isModuleEnabled.mockReturnValue(false);
    router.createUrlTree.mockReturnValue(urlTree);

    const result = guard.canActivate(mockRoute('orders'), mockState);

    expect(result).toBe(urlTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/home']);
  });

  it('should allow activation when no module data is provided', () => {
    const result = guard.canActivate(mockRoute(), mockState);

    expect(result).toBe(true);
    expect(featureToggleService.isModuleEnabled).not.toHaveBeenCalled();
  });

  it('should call canActivate from canActivateChild', () => {
    const spy = jest.spyOn(guard, 'canActivate');
    featureToggleService.isModuleEnabled.mockReturnValue(true);

    guard.canActivateChild(mockRoute('orders'), mockState);

    expect(spy).toHaveBeenCalled();
  });
});