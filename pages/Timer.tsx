
import React from 'react';

const TIMER_SOUNDS = [
  { id: 'wizard', name: '魔法铃声 (Wizard)', icon: 'fa-hat-wizard' },
  { id: 'victory', name: '胜利号角 (Victory)', icon: 'fa-trumpet' },
  { id: 'zen', name: '禅意铜磬 (Zen Bell)', icon: 'fa-om' },
  { id: 'digital', name: '电子警报 (Digital)', icon: 'fa-microchip' }
];

interface TimerPageProps {
  timeLeft: number;
  initialTime: number;
  isRunning: boolean;
  selectedSoundId: string;
  onToggle: () => void;
  onReset: () => void;
  onSetTime: (s: number) => void;
  onSetSound: (id: string) => void;
}

const TimerPage: React.FC<TimerPageProps> = ({ 
  timeLeft, initialTime, isRunning, selectedSoundId, 
  onToggle, onReset, onSetTime, onSetSound 
}) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 pt-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-5xl font-black text-slate-800 tracking-tighter">魔法计时器 (Magic Timer)</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] ml-1">Global Context Persistence Enabled</p>
      </div>

      <div className="bg-white rounded-[5rem] border shadow-2xl p-20 flex flex-col lg:flex-row items-center gap-24 relative overflow-hidden">
        {/* Animated Timer Dial */}
        <div className="relative w-80 h-80 lg:w-[450px] lg:h-[450px] flex items-center justify-center shrink-0 group">
          <svg className="w-full h-full -rotate-90">
            <circle cx="50%" cy="50%" r="46%" stroke="#f1f5f9" strokeWidth="24" fill="none" />
            <circle 
              cx="50%" cy="50%" r="46%" stroke="#6366f1" strokeWidth="24" fill="none" 
              strokeDasharray="1445" 
              style={{ strokeDashoffset: 1445 - (timeLeft / initialTime) * 1445, transition: 'stroke-dashoffset 1s linear' }}
              strokeLinecap="round"
              className="drop-shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10rem] font-black text-slate-800 tracking-tighter tabular-nums leading-none mb-4">{formatTime(timeLeft)}</span>
            <div className={`px-6 py-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${isRunning ? 'bg-indigo-600 text-white animate-pulse shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
              {isRunning ? 'Magic Flowing...' : 'System Idle'}
            </div>
          </div>
          {isRunning && <div className="absolute inset-0 border-[10px] border-indigo-200/20 rounded-full animate-spin-slow pointer-events-none"></div>}
        </div>

        {/* Control Hub */}
        <div className="flex-1 w-full space-y-12">
          <div className="space-y-6">
             <div className="flex items-center gap-3 ml-2">
                <i className="fas fa-bolt-lightning text-amber-500"></i>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">快速课时设定</label>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {[60, 180, 300, 600].map(s => (
                 <button key={s} onClick={() => onSetTime(s)} className={`h-20 rounded-[2rem] font-black text-lg transition-all border-2 ${initialTime === s ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-105' : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'}`}>
                   {s / 60}m
                 </button>
               ))}
             </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center gap-3 ml-2">
                <i className="fas fa-volume-high text-indigo-400"></i>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">魔法音场选择</label>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {TIMER_SOUNDS.map(sound => (
                 <button 
                  key={sound.id} 
                  onClick={() => onSetSound(sound.id)}
                  className={`flex items-center justify-between px-8 py-5 rounded-[2.5rem] border-2 transition-all group ${selectedSoundId === sound.id ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-50 hover:bg-slate-50'}`}
                 >
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm ${selectedSoundId === sound.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                         <i className={`fas ${sound.icon}`}></i>
                      </div>
                      <span className={`text-xs font-black ${selectedSoundId === sound.id ? 'text-indigo-600' : 'text-slate-400'}`}>{sound.name}</span>
                   </div>
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-6 pt-6">
            <button 
              onClick={onToggle}
              className={`flex-1 h-24 rounded-[2.5rem] flex items-center justify-center text-white font-black text-xl gap-6 shadow-2xl transition-all active:scale-95 ${isRunning ? 'bg-rose-500 shadow-rose-100' : 'bg-indigo-600 shadow-indigo-100'}`}
            >
              <i className={`fas ${isRunning ? 'fa-pause' : 'fa-play'} text-2xl`}></i>
              {isRunning ? 'Pause Magic' : 'Cast Timer'}
            </button>
            <button onClick={onReset} className="w-24 h-24 rounded-[2.5rem] bg-slate-100 text-slate-400 flex items-center justify-center text-3xl hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <i className="fas fa-rotate-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerPage;
