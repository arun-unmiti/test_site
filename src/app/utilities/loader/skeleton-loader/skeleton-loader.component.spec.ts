import 'zone.js/bundles/zone-testing-bundle.umd.js';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SkeletonLoaderComponent } from './skeleton-loader.component';

describe('SkeletonLoaderComponent', () => {
  let component: SkeletonLoaderComponent;
  let fixture: ComponentFixture<SkeletonLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SkeletonLoaderComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonLoaderComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set loaders array', () => {
      component.count = 3;
      component.margin = '5px';
      component.ngOnInit();
      expect(component.loaders.length).toBe(3);
      expect(component.loaders[0].margin).toBe('10px 0px');
      expect(component.loaders[1].margin).toBe('5px');
      expect(component.loaders[2].margin).toBe('10px 0px');
    });

    it('should set default count to 1', () => {
      component.ngOnInit();
      expect(component.loaders.length).toBe(1);
    });
  });
});