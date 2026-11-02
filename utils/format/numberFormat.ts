import { formatNumber, type NumericValue } from './number';
export const formatToFixed = (value: NumericValue, decimals = 2) =>
  formatNumber(value, decimals, false);
