import React, { useState, useEffect } from "react";

export default function PomodoroTimer({ taskName, onTaskComplete }) {
  const FOCUS_MINUTES = 25;
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem("pomodoro-start");
    return saved ? parseInt(saved) : null;
  });
  const [timeLeft, setTimeLeft] = useState(0);

  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const timer = setInterval(() => {
      if (!startTime) return setTimeLeft(0);
      const focusMs = FOCUS_MINUTES * 60 * 1000;
      const diff = Math.ceil((focusMs - (Date.now() - startTime)) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    if (startTime) localStorage.setItem("pomodoro-start", startTime.toString());
    else localStorage.removeItem("pomodoro-start");
  }, [startTime]);

  const toggleFocus = () => {
    if (!taskName) return alert("업무를 먼저 선택해주세요! 🎯");
    if (!startTime) setStartTime(Date.now());
    else if (timeLeft <= 0) { onTaskComplete(); setStartTime(null); }
    else { if (window.confirm("지금 포기하면 티켓을 얻을 수 없습니다. 중단할까요?")) setStartTime(null); }
  };

  const isRunning = startTime && timeLeft > 0;
  const isFinished = startTime && timeLeft <= 0;
  const progress = isRunning ? timeLeft / (FOCUS_MINUTES * 60) : isFinished ? 0 : 1;

  return (
    <div className={`w-full p-8 rounded-[3rem] transition-all duration-500 border-2 flex flex-col items-center ${
      isRunning ? "bg-slate-900 border-indigo-500 shadow-2xl scale-105" : 
      isFinished ? "bg-green-500 border-green-400 animate-pulse" : "bg-white border-gray-100 shadow-sm"
    }`}>
      
      <p className={`text-[10px] font-bold mb-4 uppercase tracking-[0.2em] ${isRunning || isFinished ? "text-indigo-400" : "text-gray-400"}`}>
        {isRunning ? "Focus Concentration" : "Ready to Start"}
      </p>

      <div className="relative flex items-center justify-center mb-8">
        <svg className="w-48 h-48 md:w-40 md:h-40 transform -rotate-90">
          <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className={`${isRunning || isFinished ? "text-slate-800" : "text-gray-100"}`} />
          <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference}
            style={{ strokeDashoffset: circumference * (1 - progress), transition: "stroke-dashoffset 1s linear" }}
            strokeLinecap="round" className={`${isRunning ? "text-indigo-500" : isFinished ? "text-white" : "text-gray-200"}`} />
        </svg>
        <div className={`absolute text-4xl md:text-3xl font-black font-mono ${isRunning || isFinished ? "text-white" : "text-gray-300"}`}>
          {isRunning ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, '0')}` : isFinished ? "DONE" : "25:00"}
        </div>
      </div>

      <h3 className={`text-sm md:text-xs font-bold mb-8 truncate w-full text-center px-4 ${isRunning || isFinished ? "text-slate-300" : "text-gray-700"}`}>
        {taskName || "대기 중..."}
      </h3>
      
      <button onClick={toggleFocus} className={`w-full py-5 md:py-4 rounded-[2rem] font-black text-sm transition-all active:scale-95 ${
          !startTime ? "bg-indigo-600 text-white shadow-lg" :
          isRunning ? "bg-slate-800 text-slate-400 border border-slate-700" : "bg-white text-green-600 shadow-xl"
        }`}>
        {!startTime ? "집중 시작" : isRunning ? "그만하기" : "보상 받기"}
      </button>
    </div>
  );
}