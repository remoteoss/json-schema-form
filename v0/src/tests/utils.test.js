import { convertDiskSizeFromTo } from '@/utils';

describe('convertDiskSizeFromTo()', () => {
  it('should convert bytes to KB', () => {
    const convert = convertDiskSizeFromTo('Bytes', 'KB');
    expect(convert(1024)).toBe(1);
  });
  it('should convert bytes to MB', () => {
    const convert = convertDiskSizeFromTo('Bytes', 'MB');
    expect(convert(1024 * 1024)).toBe(1);
  });

  it('should convert KB to MB', () => {
    const convert = convertDiskSizeFromTo('KB', 'MB');
    expect(convert(1024)).toBe(1);
  });

  it('should convert KB to Bytes', () => {
    const convert = convertDiskSizeFromTo('KB', 'Bytes');
    expect(convert(1)).toBe(1024);
  });

  it('should convert MB to KB', () => {
    const convert = convertDiskSizeFromTo('MB', 'KB');
    expect(convert(1)).toBe(1024);
  });

  it('should convert MB to KB', () => {
    const convert = convertDiskSizeFromTo('MB', 'Bytes');
    expect(convert(1)).toBe(1048576);
  });
});
