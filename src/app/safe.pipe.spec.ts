import { DomSanitizer, SafeHtml, SafeStyle, SafeScript, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
  let pipe: SafePipe;
  let sanitizer: jest.Mocked<DomSanitizer>;

  beforeEach(() => {
    sanitizer = {
      bypassSecurityTrustHtml: jest.fn(),
      bypassSecurityTrustStyle: jest.fn(),
      bypassSecurityTrustScript: jest.fn(),
      bypassSecurityTrustUrl: jest.fn(),
      bypassSecurityTrustResourceUrl: jest.fn(),
    } as any;

    pipe = new SafePipe(sanitizer);
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    const mockValue = 'mockValue';

    it('should bypass html', () => {
      const mockSafeHtml = {} as SafeHtml;
      sanitizer.bypassSecurityTrustHtml.mockReturnValue(mockSafeHtml);

      const result = pipe.transform(mockValue, 'html');

      expect(result).toBe(mockSafeHtml);
      expect(sanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(mockValue);
    });

    it('should bypass style', () => {
      const mockSafeStyle = {} as SafeStyle;
      sanitizer.bypassSecurityTrustStyle.mockReturnValue(mockSafeStyle);

      const result = pipe.transform(mockValue, 'style');

      expect(result).toBe(mockSafeStyle);
      expect(sanitizer.bypassSecurityTrustStyle).toHaveBeenCalledWith(mockValue);
    });

    it('should bypass script', () => {
      const mockSafeScript = {} as SafeScript;
      sanitizer.bypassSecurityTrustScript.mockReturnValue(mockSafeScript);

      const result = pipe.transform(mockValue, 'script');

      expect(result).toBe(mockSafeScript);
      expect(sanitizer.bypassSecurityTrustScript).toHaveBeenCalledWith(mockValue);
    });

    it('should bypass url', () => {
      const mockSafeUrl = {} as SafeUrl;
      sanitizer.bypassSecurityTrustUrl.mockReturnValue(mockSafeUrl);

      const result = pipe.transform(mockValue, 'url');

      expect(result).toBe(mockSafeUrl);
      expect(sanitizer.bypassSecurityTrustUrl).toHaveBeenCalledWith(mockValue);
    });

    it('should bypass resourceUrl', () => {
      const mockSafeResourceUrl = {} as SafeResourceUrl;
      sanitizer.bypassSecurityTrustResourceUrl.mockReturnValue(mockSafeResourceUrl);

      const result = pipe.transform(mockValue, 'resourceUrl');

      expect(result).toBe(mockSafeResourceUrl);
      expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(mockValue);
    });

    it('should throw error for invalid type', () => {
      expect(() => pipe.transform(mockValue, 'invalid')).toThrowError('Invalid safe type specified: invalid');
    });
  });
});