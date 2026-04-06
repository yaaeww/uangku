/**
 * Formats a number or string into Rupiah format with dots as thousand separators.
 * Example: 1000000 -> "1.000.000"
 */
export const formatRupiah = (value: number | string): string => {
    if (value === undefined || value === null || value === '') return '';
    
    // Remove all non-numeric characters except for the first minus sign if any
    const stringValue = value.toString().replace(/[^0-9-]/g, '');
    if (!stringValue) return '';

    // Handle negative numbers
    const isNegative = stringValue.startsWith('-');
    const absoluteValue = stringValue.replace('-', '');

    // Add dots every 3 digits from the right
    const formatted = absoluteValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    return isNegative ? `-${formatted}` : formatted;
};

/**
 * Parses a Rupiah formatted string back into a numeric value.
 * Example: "1.000.000" -> 1000000
 */
export const parseRupiah = (value: string): number => {
    if (!value) return 0;
    
    // Remove all dots and return as number
    const numericString = value.replace(/\./g, '');
    const parsed = parseInt(numericString, 10);
    
    return isNaN(parsed) ? 0 : parsed;
};
