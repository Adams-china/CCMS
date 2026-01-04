
import React, { useState, useEffect, useMemo } from 'react';
import { AppState, ToolType } from '../types';
import { announceTTS, generateOrganizerContent } from '../services/geminiService';

interface ToolboxProps {
  state: AppState;
}

const Toolbox: React.FC<ToolboxProps> = ({ state }) => {
  const { activeClassId, dictationLists } = state;
  const [activeCategory, setActiveCategory] = useState<'ORGANIZERS' | 'GAMES'>('ORGANIZERS');
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  const classWords = useMemo(() => {
    const list = dictationLists.find(l => l.id.includes(activeClassId || '')) || dictationLists[0];
    return list?.words || [];
  }, [activeClassId, dictationLists]);

  const renderTool = () => {
    switch (activeTool) {
      case 'VENN': return <VennDiagram />;
      case 'T_CHART': return <TChart />;
      case 'WEB_CHART': return <WebbingChart />;
      case 'FISHBONE': return <FishboneDiagram />;
      case 'KWL': return <KWLChart />;
      case 'STORY_MAP': return <StoryMap />;
      case 'MATCHING': return <MatchingGame words={classWords} />;
      case 'WORD_MINER': return <WordMinerGame words={classWords} />;
      case 'UNSCRAMBLE': return <UnscrambleGame />;
      default: return <ToolGrid category={activeCategory} onSelect={setActiveTool} />;
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <i className="fas fa-brain-circuit text-indigo-600"></i>
             思维工具箱 (Thinking Toolbox)
          </h2>
          <p className="text-slate-500 font-medium mt-1">AI-Powered visual frameworks for high-order thinking</p>
        </div>
        
        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-full lg:w-auto">
           {[
             { id: 'ORGANIZERS', label: '可视化分析', icon: 'fa-diagram-project' },
             { id: 'GAMES', label: '互动语境', icon: 'fa-gamepad' }
           ].map(cat => (
             <button 
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id as any); setActiveTool(null); }}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               <i className={`fas ${cat.icon}`}></i>
               {cat.label}
             </button>
           ))}
        </div>
      </div>

      <div className="bg-white min-h-[600px] lg:min-h-[750px] rounded-[2rem] lg:rounded-[4rem] border shadow-sm p-4 lg:p-12 overflow-hidden relative">
        {activeTool && (
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-10 z-50 relative">
             <button 
              onClick={() => setActiveTool(null)}
              className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl text-[10px] font-black hover:bg-slate-900 hover:text-white transition-all flex items-center gap-2 shadow-sm"
             >
               <i className="fas fa-arrow-left"></i> 返回目录
             </button>
             <AISpark type={activeTool} onData={(d) => { /* Sub-components handle this via events or context, but here we pass directly via state in implementation */ }} />
           </div>
        )}
        {renderTool()}
      </div>
    </div>
  );
};

