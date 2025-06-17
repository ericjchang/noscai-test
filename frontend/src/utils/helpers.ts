export const formatTimeRemaining = (timeRemaining: number): string => {
  if (timeRemaining <= 0) return 'Expired';

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString();
};

export const formatDateTimeLocal = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return '';
    }

    const timezoneOffset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - timezoneOffset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  } catch (error) {
    console.error('Error formatting date for local input:', error);
    return '';
  }
};

export const convertLocalToUTC = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';

  try {
    const localDate = new Date(localDateTimeString);

    if (isNaN(localDate.getTime())) {
      console.error('Invalid local datetime string:', localDateTimeString);
      return '';
    }

    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting local date to UTC:', error);
    return '';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};
