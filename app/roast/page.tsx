'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RoastPage() {
    const [roast, setRoast] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchRoast = async () => {

            const urlParams = new URLSearchParams(window.location.search);
            let sessionId = urlParams.get('session_id');

            if (sessionId) {

                localStorage.setItem('session_id', sessionId);
                window.history.replaceState({}, '', '/roast');
            } else {

                sessionId = localStorage.getItem('session_id');
            }

            if (!sessionId) {
                setError('Unauthorized: No session found. Please try connecting again.');
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/roast', {
                    headers: {
                        'Authorization': `Bearer ${sessionId}`
                    },
                    cache: 'no-store'
                });

                if (res.status === 401) {
                    localStorage.removeItem('session_id'); // Clear invalid session
                    setError('Unauthorized: Session expired or invalid.');
                    return;
                }
                if (!res.ok) {
                    throw new Error('Failed to fetch roast');
                }
                const data = await res.json();
                setRoast(data.roast);
            } catch (err) {
                setError('Something went wrong. Maybe your taste is too bad to roast?');
            } finally {
                setLoading(false);
            }
        };

        fetchRoast();
    }, [router]);

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">

            <div className="absolute top-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-red-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container max-w-3xl relative z-10 text-center">
                {loading ? (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8"></div>
                        <h2 className="text-2xl font-bold animate-pulse">Analyzing your questionable choices...</h2>
                        <p className="text-gray-400 mt-2">Judging your top artists...</p>
                    </div>
                ) : error ? (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-red-500 mb-4">Error</h2>
                        <p className="text-xl mb-8">{error}</p>
                        <Link href="/" className="btn-primary">Try Again</Link>
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <span className="text-primary text-sm font-bold tracking-widest uppercase mb-4 block">The Verdict</span>
                        <div className="glass-panel mb-10 p-8 md:p-12">
                            <p className="text-xl md:text-2xl leading-relaxed font-medium text-white shadow-black drop-shadow-md whitespace-pre-wrap">
                                "{roast}"
                            </p>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <Link href="/" className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition-colors">
                                Go Back
                            </Link>
                            <button onClick={() => window.location.reload()} className="btn-primary">
                                Roast Me Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
