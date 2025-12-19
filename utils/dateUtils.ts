export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekDays = (startDate: Date): Date[] => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
};

export const formatDateKey = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return formatDateKey(d1) === formatDateKey(d2);
};

export const formatDuration = (hours: number): string => {
  if (hours === 0 || hours === undefined || hours === null) return '0:00';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

export const parseDuration = (input: string): number => {
  if (!input) return 0;
  // Handle 1:30 format
  if (input.includes(':')) {
    const [h, m] = input.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  }
  // Handle decimal format
  return parseFloat(input) || 0;
};

export const getDayName = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
};

export const getDayNumberAndMonth = (date: Date): string => {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};