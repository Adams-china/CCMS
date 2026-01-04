
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { AppState, UserRole, Student } from '../types.ts';

interface DashboardProps {
  state: AppState;
  onBindStudent?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onBindStudent }) => {
  const { user, students, activityLogs, messages, resources } = state;
  const isParent = user?.role === UserRole.PARENT;

  // 家长绑定的所有孩子
  const myChildren = useMemo(() => {
    return isParent ? students.filter(s => user.studentIds?.includes(s.id)) : [];
  }, [isParent, students, user]);

  // 当前选中的查看对象（默认第一个孩子）
  const [selectedChildId, setSelectedChildId] = useState<string | null>(myChildren[0]?.id || null);
  const activeChild = useMemo(() => myChildren.find(c => c.id === selectedChildId) || myChildren[0], [myChildren, selectedChildId]);

  // 绑定弹窗状态
  const [showBindModal, setShowBindModal] = useState(false);
  const [bindCode, setBindCode] = useState('');
  const [bindError, setBindError] = useState('');

  const stats = useMemo(() => {
    if (isParent && activeChild) {
      return [
        { label: '累计点数', value: activeChild.points, icon: 'fa-star', color: 'bg-indigo-600', unit: 'Pts' },
        { label: '魔法金币', value: activeChild.coins, icon: 'fa-coins', color: 'bg-emerald-500', unit: 'Coins' },
        { label: '当前等级', value: `Lv.${activeChild.level}`, icon: 'fa-medal', color: 'bg-amber-500', unit: 'Rank' },
        { label: '已修课时', value: activeChild.totalHours, icon: 'fa-clock', color: 'bg-rose-500', unit: 'Hrs' },
      ];
    }
    return [
      { label: '在读学员', value: students.length, icon: 'fa-user-graduate', color: 'bg-indigo-600', unit: 'Pers' },
      { label: '活跃校区', value: state.campuses.length, icon: 'fa-city', color: 'bg-emerald-500', unit: 'Sites' },
      { label: '未读消息', value: messages.filter(m => !m.isRead && m.recipientId === user?.id).length, icon: 'fa-envelope', color: 'bg-rose-500', unit: 'Msgs' },
      { label: '资源沉淀', value: resources.length, icon: 'fa-book-open', color: 'bg-amber-500', unit: 'Files' },
    ];
  }, [isParent, activeChild, students, state.campuses, messages, resources, user]);

  const chartData = [
    { n: 'Mon', v: isParent ? 5 : 45 }, 
    { n: 'Tue', v: isParent ? 12 : 52 }, 
    { n: 'Wed', v: isParent ? 8 : 48 }, 
    { n: 'Thu', v: isParent ? 15 : 61 }, 
    { n: 'Fri', v: isParent ? 20 : 55 }, 
    { n: 'Sat', v: isParent ? 18 : 40 }
  ];

  const handleBind = () => {
    setBindError('');
    try {
      if (onBindStudent) {
        onBindStudent(bindCode.trim());
        setShowBindModal(false);
        setBindCode('');
      }
    } catch (e: any) {
      setBindError(e.message);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4 px-2">
        <div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">
             {isParent ? `家庭成长中心` : '校区智慧中枢'}
           </h1>
           <p className="text-sm text-slate-400 font-bold uppercase tracking-[0.3em]">
             {isParent ? `您已绑定 ${myChildren.length} 位学员` : '全校区实时数据概览'}
           </p>
        </div>
        
        {isParent && (
          <button 
            onClick={() => setShowBindModal(true)}
            className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-3"
          >
            <i className="fas fa-plus"></i> 绑定新成员
          </button>
        )}
      </div>

      {isParent && myChildren.length > 1 && (
        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
           {myChildren.map(child => (
             <button 
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-4 p-4 rounded-[2.5rem] border-2 transition-all min-w-[240px] ${selectedChildId === child.id ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white border-transparent'}`}
             >
                <img src={child.avatar} className="w-12 h-12 rounded-2xl shadow-sm" alt="" />
                <div className="text-left">
                  <p className="font-black text-slate-800 leading-none mb-1">{child.englishName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{child.name}</p>
                </div>
                {selectedChildId === child.id && <i className="fas fa-check-circle text-indigo-500 ml-auto"></i>}
             </button>
           ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all group overflow-hidden relative">
            <div className="relative z-10 flex justify-between items-start mb-10">
               <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100 group-hover:rotate-12 transition-transform`}>
                 <i className={`fas ${stat.icon}`}></i>
               </div>
               <span className="text-[9px] font-black bg-slate-50 text-slate-300 px-3 py-1 rounded-lg border group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{stat.unit}</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
            </div>
            <i className={`fas ${stat.icon} absolute -right-8 -bottom-8 text-9xl text-slate-50 opacity-0 group-hover:opacity-100 transition-all pointer-events-none`}></i>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden group">
           <div className="flex justify-between items-center mb-10">
             <div>
               <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                 <i className="fas fa-chart-area text-indigo-600"></i>
                 {isParent ? `${activeChild?.englishName} 的成长曲线` : '全网活跃度分析'}
               </h3>
               <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1 ml-8">基于最近 7 个教学周期</p>
             </div>
           </div>
           <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 11}} />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                />
                <Area type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={5} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                 <h3 className="text-2xl font-black text-white tracking-tight mb-2">魔法收件箱</h3>
                 <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-8">Interaction & Alerts</p>
                 <div className="space-y-5">
                   {messages.filter(m => m.recipientId === user?.id).slice(0, 3).map(m => (
                     <div key={m.id} className="p-5 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/item cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-black text-indigo-400 uppercase">{m.senderName}</span>
                           <span className="text-[9px] text-slate-500">{new Date(m.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-medium line-clamp-2">{m.content}</p>
                     </div>
                   ))}
                 </div>
              </div>
              <button className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">进入消息中心</button>
              <i className="fas fa-paper-plane absolute -right-10 -bottom-10 text-[12rem] text-white/5 rotate-12 group-hover:rotate-0 transition-all"></i>
           </div>
        </div>
      </div>

      {/* Bind Modal */}
      {showBindModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4.5rem] p-16 w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-2xl shadow-indigo-100">
                <i className="fas fa-link"></i>
              </div>
              <h3 className="text-3xl font-black text-slate-800 text-center tracking-tight mb-2">建立魔法契约</h3>
              <p className="text-slate-400 font-bold text-center uppercase tracking-widest text-[10px] mb-12">Enter Student Magic Code</p>
              
              <div className="space-y-4">
                 <input 
                  className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-6 rounded-3xl font-black text-center text-2xl text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-200" 
                  placeholder="如: S-1234"
                  value={bindCode}
                  onChange={e => setBindCode(e.target.value)}
                 />
                 {bindError && <p className="text-rose-500 text-xs font-bold text-center animate-bounce">{bindError}</p>}
              </div>

              <div className="flex gap-4 mt-12">
                 <button onClick={() => setShowBindModal(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-3xl font-black uppercase text-xs">取消</button>
                 <button onClick={handleBind} className="flex-1 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs shadow-xl shadow-indigo-100">确认绑定</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
