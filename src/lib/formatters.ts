
/**
 * Formats a number as a currency string.
 * 
 * @param amount The number to format
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Formats a date as a string.
 * 
 * @param date The date to format
 * @param options Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
};

/**
 * Formats a number as a percentage.
 * 
 * @param value The value to format as a percentage
 * @param decimalPlaces The number of decimal places to include
 * @returns Formatted percentage string
 */
export const formatPercent = (
  value: number,
  decimalPlaces = 1
): string => {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
};

/**
 * Formats a number with commas.
 * 
 * @param value The value to format
 * @returns Formatted number string with commas
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Truncates text to a specified length and adds ellipsis.
 * 
 * @param text The text to truncate
 * @param maxLength The maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number
): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
