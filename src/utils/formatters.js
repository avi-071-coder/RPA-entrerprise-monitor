// formatters.js — Feature 2: Value Formatting & Sanitization Utilities
// all functions are pure, side-effect-free, and handle all edge cases without throwing.

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// format a numeric value as USD currency.
// clamps to minimum 0 before formatting.
// returns '$0.00' for null/undefined/NaN.
export function formatCurrency(value, locale = 'en-US', currency = 'USD') {
  const num = Number(value);
  if (value == null || isNaN(num)) return '$0';
  const clamped = Math.max(0, num);
  if (locale === 'en-US' && currency === 'USD') {
    return currencyFormatter.format(clamped);
  }
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(clamped);
}

// format a numeric value as a locale-formatted integer string.
// returns '0' for null/undefined/NaN.
export function formatInteger(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return '0';
  return Math.floor(num).toLocaleString('en-US');
}

// format a numeric value as a percentage string with 2 decimal places.
// allows negative values for alert detection.
// returns '0.00%' for null/undefined/NaN.
export function formatPercent(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return '0.00%';
  return num.toFixed(2) + '%';
}

// format ROI value — same as formatPercent but returns raw number clamped to 2 decimal places.
// used directly in grid cells.
export function formatROI(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return '0.00';
  return num.toFixed(2);
}

// sanitize ROI percent value for store use.
// returns parseFloat(Number(value).toFixed(2)) or 0.00 if invalid.
export function sanitizeRoiPercent(value) {
  const num = Number(value);
  if (value == null || isNaN(num)) return 0.00;
  return parseFloat(num.toFixed(2));
}

// determine if a row should trigger an alert flash.
// returns true if project_status is 'Failed' OR roi_percent < 0.
export function isAlertRow(row) {
  if (!row) return false;
  return row.project_status === 'Failed' || row.roi_percent < 0;
}
