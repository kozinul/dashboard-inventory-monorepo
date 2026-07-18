/**
 * Format a number to proper Indonesian Rupiah (IDR) currency string
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export const formatIDR = (value: number | string): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return 'Rp 0';

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numValue);
};

/**
 * Format a number with thousand separators (no currency symbol)
 * e.g. 1500000 -> "1.500.000"
 */
export const formatNumber = (value: number | string): string => {
    const numValue = Number(value);
    if (isNaN(numValue)) return '0';

    return new Intl.NumberFormat('id-ID').format(numValue);
};
