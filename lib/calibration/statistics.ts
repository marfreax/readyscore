export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function variance(values: number[]): number | null {
  if (values.length < 2) return null;
  const average = mean(values);
  if (average === null) return null;
  return values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1);
}

export function standardDeviation(values: number[]): number | null {
  const value = variance(values);
  return value === null ? null : Math.sqrt(value);
}

export function pearsonCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 3) return null;
  const meanX = mean(x);
  const meanY = mean(y);
  if (meanX === null || meanY === null) return null;

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let i = 0; i < x.length; i += 1) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denominatorX += dx * dx;
    denominatorY += dy * dy;
  }

  const denominator = Math.sqrt(denominatorX * denominatorY);
  return denominator === 0 ? null : numerator / denominator;
}

export function cronbachAlpha(matrix: number[][]): number | null {
  if (matrix.length < 3 || matrix.length === 0 || matrix[0].length < 2) return null;

  const itemCount = matrix[0].length;
  if (matrix.some((row) => row.length !== itemCount)) return null;

  const itemVariances = Array.from({ length: itemCount }, (_, index) =>
    variance(matrix.map((row) => row[index])),
  );

  const totals = matrix.map((row) => row.reduce((sum, value) => sum + value, 0));
  const totalVariance = variance(totals);
  if (totalVariance === null || totalVariance === 0 || itemVariances.some((value) => value === null)) {
    return null;
  }

  const resolvedItemVariances = itemVariances as number[];
  const resolvedTotalVariance = totalVariance as number;
  const sumItemVariance = resolvedItemVariances.reduce((sum, value) => sum + value, 0);
  return (itemCount / (itemCount - 1)) * (1 - sumItemVariance / resolvedTotalVariance);
}
