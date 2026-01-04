
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Cell, Legend
} from 'recharts';
import { AppState, UserRole } from '../types.ts';

interface ReportsProps {
  state: AppState;
}

const Reports: React.FC<ReportsProps> = ({ state }) => {
  const { user, students, activityLogs, activeClassId } = state;
  const role = user?.role || UserRole.PARENT;
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'LOGS'>('ANALYTICS');
  const [timeRange, setTimeRange] = useState<'WEEK' | 'MONTH' | 'ALL'>('WEEK');

  const filteredStudents = useMemo(() => {
    if (role === UserRole.SUPER_ADMIN) return students;
    if (role === UserRole.CAMPUS_ADMIN) return students.filter(s => s.campusId === user?.campusId);
    if (role === UserRole.TEACHER) {
      if (activeClassId && user?.classIds?.includes(activeClassId)) {
        return students.filter(s => s.classId === activeClassId);
      }
      return students.filter(s => user?.classIds?.includes(s.classId));
    }
    if (role === UserRole.PARENT) return students.filter(s => user?.studentIds?.includes(s.id));
    return [];
  }, [students, user, role, activeClassId]);

  const statsSummary = useMemo(() => {
    if (filteredStudents.length === 0) return { attendance: 0, focus: 0, homework: 0, test: 0 };
    return {
      attendance: Math.round(filteredStudents.reduce((acc, s) => acc + s.metrics.attendanceRate, 0) / filteredStudents.length),
      focus: Math.round(filteredStudents.reduce((acc, s) => acc + s.metrics.focusScore, 0) / filteredStudents.length),
      homework: 92,
      test: Math.round(filteredStudents.reduce((acc, s) => acc + s.metrics.dictationAvg, 0) / filteredStudents.length),
    };
  }, [filteredStudents]);

  const skillData = [
    { subject: 'Speaking', value: 85 },
    { subject: 'Listening', value: 78 },
    { subject: 'Grammar', value: 92 },
    { subject: 'Phonics', value: 88 },
    { subject: 'Reading', value: 70 },
  ];

  const getEvaluation = (metric: string, value: number) => {
    if (value >= 90) return { label: '卓越', color: 'text-emerald-600', advice: '该指标处于行业领先水平，继续保持现状。' };
    if (value >= 75) return { label: '良好', color: 'text-indigo-600', advice: '表现稳健，可通过增加互动频率进一步提升。' };
    return { label: '需关注', color: 'text-rose-600', advice: '发现显著波动，建议进行1对1教学干预。' };
  };

  const IndicatorCard = ({ title, value, unit, icon, metricKey, color }: any) => {
    const evalData = getEvaluation(metricKey, value);
    return (
      <div className="bg-white p-8 rounded-[3rem] border shadow-sm group hover:shadow-xl transition-all duration-500">
        <div className="flex justify-between items-start mb-6">
          <div className={`w-14 h-14 ${color.bg} ${color.text} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
            <i className={`fas ${icon}`}></i>
          </div>
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${evalData.color.replace('text', 'bg').replace('600', '50')} ${evalData.color.replace('text', 'border').replace('600', '100')} ${evalData.color}`}>
            {evalData.label}
          </span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1 mb-4">
          <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{value}</h4>
          <span className="text-sm font-bold text-slate-400">{unit || ''}</span>
        </div>
        <div className="pt-4 border-t border-slate-50">
          <p className="text-[11px] leading-relaxed text-slate-500 font-medium italic">
            <i className="fas fa-lightbulb text-amber-400 mr-2"></i>
            {evalData.advice}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <i className="fas fa-chart-pie"></i>
             </div>
             {role === UserRole.PARENT ? '孩子成长情报箱' : '数据诊断中心'}
          </h2>
          <p className="text-slate-400 font-bold text-sm mt-2 ml-1">
             <i className="fas fa-shield-halved text-indigo-400 mr-2"></i>
             {role === UserRole.PARENT ? `正在查看: ${filteredStudents[0]?.englishName} 的数据` : `已根据权限过滤: ${filteredStudents.length} 名学员数据`}
          </p>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm w-full lg:w-auto">
           {role !== UserRole.PARENT && (
             <>
               <button onClick={() => setActiveTab('ANALYTICS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>学情分析</button>
               <button onClick={() => setActiveTab('LOGS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === 'LOGS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>管理日志</button>
               <div className="w-px bg-slate-100 mx-2"></div>
             </>
           )}
           {(['WEEK', 'MONTH', 'ALL'] as const).map(t => (
             <button 
                key={t}
                onClick={() => setTimeRange(t)}
                className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${timeRange === t ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
             >
               {t === 'WEEK' ? '本周' : t === 'MONTH' ? '本月' : '年度'}
             </button>
           ))}
        </div>
      </div>

      {activeTab === 'ANALYTICS' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <IndicatorCard title="出勤率" value={statsSummary.attendance} unit="%" icon="fa-calendar-check" metricKey="attendance" color={{bg: 'bg-indigo-50', text: 'text-indigo-600'}} />
            <IndicatorCard title="课堂专注度" value={statsSummary.focus} unit="%" icon="fa-brain" metricKey="focus" color={{bg: 'bg-emerald-50', text: 'text-emerald-600'}} />
            <IndicatorCard title="作业健康度" value={statsSummary.homework} unit="%" icon="fa-clipboard-check" metricKey="homework" color={{bg: 'bg-amber-50', text: 'text-amber-600'}} />
            <IndicatorCard title="听写成绩" value={statsSummary.test} unit="Pts" metricKey="test" icon="fa-spell-check" color={{bg: 'bg-rose-50', text: 'text-rose-600'}} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border shadow-sm relative overflow-hidden">
               <div className="flex justify-between items-center mb-10 relative z-10">
                  <h3 className="text-xl font-black text-slate-800">学习能力雷达 (Capability Radar)</h3>
                  <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-400">RADAR ANALYSIS</div>
               </div>
               
               <div className="h-[450px] w-full flex items-center justify-center relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 'bold'}} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                      <Radar name="Skills" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} dot={{ r: 4, fill: '#6366f1' }} />
                      <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}} />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-slate-900 p-10 rounded-[4rem] shadow-2xl flex flex-col justify-between relative overflow-hidden text-white">
               <div className="relative z-10">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl mb-8 backdrop-blur-md">
                    <i className="fas fa-sparkles text-amber-400"></i>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight mb-4">AI 专家诊断结论</h3>
                  <p className="text-indigo-200 text-xs font-black uppercase tracking-[0.3em] mb-10">AI Diagnostic Logic</p>
                  
                  <div className="space-y-6">
                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <p className="text-sm font-bold leading-relaxed">
                          分析当前 {role === UserRole.PARENT ? '孩子' : '班级'} 的成长数据：<span className="text-amber-400 underline underline-offset-4">听力理解</span> 与 <span className="text-amber-400 underline underline-offset-4">发音流利度</span> 呈现上升趋势。
                        </p>
                     </div>
                     <div className="p-6 bg-emerald-500/10 rounded-3xl border border-emerald-500/20 backdrop-blur-sm">
                        <p className="text-sm font-bold text-emerald-300">
                          💡 建议：下周在思维工具箱中使用 Story Map，进一步固化逻辑表达能力。
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'LOGS' && role !== UserRole.PARENT && (
        <div className="bg-white rounded-[3.5rem] border shadow-sm overflow-hidden animate-in zoom-in-95 duration-300 min-h-[600px] flex flex-col">
           <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                 <h3 className="text-2xl font-black text-slate-800">管理日志审计</h3>
                 <p className="text-xs font-bold text-slate-400 uppercase mt-1">Activity Monitoring & Compliance</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl border text-xs font-black text-slate-500">
                 Total Entries: {activityLogs.length}
              </div>
           </div>
           <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                       <th className="px-10 py-5">Teacher / Staff</th>
                       <th className="px-10 py-5">Action Type</th>
                       <th className="px-10 py-5">Target Detail</th>
                       <th className="px-10 py-5 text-right">Timestamp</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {activityLogs.map(log => (
                       <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-10 py-5">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-sm ${log.teacherName.includes('Sarah') ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                                   {log.teacherName[0]}
                                </div>
                                <span className="font-bold text-slate-700 text-sm">{log.teacherName}</span>
                             </div>
                          </td>
                          <td className="px-10 py-5">
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                                log.type === 'PLANNING' ? 'bg-amber-100 text-amber-700' :
                                log.type === 'UPLOAD' ? 'bg-blue-100 text-blue-700' :
                                log.type === 'FEEDBACK' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-500'
                             }`}>
                                {log.type}
                             </span>
                          </td>
                          <td className="px-10 py-5">
                             <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm">{log.action}</span>
                                <span className="text-xs text-slate-400 truncate max-w-xs">{log.target}</span>
                             </div>
                          </td>
                          <td className="px-10 py-5 text-right text-xs font-mono font-bold text-slate-400">
                             {new Date(log.timestamp).toLocaleString()}
                          </td>
                       </tr>
                    ))}
                    {activityLogs.length === 0 && (
                       <tr>
                          <td colSpan={4} className="py-20 text-center text-slate-300 italic">No activity recorded yet.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
