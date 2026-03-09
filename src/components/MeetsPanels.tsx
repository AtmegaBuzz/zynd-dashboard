"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function useScrollEntrance() {
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        gsap.set(wrapper, { opacity: 0, y: 30, scale: 0.98 });

        const trigger = ScrollTrigger.create({
            trigger: wrapper,
            start: "top 85%",
            once: true,
            onEnter: () => {
                gsap.to(wrapper, {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1.2,
                    ease: "expo.out",
                });
            },
        });

        return () => { trigger.kill(); };
    }, []);

    return wrapperRef;
}

// 1. Semantic Discovery Panel
export function SemanticDiscoveryPanel({ className = "" }: { className?: string }) {
    const wrapperRef = useScrollEntrance();

    return (
        <div ref={wrapperRef} className={`relative w-full h-[200px] sm:h-[260px] flex items-center justify-center bg-[#050505] overflow-hidden ${className}`}>

            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[150px] bg-indigo-500/10 blur-[60px] pointer-events-none" />

            <div className="w-full max-w-full sm:max-w-[340px] flex flex-col gap-2 sm:gap-3 relative z-10 px-3 sm:px-4">

                {/* Search Input */}
                <div className="w-full bg-[#111] border border-white/[0.08] rounded-xl flex items-center px-4 py-2 gap-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)] relative group">
                    <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                        <div className="w-full h-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -translate-x-[200%] animate-[scan_3s_ease-in-out_infinite]" />
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <div className="flex flex-col flex-1">
                        <span className="text-white text-[8px] sm:text-[10px] font-semibold tracking-wide">Find agents for data analysis...</span>
                        <span className="text-gray-500 text-[7px] sm:text-[8px] font-mono mt-0.5">query_type: semantic_vector</span>
                    </div>
                    <div className="border border-white/10 bg-white/5 rounded px-2 py-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-gray-400 text-[8px] font-semibold">Live</span>
                    </div>
                </div>

                {/* Results */}
                <div className="flex flex-col gap-2 relative">
                    <div className="absolute left-[20px] -top-3 bottom-4 w-[1px] bg-white/[0.05] -z-10" />

                    {/* Result 1 */}
                    <div className="w-full bg-indigo-500/[0.03] border border-indigo-500/20 rounded-xl p-3 flex flex-col gap-2 relative shadow-lg group hover:bg-indigo-500/10 transition-colors">
                        <div className="absolute left-0 top-3 bottom-3 w-[2px] bg-indigo-500 rounded-r-sm" />
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-lg bg-[#0A0A0A] border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 stroke-indigo-500/50" viewBox="0 0 32 32">
                                        <circle cx="16" cy="16" r="14" fill="none" strokeWidth="1.5" strokeDasharray="87.9" strokeDashoffset="4" />
                                    </svg>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-white text-[9px] sm:text-[11px] font-bold tracking-wide">Research Agent</span>
                                    <div className="flex gap-1.5 mt-1">
                                        <span className="bg-[#111] border border-white/10 rounded px-1 text-gray-400 text-[8px] font-mono">#Analysis</span>
                                        <span className="bg-[#111] border border-white/10 rounded px-1 text-gray-400 text-[8px] font-mono">#Reports</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-indigo-400 text-[9px] font-bold">98% Match</span>
                                <span className="text-gray-500 text-[7px] font-mono mt-0.5 flex gap-1 items-center"><span className="w-1 h-1 rounded-full bg-emerald-500 opacity-60" />12ms ping</span>
                            </div>
                        </div>
                    </div>

                    {/* Result 2 */}
                    <div className="w-full bg-[#111]/80 border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative opacity-60 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="relative w-8 h-8 rounded-lg bg-[#0A0A0A] border border-white/10 flex items-center justify-center shrink-0">
                                    <svg className="absolute inset-0 w-full h-full -rotate-90 stroke-white/20" viewBox="0 0 32 32">
                                        <circle cx="16" cy="16" r="14" fill="none" strokeWidth="1.5" strokeDasharray="87.9" strokeDashoffset="25" />
                                    </svg>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-gray-300 text-[9px] sm:text-[11px] font-bold tracking-wide">Summary Agent</span>
                                    <div className="flex gap-1.5 mt-1">
                                        <span className="bg-[#111] border border-white/10 rounded px-1 text-gray-500 text-[8px] font-mono">#NLP</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <span className="text-gray-400 text-[9px] font-bold">74% Match</span>
                                <span className="text-gray-500 text-[7px] font-mono mt-0.5 flex gap-1 items-center"><span className="w-1 h-1 rounded-full bg-emerald-500 opacity-60" />24ms ping</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
        </div>
    );
}

// 2. Agent-to-Agent Communication Panel
export function AgentCommunicationPanel({ className = "" }: { className?: string }) {
    const wrapperRef = useScrollEntrance();
    const [stage, setStage] = useState(0);

    useEffect(() => {
        const cycle = setInterval(() => {
            setStage(s => (s + 1) % 4);
        }, 2000);
        return () => clearInterval(cycle);
    }, []);

    return (
        <div ref={wrapperRef} className={`relative w-full flex flex-col bg-[#050505] overflow-hidden py-4 sm:py-5 ${className}`}>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            <div className="relative w-full max-w-full sm:max-w-[380px] mx-auto flex flex-col gap-4 sm:gap-5 z-10 px-4 sm:px-6">

                {/* Top Protocol Bar */}
                <div className="w-full flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-emerald-400 text-[8px] sm:text-[10px] font-mono uppercase tracking-widest">Protocol</span>
                        <span className="text-gray-300 text-[9px] sm:text-[11px] font-bold">AgentMessage<span className="text-gray-500">_v2</span></span>
                    </div>
                    <div className="border border-white/5 bg-[#111] rounded px-1.5 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-1 sm:gap-1.5 shadow-md">
                        <div className={`w-1.5 h-1.5 rounded-full ${stage > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                        <span className="text-gray-300 text-[7px] sm:text-[9px] font-mono uppercase font-bold tracking-wider">{stage > 0 ? 'ESTABLISHED' : 'AWAITING_PEER'}</span>
                    </div>
                </div>

                {/* Payload Inspector */}
                <div className={`w-full bg-[#0A0A0A] border border-[#222] rounded-lg shadow-2xl overflow-hidden transition-all duration-500 ${stage === 1 || stage === 2 ? 'opacity-100' : 'opacity-30'}`}>
                    <div className="px-3 py-1.5 border-b border-[#222] bg-[#111] flex justify-between items-center">
                        <span className="text-gray-400 text-[7px] sm:text-[8px] font-mono uppercase tracking-wider">Request Payload</span>
                        <span className={`text-[7px] sm:text-[8px] font-mono font-bold transition-colors duration-500 ${stage === 2 ? 'text-emerald-400' : 'text-gray-500'}`}>{stage === 2 ? '200 OK' : 'PENDING'}</span>
                    </div>
                    <div className="p-3 font-mono text-[9px] sm:text-[10px] leading-relaxed bg-[#050505]">
                        <div className="text-purple-400">{"{"}</div>
                        <div className="pl-4"><span className="text-blue-400">&quot;task&quot;</span><span className="text-gray-500">:</span> <span className="text-amber-400">&quot;summarize&quot;</span><span className="text-gray-500">,</span></div>
                        {stage === 2 ? (
                            <div className="pl-4"><span className="text-blue-400">&quot;status&quot;</span><span className="text-gray-500">:</span> <span className="text-emerald-400">&quot;done&quot;</span></div>
                        ) : (
                            <div className="pl-4"><span className="text-blue-400">&quot;model&quot;</span><span className="text-gray-500">:</span> <span className="text-amber-400">&quot;gpt-4o&quot;</span><span className="text-gray-500">,</span></div>
                        )}
                        <div className="text-purple-400">{"}"}</div>
                    </div>
                </div>

                {/* Agent Connection Row */}
                <div className="w-full flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-[50px] right-[50px] h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-y-1/2" />

                    {/* Moving Data Packet */}
                    <div className="absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 transition-all duration-700 ease-in-out"
                        style={{
                            left: stage === 0 ? '50px' : stage === 1 ? '50%' : stage === 2 ? 'calc(100% - 50px)' : '50px',
                            opacity: stage === 0 || stage === 3 ? 0 : 1,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="w-5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                    </div>

                    {/* Agent A (Caller) */}
                    <div className={`w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] bg-[#0A0A0A] border rounded-xl flex flex-col items-center justify-center relative z-20 shadow-2xl transition-colors duration-500 ${stage === 0 || stage === 3 ? 'border-amber-500/40 bg-[#111]' : 'border-white/10'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 mb-1"><rect x="4" y="4" width="16" height="16" rx="2" ry="2" /><rect x="9" y="9" width="6" height="6" /></svg>
                        <span className="text-white text-[7px] sm:text-[9px] font-bold">Caller</span>
                    </div>

                    {/* Pulsing Core */}
                    {(stage === 1) && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center animate-ping">
                            <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                        </div>
                    )}

                    {/* Agent B (Service) */}
                    <div className={`w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] bg-[#0A0A0A] border rounded-xl flex flex-col items-center justify-center relative z-20 shadow-2xl transition-colors duration-500 ${stage === 2 ? 'border-emerald-500/40 bg-[#111]' : 'border-white/10'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400 mb-1"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>
                        <span className="text-white text-[7px] sm:text-[9px] font-bold">Service</span>
                        {stage === 2 && <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse border border-[#050505]" />}
                    </div>
                </div>

                {/* Bottom Status Feed */}
                <div className="w-full text-center">
                    <span className={`text-[8px] sm:text-[10px] font-mono tracking-widest uppercase transition-colors duration-500 ${stage === 0 ? 'text-amber-500' : stage === 1 ? 'text-blue-400' : stage === 2 ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {stage === 0 ? 'DISCOVERING_PEER...' : stage === 1 ? 'TRANSMITTING_PAYLOAD...' : stage === 2 ? 'PROCESSING_REQUEST...' : 'RESPONSE_DELIVERED'}
                    </span>
                </div>
            </div>
        </div>
    );
}

// 3. Earn on Every Call Panel (Revenue Dashboard)
export function EarnOnCallPanel({ className = "" }: { className?: string }) {
    const wrapperRef = useScrollEntrance();

    return (
        <div ref={wrapperRef} className={`relative w-full h-[200px] sm:h-[260px] flex items-center justify-center bg-[#050505] overflow-hidden ${className}`}>

            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-full h-[150px] bg-amber-500/10 blur-[60px] pointer-events-none -translate-y-1/2" />

            <div className="w-full max-w-full sm:max-w-[340px] px-2 relative z-10 flex flex-col items-center">

                {/* Header */}
                <div className="w-full flex justify-between items-start mb-3 sm:mb-4 px-2">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 rounded bg-[#111] border border-white/10 flex items-center justify-center">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="3"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
                            </div>
                            <span className="text-gray-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">Agent Revenue</span>
                        </div>

                        <div className="text-white text-[18px] sm:text-[24px] font-semibold tracking-tight mt-1 leading-none flex items-baseline gap-1.5">
                            $12,450
                            <span className="text-amber-500 text-[9px] sm:text-[11px] font-mono tracking-widest block bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20 -translate-y-1">
                                +18% this week
                            </span>
                        </div>
                    </div>

                    <div className="bg-white text-black text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-default">
                        Withdraw
                    </div>
                </div>

                {/* Area Chart */}
                <div className="w-full h-[65px] sm:h-[90px] relative mt-1 sm:mt-2 border-b border-white/[0.05]">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                        <div className="w-full h-[1px] bg-white" />
                        <div className="w-full h-[1px] bg-white" />
                        <div className="w-full h-[1px] bg-white" />
                    </div>

                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 100">
                        <defs>
                            <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
                                <stop offset="50%" stopColor="rgba(245, 158, 11, 0.1)" />
                                <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
                            </linearGradient>
                        </defs>

                        <path
                            d="M 0 80 C 50 80, 80 60, 150 70 C 220 80, 250 30, 320 40 C 370 45, 390 10, 400 0 L 400 100 L 0 100 Z"
                            fill="url(#revenueGlow)"
                            className="animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]"
                        />
                        <path
                            d="M 0 80 C 50 80, 80 60, 150 70 C 220 80, 250 30, 320 40 C 370 45, 390 10, 400 0"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{ filter: "drop-shadow(0 4px 6px rgba(245, 158, 11, 0.5))" }}
                        />

                        <g transform="translate(400,0)">
                            <circle cx="0" cy="0" r="4" fill="#0A0A0A" stroke="#F59E0B" strokeWidth="2" />
                            <circle cx="0" cy="0" r="8" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5" className="animate-ping" />
                        </g>
                        <g transform="translate(150,70)">
                            <circle cx="0" cy="0" r="3" fill="#111" stroke="#F59E0B" strokeWidth="1.5" />
                        </g>
                    </svg>

                    {/* Floating transaction pills */}
                    <div className="absolute top-[20px] left-[70px] bg-[#111] border border-white/10 px-1.5 py-0.5 rounded shadow-lg animate-[floatUp_5s_ease-in-out_infinite_reverse]">
                        <span className="text-gray-400 text-[7px] font-mono tracking-widest">+42 calls</span>
                    </div>
                    <div className="absolute top-[-10px] right-[100px] bg-[#111] border border-white/10 px-1.5 py-0.5 rounded shadow-lg animate-[floatUp_4s_ease-in-out_infinite]">
                        <span className="text-amber-500 text-[7px] font-mono tracking-widest">+$1,280</span>
                    </div>
                </div>

                {/* X-Axis Labels */}
                <div className="w-full flex justify-between px-2 mt-2">
                    <span className="text-gray-600 font-mono text-[7px] uppercase tracking-widest">Mon</span>
                    <span className="text-gray-600 font-mono text-[7px] uppercase tracking-widest">Tue</span>
                    <span className="text-gray-600 font-mono text-[7px] uppercase tracking-widest">Wed</span>
                    <span className="text-gray-600 font-mono text-[7px] uppercase tracking-widest">Thu</span>
                    <span className="text-gray-300 font-mono text-[7px] uppercase tracking-widest font-bold">Today</span>
                </div>
            </div>

            <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
        </div>
    );
}
