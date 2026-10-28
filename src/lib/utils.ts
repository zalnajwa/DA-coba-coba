export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function generateTransactionCode(prefix: string): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${dateStr}-${randomStr}`;
}

export function parseRupiahInput(input: string): number {
  const lowerInput = input.toLowerCase().replace(/\s/g, '');
  let multiplier = 1;
  if (lowerInput.endsWith('k') || lowerInput.endsWith('rb')) {
    multiplier = 1000;
  } else if (lowerInput.endsWith('jt')) {
    multiplier = 1000000;
  }
  const numStr = lowerInput.replace(/[a-z]/g, '').replace(/,/g, '.');
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : num * multiplier;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
