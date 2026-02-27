import { Injectable, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment, ProjectContext, ProjectConfig } from '../../../environments/environment';
import { UserDetailService } from '../../auth/user-detail.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class FeatureToggleService {
  private featureContext = new BehaviorSubject<ProjectContext>(
    this.isValidContext(localStorage.getItem('featureContext'))
      ? environment.featureContext  // (localStorage.getItem('featureContext') as ProjectContext)
      : environment.featureContext
  );
  featureContext$: Observable<ProjectContext> = this.featureContext.asObservable();
  private userService: UserDetailService | null = null;

  constructor(
    private route: ActivatedRoute,
    private injector: Injector,
    private router: Router,
    private titleService: Title
  ) {
    // Handle query params for context
    this.route.queryParams.subscribe(params => {
      const context = params['context'];
      if (context && this.isValidContext(context)) {
        this.setContext(context);
      }
    });
    // Set favicon and title on initialization
    this.setFaviconAndTitle();
    // Update favicon and title on context change
    this.featureContext$.subscribe(context => {
      this.setFaviconAndTitle();
    });
  }

  initializeUserContext() {
    if (!this.userService) {
      this.userService = this.injector.get(UserDetailService);
    }
    if (!this.userService) {
      return;
    }
    const user = typeof this.userService.getUserDetail === 'function'
      ? this.userService.getUserDetail()
      : { client_id: null };
    if (user?.client_id === 'saksham_client_id') {
      this.setContext('saksham');
    }
    // If no match, stay at default ('munichre')
  }

  private isValidContext(context: string | null): context is ProjectContext {
    return context !== null && ['saksham', 'munichre'].includes(context);
  }

  setContext(context: ProjectContext) {
    if (Object.keys(environment.projectConfigs).includes(context)) {
      this.featureContext.next(context);
      localStorage.setItem('featureContext', context);
      this.setFaviconAndTitle();
    }
  }

  getContext(): ProjectContext {
    return this.featureContext.value;
  }

  isProject(project: ProjectContext): boolean {
    return this.getContext() === project;
  }

  getConfig(): ProjectConfig {
    return environment.projectConfigs[this.getContext()] || environment.projectConfigs['munichre'];
  }

  getAssetPath(): string {
    return this.getConfig().ASSET_PATH;
  }

  isModuleEnabled(module: string): boolean {
    return this.getConfig().enabledModules.includes(module);
  }

  setFaviconAndTitle() {
    const config = this.getConfig();
    const faviconPath = `${config.ASSET_PATH}${config.favicon}?t=${new Date().getTime()}`; // Cache-busting

    // Remove existing favicon links to avoid duplicates
    const existingLinks = document.querySelectorAll("link[rel*='icon']");
    existingLinks.forEach(link => link.remove());

    // Set favicon
    const link: HTMLLinkElement = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = faviconPath;
    document.head.appendChild(link);

    // Set title
    this.titleService.setTitle(config.title);
  }
}