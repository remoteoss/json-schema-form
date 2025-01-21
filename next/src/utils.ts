type DiskSizeUnit = 'Bytes' | 'KB' | 'MB';

export function convertDiskSizeFromTo(
  from: DiskSizeUnit,
  to: DiskSizeUnit
): (value: number) => number {
  const multipliers: Record<DiskSizeUnit, number> = {
    Bytes: 1,
    KB: 1024,
    MB: 1024 * 1024,
  };

  return (value: number): number => {
    const fromMultiplier = multipliers[from];
    const toMultiplier = multipliers[to];
    return (value * fromMultiplier) / toMultiplier;
  };
}
