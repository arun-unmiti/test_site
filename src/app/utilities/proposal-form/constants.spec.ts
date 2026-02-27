import { FILE_HEADERS, DATE_RANGES, LOCALE_VALUE, BUTTONS_TYPE } from './constants'; // Adjust the path to your constants file

describe('Constants', () => {
  describe('FILE_HEADERS', () => {
    it('should be defined and have the correct structure', () => {
      expect(FILE_HEADERS).toBeDefined();
      expect(Array.isArray(FILE_HEADERS)).toBe(true);
      expect(FILE_HEADERS.length).toBe(14);
      expect(FILE_HEADERS[0]).toEqual({
        field: 'season',
        header: 'Season',
        requried: true,
        type: 'number',
        is_lkp: true,
      });
      // Add more specific checks if needed
    });
  });

  describe('DATE_RANGES', () => {
    it('should be defined and have the correct keys', () => {
      expect(DATE_RANGES).toBeDefined();
      expect(typeof DATE_RANGES).toBe('object');
      expect(Object.keys(DATE_RANGES)).toEqual([
        'Today',
        'Yesterday',
        'Last 7 Days',
        'Last 30 Days',
        'This Month',
        'Last Month',
        'Last 3 Month',
      ]);
      // Check one value as example
      expect(DATE_RANGES['Today'].length).toBe(2);
    });
  });

  describe('LOCALE_VALUE', () => {
    it('should be defined and have the correct properties', () => {
      expect(LOCALE_VALUE).toBeDefined();
      expect(typeof LOCALE_VALUE).toBe('object');
      expect(LOCALE_VALUE).toEqual({
        format: 'DD/MM/YYYY',
        displayFormat: 'DD-MM-YYYY',
        separator: ' - ',
        cancelLabel: 'Cancel',
        applyLabel: 'Okay',
      });
    });
  });

  describe('BUTTONS_TYPE', () => {
    it('should be defined and have the correct values', () => {
      expect(BUTTONS_TYPE).toBeDefined();
      expect(Array.isArray(BUTTONS_TYPE)).toBe(true);
      expect(BUTTONS_TYPE).toEqual(['file', 'kml', 'viewbutton', 'signature', 'approveBox']);
    });
  });
});