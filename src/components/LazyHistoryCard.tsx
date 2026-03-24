"use client";

import { useRef, useEffect, useState, memo } from "react";
import HistoryCard from "./HistoryCard";

interface Clone {
    id: string;
    niche?: string;
    created_at: string;
    [key: string]: any;
}

function LazyHistoryCard({ clone }: { clone: Clone }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Stop observing once visible
                }
            },
            {
                rootMargin: "50px", // Start loading 50px before entering viewport
                threshold: 0.1
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} style={{ contain: 'content' }}>
            {isVisible ? (
                <HistoryCard clone={clone} />
            ) : (
                // Placeholder com altura consistente
                <div className="bg-[#111] border border-[#222] rounded-xl p-5 space-y-4" style={{ aspectRatio: '1/1.2' }}>
                    <div className="h-40 bg-gradient-to-r from-[#222] to-[#333] rounded-lg animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-4 bg-[#222] rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-[#222] rounded w-1/2 animate-pulse" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(LazyHistoryCard, (prev, next) => prev.clone.id === next.clone.id);
