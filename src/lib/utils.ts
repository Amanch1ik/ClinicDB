export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-blue-500',
    preparing: 'bg-orange-500',
    ready: 'bg-green-500',
    picked_up: 'bg-blue-600',
    delivering: 'bg-blue-700',
    delivered: 'bg-green-600',
    cancelled: 'bg-red-500'
  };
  return colors[status] || 'bg-gray-500';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    picked_up: 'Picked Up',
    delivering: 'Delivering',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  };
  return labels[status] || status;
}

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash: 'Cash',
    mbank: 'MBank',
    optima: 'Optima Bank',
    bakai: 'Bakai Bank',
    demir: 'Demir Bank',
    balance: 'Balance'
  };
  return labels[method] || method;
}
