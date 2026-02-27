import { SearchPipe } from './search.pipe';

describe('SearchPipe', () => {
  let pipe: SearchPipe;

  beforeEach(() => {
    pipe = new SearchPipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    const mockData = [
      { name: 'Alice', age: 25, city: 'New York' },
      { name: 'Bob', age: 30, city: 'San Francisco' },
      { name: 'Charlie', age: 35, city: 'New York' },
      { name: 'David', age: 40, city: 'Los Angeles' },
    ];

    it('should return original array if no term is provided (undefined)', () => {
      const result = pipe.transform(mockData, 'name,age,city', undefined);
      expect(result).toEqual(mockData);
    });

    it('should return original array if term is empty string', () => {
      const result = pipe.transform(mockData, 'name,age,city', '');
      expect(result).toEqual(mockData);
    });

    it('should return original array if term is null', () => {
      const result = pipe.transform(mockData, 'name,age,city', null as any);
      expect(result).toEqual(mockData);
    });

    it('should filter by single key case-insensitively', () => {
      const result = pipe.transform(mockData, 'name', 'al');
      expect(result).toEqual([
        { name: 'Alice', age: 25, city: 'New York' },
      ]);
    });

    it('should filter by multiple keys', () => {
      const result = pipe.transform(mockData, 'name,city', 'new');
      expect(result).toEqual([
        { name: 'Alice', age: 25, city: 'New York' },
        { name: 'Charlie', age: 35, city: 'New York' },
      ]);
    });

    it('should return empty array if no matches', () => {
      const result = pipe.transform(mockData, 'name', 'nonexistent');
      expect(result).toEqual([]);
    });

    it('should handle non-string values in keys (e.g., numbers)', () => {
      const result = pipe.transform(mockData, 'age', '3');
      expect(result).toEqual([
        { name: 'Bob', age: 30, city: 'San Francisco' },
        { name: 'Charlie', age: 35, city: 'New York' },
      ]);
    });

    it('should skip keys that do not exist on item', () => {
      const result = pipe.transform(mockData, 'name,nonexistent', 'bob');
      expect(result).toEqual([
        { name: 'Bob', age: 30, city: 'San Francisco' },
      ]);
    });

    it('should return empty array if keys is empty', () => {
      const result = pipe.transform(mockData, '', 'test');
      expect(result).toEqual([]);
    });

    it('should return empty array if input value is undefined', () => {
      const result = pipe.transform(undefined, 'name', 'test');
      expect(result).toEqual([]);
    });

    it('should return empty array if input value is null', () => {
      const result = pipe.transform(null, 'name', 'test');
      expect(result).toEqual([]);
    });
  });
});