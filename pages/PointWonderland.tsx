
import React, { useState, useMemo } from 'react';
import { Student, UserRole, ActivityLog } from '../types.ts';
import { announceTTS } from '../services/geminiService.ts';

interface PointWonderlandProps {
  students: Student[];
  userRole: UserRole;
  userStudentIds?: string[];
  activeClassId: string | null;
  activityLogs: ActivityLog[];
  onUpdatePoints: (studentId: string, amount: number, reason?: string) => void;
  onUpdateMetrics: (studentId: string, updates: Partial<Student['metrics']>) => void;
}

const PointWonderland: React.FC<PointWonderlandProps> = ({ 
  students, userRole, userStudentIds, activeClassId, activityLogs, onUpdatePoints, onUpdateMetrics
}) => {
  const isParent = userRole === UserRole.PARENT;
  const isAdminOrTeacher = userRole !== UserRole.PARENT;

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [randoming, setRandoming] = useState(false);
  const [luckyStudentId, setLuckyStudentId] = useState<string | null>(null);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);

  // Parent State: Date range filtering
  const [dateRange, setDateRange] = useState<'WEEK' | 'MONTH' | 'ALL'>('WEEK');

  // Basic Filter: Teachers see class, Parents see their specific kids
  const filteredStudents = useMemo(() => {
    if (isParent) {
      return students.filter(s => userStudentIds?.includes(s.id));
    }
    return students.filter(s => s.classId === activeClassId);
  }, [students, isParent, userStudentIds, activeClassId]);

  const groups = useMemo(() => Array.from(new Set(filteredStudents.map(s => s.groupId))), [filteredStudents]);

  // Point History Filtering for Parents
  const childLogs = useMemo(() => {
    if (!isParent || filteredStudents.length === 0) return [];
    const childNames = filteredStudents.map(s => s.name);
    const logs = activityLogs.filter(log => childNames.some(name => log.target.includes(name)));
    
    const now = new Date();
    let startDate = new Date(0);
    if (dateRange === 'WEEK') startDate = new Date(now.setDate(now.getDate() - 7));
    else if (dateRange === 'MONTH') startDate = new Date(now.setMonth(now.getMonth() - 1));

    return logs.filter(log => new Date(log.timestamp) >= startDate);
  }, [isParent, filteredStudents, activityLogs, dateRange]);

  const handleReward = async (student: Student, amount: number, reason: string) => {
    if (isParent) return; 
    onUpdatePoints(student.id, amount, reason);
    if (amount > 0) {
      await announceTTS(`${student.englishName} earned ${amount} stars for ${reason}!`);
    } else {
      await announceTTS(`${student.englishName} alerted for ${reason}.`);
    }
    setIsMagicModalOpen(false);
    setLuckyStudentId(null);
  };

  const pickRandomStudent = () => {
    if (filteredStudents.length === 0 || randoming || isParent) return;
    setRandoming(true);
    setLuckyStudentId(null);
    setIsMagicModalOpen(false);
    
    let count = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * filteredStudents.length);
      setLuckyStudentId(filteredStudents[randomIndex].id);
      count++;
      if (count > 25) {
        clearInterval(interval);
        setRandoming(false);
        const lucky = filteredStudents.find(s => s.id === luckyStudentId);
        if (lucky) {
          announceTTS(`Magic Pick! ${lucky.englishName}, are you ready?`);
          setTimeout(() => setIsMagicModalOpen(true), 600);
        }
      }
    }, 70);
  };

  const pedagogicalActions = [
    { label: '积极专注', pts: 1, color: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-600', icon: 'fa-bullseye', desc: '坐姿端正且有眼神交流' },
    { label: '英语流利', pts: 2, color: 'text-blue-600 bg-blue-50 hover:bg-blue-600', icon: 'fa-language', desc: '使用完整英语句子回答' },
    { label: '活跃参与', pts: 3, color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-600', icon: 'fa-hand-sparkles', desc: '积极举手并参与互动' },
    { label: '逻辑表达', pts: 4, color: 'text-amber-600 bg-amber-50 hover:bg-amber-600', icon: 'fa-brain', desc: '有逻辑性或创造性的回答' },
    { label: '团队协同', pts: 5, color: 'text-rose-600 bg-rose-50 hover:bg-rose-600', icon: 'fa-users-rays', desc: '乐于助人或在小组中担任核心' },
  ];

  if (isParent) {
    const kid = filteredStudents[0];
    if (!kid) return <div className="p-20 text-center text-slate-300">暂无关联学员档案</div>;

    return (
      <div className="space-y-8 pb-20 animate-in fade-in duration-700">
        {/* Kid Hero Card */}
        <div className="bg-white p-10 lg:p-14 rounded-[4.5rem] border shadow-sm flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
           <div className="relative">
              <img src={kid.avatar} className="w-48 h-48 rounded-[3.5rem] object-cover border-8 border-slate-50 shadow-2xl relative z-10" alt="" />
              <div className="absolute -inset-4 bg-indigo-600/10 blur-2xl rounded-full"></div>
           </div>
           <div className="flex-1 text-center md:text-left relative z-10">
              <h2 className="text-5xl font-black text-slate-800 tracking-tighter mb-4">{kid.englishName} 的成长足迹</h2>
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                 <div className="bg-indigo-600 text-white px-8 py-4 rounded-3xl flex items-center gap-4 shadow-xl shadow-indigo-100">
                    <i className="fas fa-star text-2xl"></i>
                    <div>
                      <p className="text-3xl font-black leading-none">{kid.points}</p>
                      <p className="text-[10px] font-black uppercase opacity-60 mt-1">Total Points</p>
                    </div>
                 </div>
                 <div className="bg-emerald-50 text-emerald-600 px-8 py-4 rounded-3xl flex items-center gap-4 border border-emerald-100">
                    <i className="fas fa-coins text-2xl"></i>
                    <div>
                      <p className="text-3xl font-black leading-none">{kid.coins}</p>
                      <p className="text-[10px] font-black uppercase opacity-60 mt-1">Magic Coins</p>
                    </div>
                 </div>
              </div>
           </div>
           <div className="flex bg-slate-100 p-2 rounded-2xl border">
              {(['WEEK', 'MONTH', 'ALL'] as const).map(t => (
                <button key={t} onClick={() => setDateRange(t)} className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all ${dateRange === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                  {t === 'WEEK' ? '最近7天' : t === 'MONTH' ? '本月' : '所有'}
                </button>
              ))}
           </div>
           <i className="fas fa-magic absolute -right-20 -top-20 text-[20rem] text-slate-50 rotate-12 pointer-events-none"></i>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Detailed Log Table */}
           <div className="lg:col-span-2 bg-white rounded-[4rem] border shadow-sm overflow-hidden flex flex-col">
              <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
                 <h3 className="text-xl font-black text-slate-800">点数变动明细 ({dateRange})</h3>
                 <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Audit Logs</span>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[600px] divide-y divide-slate-50">
                 {childLogs.map((log, idx) => (
                   <div key={idx} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-all">
                      <div className="flex items-center gap-6">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${log.action.includes('奖励') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <i className={`fas ${log.action.includes('奖励') ? 'fa-arrow-trend-up' : 'fa-triangle-exclamation'}`}></i>
                         </div>
                         <div>
                            <p className="font-black text-slate-800 text-lg leading-tight">{log.action}</p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                               {new Date(log.timestamp).toLocaleString()} • {log.teacherName}
                            </p>
                         </div>
                      </div>
                      <div className={`text-2xl font-black ${log.action.includes('奖励') ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {log.action.match(/\d+/)?.[0] || '0'} ⚡
                      </div>
                   </div>
                 ))}
                 {childLogs.length === 0 && (
                   <div className="py-32 text-center text-slate-300">
                      <i className="fas fa-magnifying-glass text-5xl mb-6 opacity-20"></i>
                      <p className="font-bold text-lg">该时间段内暂无活跃记录</p>
                   </div>
                 )}
              </div>
           </div>

           {/* Metrics & Analytics Dashboard */}
           <div className="space-y-8">
              <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden group">
                 <h4 className="text-2xl font-black mb-8 relative z-10">课堂表现趋势</h4>
                 <div className="space-y-8 relative z-10">
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Focus Score 专注力</span>
                          <span className="text-4xl font-black tabular-nums">{kid.metrics.focusScore}%</span>
                       </div>
                       <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 group-hover:scale-x-105 transition-transform origin-left" style={{width: `${kid.metrics.focusScore}%`}}></div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Attendance 出勤</span>
                          <span className="text-4xl font-black tabular-nums">{kid.metrics.attendanceRate}%</span>
                       </div>
                       <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 group-hover:scale-x-105 transition-transform origin-left" style={{width: `${kid.metrics.attendanceRate}%`}}></div>
                       </div>
                    </div>
                 </div>
                 <i className="fas fa-chart-line absolute -right-12 -bottom-12 text-[15rem] text-white/5 rotate-6"></i>
              </div>

              <div className="bg-white border shadow-sm p-12 rounded-[4rem] flex flex-col justify-center items-center text-center">
                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                    <i className="fas fa-shield-heart"></i>
                 </div>
                 <h4 className="text-xl font-black text-slate-800 mb-2">行为警示汇总</h4>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Behavior Monitoring</p>
                 <div className="grid grid-cols-2 gap-6 w-full">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-3xl font-black text-slate-800">{kid.metrics.callOutCount}</p>
                       <p className="text-[10px] font-black text-rose-400 uppercase mt-1">课堂违纪</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-3xl font-black text-slate-800">{kid.metrics.breakCount}</p>
                       <p className="text-[10px] font-black text-blue-400 uppercase mt-1">离座次数</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Teacher/Admin Action Grid Helper
  const ActionGrid = ({ student, isMagic = false }: { student: Student, isMagic?: boolean }) => (
    <div className="space-y-2">
       <div className={`grid ${isMagic ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-2`}>
          {pedagogicalActions.map(action => (
            <button 
              key={action.label}
              onClick={(e) => { e.stopPropagation(); handleReward(student, action.pts, action.label); }}
              className={`flex items-center justify-between px-4 py-3 rounded-2xl font-black text-[10px] transition group/btn ${action.color} border border-transparent hover:text-white hover:shadow-lg hover:scale-[1.03] active:scale-95`}
            >
              <div className="flex items-center gap-3">
                <i className={`fas ${action.icon} text-sm`}></i>
                <div className="text-left">
                  <p className="uppercase tracking-widest leading-none mb-0.5">{action.label}</p>
                  {isMagic && <p className="text-[7px] opacity-70 font-bold">{action.desc}</p>}
                </div>
              </div>
              <span className="opacity-80 group-hover/btn:opacity-100">+{action.pts}</span>
            </button>
          ))}
       </div>
    </div>
  );

  const luckyStudent = filteredStudents.find(s => s.id === luckyStudentId);

  return (
    <div className="space-y-8 pb-32">
      {/* Teacher Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl p-6 rounded-[3rem] border shadow-sm sticky top-4 z-40">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border">
          <button onClick={() => setSelectedGroup(null)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${selectedGroup === null ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            所有小组
          </button>
          {groups.sort().map(g => (
            <button key={g} onClick={() => setSelectedGroup(g)} className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${selectedGroup === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Team {g}
            </button>
          ))}
        </div>

        <button 
          disabled={!activeClassId || randoming}
          onClick={pickRandomStudent}
          className="px-12 py-4.5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4"
        >
          <i className={`fas ${randoming ? 'fa-circle-notch fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
          {randoming ? '正在魔法挑选...' : 'Magic Pick'}
        </button>
      </div>

      {!activeClassId ? (
        <div className="h-[60vh] flex flex-col items-center justify-center text-slate-200 bg-white/50 border-4 border-dashed border-slate-100 rounded-[5rem] shadow-inner">
           <i className="fas fa-map-location-dot text-7xl mb-6 opacity-20"></i>
           <p className="text-2xl font-black text-slate-800">请选择活跃班级开始点名</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
          {filteredStudents.filter(s => !selectedGroup || s.groupId === selectedGroup).map(student => (
            <div 
              key={student.id} 
              className={`bg-white rounded-[4rem] border-2 p-8 relative transition-all duration-500 ${luckyStudentId === student.id ? 'border-indigo-600 shadow-2xl scale-[1.05] z-10 ring-[15px] ring-indigo-50' : 'border-slate-50 hover:border-indigo-200 hover:shadow-2xl'}`}
            >
              <div className="flex items-center gap-5 mb-6">
                <div className="relative">
                   <img src={student.avatar} className="w-20 h-20 rounded-3xl object-cover ring-4 ring-slate-50 shadow-inner" alt="" />
                   <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-sm">LV{student.level}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-black text-slate-800 text-xl truncate leading-none mb-2">{student.englishName}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{student.name}</p>
                    <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider">T {student.groupId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100 mb-6 flex items-center justify-between shadow-inner">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                       <i className="fas fa-star text-amber-500"></i>
                    </div>
                    <span className="text-4xl font-black text-indigo-700 tracking-tighter tabular-nums">{student.points}</span>
                 </div>
              </div>

              <ActionGrid student={student} />
            </div>
          ))}
        </div>
      )}

      {/* Magic Picker Winner Modal */}
      {isMagicModalOpen && luckyStudent && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-3xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-700">
              <div className="bg-gradient-to-br from-indigo-600 via-indigo-900 to-black p-20 text-white text-center relative overflow-hidden">
                 <div className="relative z-10">
                   <div className="relative inline-block mb-10">
                      <img src={luckyStudent.avatar} className="w-56 h-56 rounded-[4rem] overflow-hidden mx-auto border-[12px] border-white/10 shadow-2xl relative z-10" alt="" />
                      <div className="absolute -inset-10 bg-indigo-500/20 blur-3xl animate-pulse"></div>
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.5em] text-indigo-300 mb-4">The Magic Choice</p>
                   <h2 className="text-6xl font-black tracking-tighter mb-4">{luckyStudent.englishName}</h2>
                   <p className="text-white/60 font-bold text-2xl uppercase tracking-widest">{luckyStudent.name} • Team {luckyStudent.groupId}</p>
                 </div>
                 <i className="fas fa-wand-sparkles absolute -left-10 -bottom-10 text-[20rem] text-white/5 -rotate-12"></i>
              </div>
              <div className="p-16 space-y-12">
                 <ActionGrid student={luckyStudent} isMagic={true} />
                 <button onClick={() => setIsMagicModalOpen(false)} className="w-full py-6 bg-slate-50 text-slate-400 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">关闭魔法窗口</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PointWonderland;
