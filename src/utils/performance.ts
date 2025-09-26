import React from "react";

// Performance monitoring utilities
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasure(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasure(name: string): number {
    const startTime = this.measurements.get(name);
    if (!startTime) {
      console.warn(`No start time found for measurement: ${name}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    this.measurements.delete(name);

    // Log slow operations in development
    if (import.meta.env.DEV && duration > 100) {
      console.warn(
        `Slow operation detected: ${name} took ${duration.toFixed(2)}ms`
      );
    }

    return duration;
  }

  static measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return fn().finally(() => {
      this.endMeasure(name);
    });
  }

  static measureSync<T>(name: string, fn: () => T): T {
    this.startMeasure(name);
    try {
      return fn();
    } finally {
      this.endMeasure(name);
    }
  }
}

// React hook for component render performance
export function useRenderPerformance(componentName: string) {
  if (import.meta.env.DEV) {
    const renderStartTime = performance.now();

    React.useEffect(() => {
      const renderEndTime = performance.now();
      const renderDuration = renderEndTime - renderStartTime;

      if (renderDuration > 16) {
        // Longer than 16ms (60fps)
        console.warn(
          `Slow render: ${componentName} took ${renderDuration.toFixed(2)}ms`
        );
      }
    });
  }
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Image optimization utility
export function optimizeImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality = 80
): string {
  if (!url) return url;

  // For external CDN URLs, add optimization parameters
  if (url.includes("pexels.com") || url.includes("unsplash.com")) {
    const params = new URLSearchParams();
    if (width) params.set("w", width.toString());
    if (height) params.set("h", height.toString());
    params.set("q", quality.toString());
    params.set("auto", "compress");

    return `${url}?${params.toString()}`;
  }

  return url;
}

// Memory usage monitoring (development only)
export function logMemoryUsage(label = "") {
  if (import.meta.env.DEV && "memory" in performance) {
    const memory = (performance as any).memory;
    console.log(`Memory Usage ${label}:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    });
  }
}
