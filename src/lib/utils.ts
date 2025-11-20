
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

export function debounce<F extends (...args: any[]) => any>(func: F, timeout = 300): (...args: Parameters<F>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<F>): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      (func as (...a: Parameters<F>) => any)(...args);
    }, timeout);
  };
}
