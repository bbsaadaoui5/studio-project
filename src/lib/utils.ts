
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupAndCountBy<T>(arr: T[], key: keyof T) {
  return arr.reduce((acc, item) => {
    const group = item[key] as string;
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export function debounce<F extends (...args: any[]) => any>(func: F, timeout = 300) {
  let timer: NodeJS.Timeout;
  return (...args: Parameters<F>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(null, args);
    }, timeout);
  };
}
