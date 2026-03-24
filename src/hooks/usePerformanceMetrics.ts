import { useEffect } from 'react';

export function usePerformanceMetrics(componentName: string) {
    useEffect(() => {
        // Only run in development
        if (process.env.NODE_ENV !== 'development') return;

        // Measure Web Vitals
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('navigation') || entry.name.includes('resource')) {
                    console.log(`[Perf] ${componentName} - ${entry.name}:`, Math.round(entry.duration) + 'ms');
                }
            }
        });

        observer.observe({ entryTypes: ['navigation', 'resource', 'largest-contentful-paint'] });

        return () => observer.disconnect();
    }, [componentName]);

    // Log First Contentful Paint
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return;

        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                console.log(`[Perf] ${componentName} - FCP:`, Math.round(entry.startTime) + 'ms');
            }
        });

        observer.observe({ entryTypes: ['paint'] });

        return () => observer.disconnect();
    }, [componentName]);
}