// --- AISpark Component (Robust Implementation) ---
const AISpark = ({ type, onData }: { type: string, onData?: (data: any) => void }) => {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSpark = async () => {
    if (!topic || loading) return;
    setLoading(true);
    try {
      const data = await generateOrganizerContent(type, topic);
      // Dispatch event for child components to listen to
      window.dispatchEvent(new CustomEvent('ai-spark-data', { detail: data }));
      announceTTS(`Generated ${type} for ${topic}. Ready to explore.`);
    } catch (e) {
      alert("AI failed to spark. Please try a simpler topic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <input 
        placeholder="输入主题 (如: Global Warming)..." 
        className="flex-1 sm:w-64 bg-slate-50 border border-slate-100 px-5 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        value={topic}
        onChange={e => setTopic(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSpark()}
      />
      <button 
        onClick={handleSpark}
        disabled={loading}
        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100"
      >
        {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
        <span>智能填充</span>
      </button>
    </div>
  );
};

// --- Responsive Organizers ---

const ToolGrid = ({ category, onSelect }: { category: string, onSelect: (t: ToolType) => void }) => {
  const tools = {
    ORGANIZERS: [
      { id: 'VENN', title: '维恩图 (Venn)', desc: '对比两个概念的异同点', icon: 'fa-circle-nodes', color: 'from-indigo-500 to-indigo-700' },
      { id: 'T_CHART', title: 'T型图 (T-Chart)', desc: '支持优劣对比与分类分析', icon: 'fa-table-columns', color: 'from-emerald-500 to-emerald-700' },
      { id: 'WEB_CHART', title: '蜘蛛图 (Webbing)', desc: '核心词汇发散思维导图', icon: 'fa-spider', color: 'from-amber-500 to-amber-700' },
      { id: 'FISHBONE', title: '鱼骨图 (Fishbone)', desc: '根本原因探究与逻辑拆解', icon: 'fa-fish', color: 'from-rose-500 to-rose-700' },
      { id: 'KWL', title: 'KWL记录表', desc: '学习全过程认知管理工具', icon: 'fa-rectangle-list', color: 'from-blue-500 to-blue-700' },
      { id: 'STORY_MAP', title: '故事地图', desc: '文学作品情节与角色拆解', icon: 'fa-book-open', color: 'from-violet-500 to-violet-700' },
    ],
    GAMES: [
      { id: 'MATCHING', title: '连连看 (Matching)', desc: '单词与翻译的翻牌消除记忆', icon: 'fa-puzzle-piece', color: 'from-rose-500 to-rose-700' },
      { id: 'WORD_MINER', title: '黄金矿工 (Word Miner)', desc: '动感捕获单词，强化中英映射', icon: 'fa-gem', color: 'from-blue-500 to-blue-700' },
      { id: 'UNSCRAMBLE', title: '连词成句 (Unscramble)', desc: 'AI驱动的语法排列组合挑战', icon: 'fa-spell-check', color: 'from-violet-500 to-violet-700' },
    ]
  }[category] || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 pt-6 lg:pt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {tools.map(tool => (
        <button 
          key={tool.id}
          onClick={() => onSelect(tool.id as ToolType)}
          className="group text-left bg-white border border-slate-100 p-8 rounded-[2rem] lg:rounded-[3rem] hover:shadow-2xl hover:border-indigo-200 transition-all"
        >
          <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-br ${tool.color} text-white flex items-center justify-center text-xl lg:text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform`}>
            <i className={`fas ${tool.icon}`}></i>
          </div>
          <h4 className="text-lg lg:text-xl font-black text-slate-800 mb-2">{tool.title}</h4>
          <p className="text-xs lg:text-sm text-slate-400 font-medium leading-relaxed">{tool.desc}</p>
        </button>
      ))}
    </div>
  );
};

const VennDiagram = () => {
  const [data, setData] = useState({ left: '', right: '', both: '', titleL: 'Concept A', titleR: 'Concept B' });
  
  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-500 relative">
      <div className="flex flex-col lg:flex-row relative w-full max-w-5xl gap-10 lg:gap-0 lg:h-[500px]">
        <div className="lg:absolute left-0 w-full lg:w-[60%] h-[350px] lg:h-full rounded-[3rem] lg:rounded-full border-4 border-indigo-200 bg-indigo-50/20 flex flex-col items-start p-10 lg:p-20">
          <input className="bg-transparent border-b-2 border-dashed border-indigo-200 font-black text-indigo-700 outline-none text-xl lg:text-2xl mb-4 lg:mb-6 w-full" value={data.titleL} onChange={e => setData({...data, titleL: e.target.value})} />
          <textarea className="bg-transparent w-full h-full text-slate-500 font-bold outline-none resize-none text-sm lg:text-lg" placeholder="Unique traits..." value={data.left} onChange={e => setData({...data, left: e.target.value})} />
        </div>
        
        <div className="lg:absolute right-0 w-full lg:w-[60%] h-[350px] lg:h-full rounded-[3rem] lg:rounded-full border-4 border-emerald-200 bg-emerald-50/20 flex flex-col items-end p-10 lg:p-20">
          <input className="bg-transparent border-b-2 border-dashed border-emerald-200 font-black text-emerald-700 outline-none text-xl lg:text-2xl mb-4 lg:mb-6 text-right w-full" value={data.titleR} onChange={e => setData({...data, titleR: e.target.value})} />
          <textarea className="bg-transparent w-full h-full text-slate-500 font-bold outline-none resize-none text-right text-sm lg:text-lg" placeholder="Unique traits..." value={data.right} onChange={e => setData({...data, right: e.target.value})} />
        </div>
        
        <div className="lg:absolute left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 w-full lg:w-72 h-48 lg:h-72 bg-white/80 backdrop-blur-md rounded-[2.5rem] lg:rounded-full border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 shadow-xl z-10">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 lg:mb-4">Common Ground</span>
          <textarea className="bg-transparent w-full h-full text-center text-xs lg:text-sm font-bold outline-none resize-none" placeholder="Overlapping traits..." value={data.both} onChange={e => setData({...data, both: e.target.value})} />
        </div>
      </div>
    </div>
  );
};

const FishboneDiagram = () => {
  const [data, setData] = useState({ effect: 'The Result', bones: [
    { category: 'People', causes: ['', ''] },
    { category: 'Methods', causes: ['', ''] },
    { category: 'Environment', causes: ['', ''] },
    { category: 'Tools', causes: ['', ''] }
  ]});

  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-2 lg:p-10 animate-in fade-in duration-700 overflow-x-auto">
      <div className="relative min-w-[800px] lg:min-w-0 w-full max-w-6xl h-[500px] flex items-center">
        {/* Spine */}
        <div className="absolute w-[85%] h-1 bg-slate-900 right-[15%] rounded-full shadow-lg"></div>
        
        {/* Head */}
        <div className="absolute right-0 w-[18%] h-48 bg-slate-900 rounded-l-[4rem] rounded-r-3xl flex items-center justify-center p-6 text-white shadow-2xl border-4 border-slate-800">
          <textarea className="bg-transparent w-full text-center font-black text-lg outline-none resize-none uppercase leading-tight" value={data.effect} onChange={e => setData({...data, effect: e.target.value})} />
        </div>

        {/* Bones */}
        <div className="grid grid-cols-4 w-[82%] h-full gap-4 relative">
          {data.bones.map((bone, idx) => {
            const isTop = idx % 2 === 0;
            return (
              <div key={idx} className={`flex flex-col ${isTop ? 'justify-end pb-1' : 'justify-start pt-1'}`}>
                <div className={`h-48 w-full border-l-4 border-indigo-400 p-4 transition-all hover:bg-indigo-50/10 rounded-xl ${isTop ? 'rotate-[35deg] origin-bottom-left -translate-y-4' : '-rotate-[35deg] origin-top-left translate-y-4'}`}>
                   <input className="font-black text-indigo-600 mb-2 bg-transparent outline-none w-full border-b border-indigo-100" value={bone.category} onChange={e => {
                      const nb = [...data.bones]; nb[idx].category = e.target.value; setData({...data, bones: nb});
                   }} />
                   <textarea className="text-[11px] font-bold text-slate-500 bg-transparent w-full h-24 outline-none resize-none placeholder:text-slate-200" placeholder="Causes..." value={bone.causes.join('\n')} onChange={e => {
                      const nb = [...data.bones]; nb[idx].causes = e.target.value.split('\n'); setData({...data, bones: nb});
                   }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest lg:hidden">请在横屏模式下获得更佳操作体验</p>
    </div>
  );
};

const WebbingChart = () => {
  const [data, setData] = useState({ center: 'Central Topic', branches: ['', '', '', '', '', ''] });
  
  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full relative p-6 lg:p-20 overflow-hidden">
      <div className="w-40 h-40 lg:w-60 lg:h-60 bg-indigo-600 rounded-full flex items-center justify-center text-white p-6 lg:p-10 shadow-2xl z-20 border-[8px] border-white ring-8 ring-indigo-50">
        <input className="bg-transparent border-b-2 border-indigo-400 w-full text-center font-black text-lg lg:text-2xl outline-none placeholder:text-indigo-200" value={data.center} onChange={e => setData({...data, center: e.target.value})} />
      </div>

      <div className="mt-12 lg:mt-0 grid grid-cols-2 lg:block gap-4 w-full lg:w-auto">
        {data.branches.map((branch, idx) => {
          const deg = (360 / data.branches.length) * idx;
          return (
            <div 
              key={idx} 
              className="lg:absolute lg:origin-center transition-all hover:scale-105" 
              style={{ transform: window.innerWidth > 1024 ? `rotate(${deg}deg) translate(300px) rotate(-${deg}deg)` : 'none' }}
            >
              <div className="w-full lg:w-44 h-24 lg:h-44 bg-white border-2 border-indigo-50 rounded-[2rem] lg:rounded-[3rem] flex items-center justify-center p-4 shadow-xl hover:border-indigo-200 transition-colors">
                 <textarea className="w-full h-full bg-transparent text-center text-xs lg:text-sm font-bold outline-none resize-none text-slate-600 leading-relaxed" placeholder="Subtopic..." value={branch} onChange={e => {
                   const nb = [...data.branches]; nb[idx] = e.target.value; setData({...data, branches: nb});
                 }} />
              </div>
              {/* Connector line for Desktop */}
              <div className="hidden lg:block absolute top-1/2 left-0 w-24 h-1 bg-indigo-100 -translate-x-full origin-right" style={{ transform: `scaleX(1.3)` }}></div>
            </div>
          );
        })}
      </div>
      
      <button 
        onClick={() => setData({...data, branches: [...data.branches, '']})} 
        className="mt-10 lg:mt-0 lg:absolute bottom-10 right-10 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-black hover:scale-110 transition-all z-30"
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

const KWLChart = () => {
  const [data, setData] = useState({ k: '', w: '', l: '' });
  
  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="max-w-6xl mx-auto h-full p-2 lg:p-10 animate-in slide-in-from-bottom-6 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 h-full min-h-[500px]">
        {[
          { key: 'k', title: 'KNOW', sub: 'What I know', color: 'bg-indigo-50/50 border-indigo-200 text-indigo-600' },
          { key: 'w', title: 'WANT', sub: 'What I want', color: 'bg-amber-50/50 border-amber-200 text-amber-600' },
          { key: 'l', title: 'LEARN', sub: 'What I learned', color: 'bg-emerald-50/50 border-emerald-200 text-emerald-600' }
        ].map(col => (
          <div key={col.key} className={`rounded-[2.5rem] lg:rounded-[4rem] border-2 p-8 lg:p-10 flex flex-col shadow-sm group hover:shadow-xl transition-all ${col.color}`}>
             <h3 className="text-3xl lg:text-4xl font-black tracking-tighter">{col.title}</h3>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-8">{col.sub}</p>
             <textarea 
               className="flex-1 bg-transparent w-full font-bold text-base lg:text-xl outline-none resize-none leading-relaxed placeholder:text-slate-300 scrollbar-hide" 
               placeholder="Write or Use AI Spark..."
               value={(data as any)[col.key]}
               onChange={e => setData({...data, [col.key]: e.target.value})}
             />
          </div>
        ))}
      </div>
    </div>
  );
};

const TChart = () => {
  const [data, setData] = useState({ leftHeader: 'Pros', rightHeader: 'Cons', rows: [['', '']] });
  
  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="max-w-4xl mx-auto h-full p-2 lg:p-10 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2rem] lg:rounded-[3.5rem] border-4 border-slate-50 shadow-inner min-h-[500px] overflow-hidden flex flex-col">
        <div className="grid grid-cols-2 bg-slate-50 border-b-4 border-white">
           <input className="p-6 lg:p-10 text-xl lg:text-3xl font-black text-indigo-600 bg-transparent outline-none text-center" value={data.leftHeader} onChange={e => setData({...data, leftHeader: e.target.value})} />
           <input className="p-6 lg:p-10 text-xl lg:text-3xl font-black text-emerald-600 bg-transparent outline-none border-l-4 border-white text-center" value={data.rightHeader} onChange={e => setData({...data, rightHeader: e.target.value})} />
        </div>
        <div className="flex-1 grid grid-cols-2 divide-x-4 divide-slate-50">
           <textarea className="p-6 lg:p-10 bg-transparent outline-none font-bold text-slate-500 leading-relaxed text-base lg:text-xl" placeholder="List items..." value={data.rows.map(r => r[0]).join('\n')} onChange={e => {
             const lines = e.target.value.split('\n');
             setData({...data, rows: lines.map((l, i) => [l, data.rows[i]?.[1] || ''])});
           }} />
           <textarea className="p-6 lg:p-10 bg-transparent outline-none font-bold text-slate-500 leading-relaxed text-base lg:text-xl" placeholder="List items..." value={data.rows.map(r => r[1]).join('\n')} onChange={e => {
             const lines = e.target.value.split('\n');
             setData({...data, rows: lines.map((l, i) => [data.rows[i]?.[0] || '', l])});
           }} />
        </div>
      </div>
    </div>
  );
};

const StoryMap = () => {
  const [data, setData] = useState({ title: '', setting: '', characters: '', problem: '', sequence: '', resolution: '' });
  
  useEffect(() => {
    const handler = (e: any) => setData(e.detail);
    window.addEventListener('ai-spark-data', handler);
    return () => window.removeEventListener('ai-spark-data', handler);
  }, []);

  return (
    <div className="max-w-6xl mx-auto h-full p-2 lg:p-10 space-y-8 animate-in zoom-in duration-500">
      <div className="bg-slate-950 text-white p-10 lg:p-14 rounded-[2.5rem] lg:rounded-[4rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <input className="bg-transparent border-b-2 border-white/20 w-full text-3xl lg:text-5xl font-black outline-none placeholder:text-white/10 mb-2 uppercase tracking-tight" placeholder="Story Title" value={data.title} onChange={e => setData({...data, title: e.target.value})} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Pedagogical Literature Analysis</p>
        </div>
        <i className="fas fa-feather-pointed absolute -right-10 -bottom-10 text-[15rem] text-white/5 -rotate-12"></i>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        <div className="bg-white border-2 border-slate-100 p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm">
           <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-map-location-dot text-rose-500"></i> SETTING</h4>
           <textarea className="w-full h-32 bg-slate-50/50 rounded-2xl p-6 font-bold text-slate-600 outline-none resize-none leading-relaxed" placeholder="Where and when?" value={data.setting} onChange={e => setData({...data, setting: e.target.value})} />
        </div>
        <div className="bg-white border-2 border-slate-100 p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm">
           <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-users-viewfinder text-blue-500"></i> CHARACTERS</h4>
           <textarea className="w-full h-32 bg-slate-50/50 rounded-2xl p-6 font-bold text-slate-600 outline-none resize-none leading-relaxed" placeholder="Who is in the story?" value={data.characters} onChange={e => setData({...data, characters: e.target.value})} />
        </div>
        <div className="lg:col-span-2 bg-indigo-50/30 border-2 border-indigo-100 p-8 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm">
           <h4 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><i className="fas fa-list-check text-indigo-500"></i> PLOT & SEQUENCE</h4>
           <textarea className="w-full h-48 lg:h-64 bg-white/60 rounded-2xl p-6 font-bold text-slate-600 outline-none resize-none leading-relaxed" placeholder="Summarize key plot points..." value={data.sequence} onChange={e => setData({...data, sequence: e.target.value})} />
        </div>
      </div>
    </div>
  );
};

// --- Game Components (Inherited from previous version, with mobile UI polish) ---

const MatchingGame = ({ words }: { words: any[] }) => {
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);

  useEffect(() => {
    const gameWords = words.slice(0, 8);
    const pairs = gameWords.flatMap((w, i) => [
      { id: i * 2, content: w.word, type: 'ENG', match: i },
      { id: i * 2 + 1, content: w.translation, type: 'CN', match: i }
    ]);
    setCards(pairs.sort(() => Math.random() - 0.5));
  }, [words]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || solved.includes(id) || flipped.includes(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      const first = cards.find(c => c.id === newFlipped[0]);
      const second = cards.find(c => c.id === newFlipped[1]);
      if (first.match === second.match) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
        announceTTS("Perfect!");
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6 p-4 lg:p-10 h-full max-w-5xl mx-auto">
      {cards.map(card => (
        <button key={card.id} onClick={() => handleFlip(card.id)} className={`h-32 lg:h-40 rounded-[2rem] text-sm lg:text-xl font-black shadow-lg transition-all transform ${solved.includes(card.id) ? 'bg-emerald-500 text-white scale-90 opacity-40' : flipped.includes(card.id) ? 'bg-indigo-600 text-white rotate-0' : 'bg-slate-50 text-transparent rotate-6 hover:rotate-0'}`}>{flipped.includes(card.id) || solved.includes(card.id) ? card.content : '?'}</button>
      ))}
    </div>
  );
};

const WordMinerGame = ({ words }: { words: any[] }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!words.length) return;
    const current = words[currentIdx];
    const others = words.filter((_, i) => i !== currentIdx).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.word);
    setOptions([...others, current.word].sort(() => Math.random() - 0.5));
  }, [currentIdx, words]);

  const handlePick = (word: string) => {
    if (word === words[currentIdx].word) {
      setScore(score + 10);
      announceTTS("Mining Success!");
      if (currentIdx < words.length - 1) setCurrentIdx(currentIdx + 1);
      else alert(`Finished! Final Score: ${score + 10}`);
    } else {
      announceTTS("Oops!");
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-10 lg:space-y-12 p-6">
       <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Target Translation</p>
          <h3 className="text-4xl lg:text-7xl font-black text-slate-800 tracking-tighter">{words[currentIdx]?.translation || 'Loading...'}</h3>
       </div>
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 w-full max-w-3xl">
          {options.map((opt, i) => (
            <button key={i} onClick={() => handlePick(opt)} className="bg-white border-2 border-slate-100 p-6 lg:p-10 rounded-[2rem] lg:rounded-[3rem] text-xl lg:text-3xl font-black text-slate-700 hover:bg-amber-400 hover:text-white hover:border-amber-400 hover:scale-105 transition-all shadow-xl">{opt}</button>
          ))}
       </div>
    </div>
  );
};

const UnscrambleGame = () => {
  const sentences = [
    { text: "I love learning English with my teacher", words: ["I", "love", "learning", "English", "with", "my", "teacher"] },
    { text: "The quick brown fox jumps over dog", words: ["The", "quick", "brown", "fox", "jumps", "over", "dog"] }
  ];
  const [idx, setIdx] = useState(0);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const [current, setCurrent] = useState<string[]>([]);

  useEffect(() => {
    setShuffled([...sentences[idx].words].sort(() => Math.random() - 0.5));
    setCurrent([]);
  }, [idx]);

  const check = () => {
    if (current.join(" ") === sentences[idx].text) {
      announceTTS("Grammar Perfect!");
      if (idx < sentences.length - 1) setIdx(idx + 1);
      else alert("Mastered all levels!");
    } else {
      announceTTS("Incorrect sequence.");
      setShuffled([...sentences[idx].words].sort(() => Math.random() - 0.5));
      setCurrent([]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12 lg:space-y-16 p-4">
       <div className="flex flex-wrap gap-2 lg:gap-4 p-6 lg:p-12 bg-slate-50 border-2 lg:border-4 border-dashed border-slate-200 rounded-[2rem] lg:rounded-[4rem] w-full max-w-5xl min-h-[120px] items-center justify-center">
          {current.map((w, i) => <span key={i} className="px-4 lg:px-8 py-2 lg:py-4 bg-indigo-600 text-white rounded-xl lg:rounded-3xl font-black text-sm lg:text-xl shadow-lg animate-in zoom-in">{w}</span>)}
       </div>
       <div className="flex flex-wrap gap-2 lg:gap-4 justify-center">
          {shuffled.map((w, i) => <button key={i} onClick={() => { setCurrent([...current, w]); setShuffled(shuffled.filter((_, d) => d !== i)); }} className="px-4 lg:px-8 py-2 lg:py-4 bg-white border-2 border-slate-100 text-slate-800 rounded-xl lg:rounded-3xl font-black text-xs lg:text-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all">{w}</button>)}
       </div>
       <div className="flex gap-4">
          <button onClick={() => { setShuffled([...sentences[idx].words].sort(() => Math.random() - 0.5)); setCurrent([]); }} className="px-6 lg:px-12 py-3 lg:py-5 bg-slate-200 text-slate-600 rounded-[2rem] font-black text-sm lg:text-xl shadow-lg">Reset</button>
          <button onClick={check} className="px-6 lg:px-12 py-3 lg:py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm lg:text-xl shadow-2xl hover:bg-black transition-all">Check Answer</button>
       </div>
    </div>
  );
};

export default Toolbox;
