
import React, { useState, useMemo } from 'react';
import { AppState, Student, DictationResult, ActivityLog } from '../types';

interface ClassArchivesProps {
  state: AppState;
}

const ClassArchives: React.FC<ClassArchivesProps> = ({ state }) => {
  const { students, activeClassId, classes, dictationResults, activityLogs } = state;
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const activeClass = useMemo(() => classes.find(c => c.id === activeClassId), [classes, activeClassId]);
  
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.classId === activeClassId);
  }, [students, activeClassId]);

  const selectedStudent = useMemo(() => {
    return students.find(s => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const studentRank = useMemo(() => {
    if (!selectedStudentId) return 0;
    const sorted = [...filteredStudents].sort((a, b) => b.points - a.points);
    return sorted.findIndex(s => s.id === selectedStudentId) + 1;
  }, [filteredStudents, selectedStudentId]);

  const studentDictations = useMemo(() => {
    return dictationResults.filter(r => r.studentId === selectedStudentId).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }, [dictationResults, selectedStudentId]);

  if (!activeClassId) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-slate-300">
        <i className="fas fa-folder-tree text-8xl mb-6 opacity-20"></i>
        <h3 className="text-2xl font-black text-slate-800">请先在侧边栏选择一个班级</h3>
        <p className="mt-2 font-bold uppercase tracking-widest text-xs">Awaiting class selection context</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-32 animate-in fade-in duration-500">
      {/* 班级统计顶栏 */}
      <div className="bg-white p-8 rounded-[3.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl shadow-xl shadow-indigo-100">
            <i className="fas fa-users-rectangle"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{activeClass?.name}</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Class Archives Management</p>
          </div>
        </div>
        <div className="flex gap-4">
           <div className="bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">学员总数</p>
              <p className="text-2xl font-black text-slate-800">{filteredStudents.length}</p>
           </div>
           <div className="bg-indigo-50 px-8 py-4 rounded-3xl border border-indigo-100 text-center">
              <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">班级活跃度</p>
              <p className="text-2xl font-black text-indigo-600">High</p>
           </div>
        </div>
      </div>

      {/* 学员网格展示 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
        {filteredStudents.map(student => (
          <button 
            key={student.id}
            onClick={() => setSelectedStudentId(student.id)}
            className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-105 hover:border-indigo-400 transition-all flex flex-col items-center group relative overflow-hidden"
          >
             <div className="relative mb-6">
                <img src={student.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-slate-50 shadow-inner group-hover:rotate-6 transition-transform" alt="" />
                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-lg border-2 border-white shadow-sm uppercase tracking-tighter">
                  {student.id}
                </div>
             </div>
             <h4 className="font-black text-slate-800 text-lg mb-1">{student.englishName}</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.name}</p>
             <i className="fas fa-fingerprint absolute -right-4 -bottom-4 text-6xl text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></i>
          </button>
        ))}
      </div>

      {/* 学员详情侧滑面板 */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex justify-end">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedStudentId(null)} />
           <div className="relative w-full max-w-4xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar flex flex-col">
              {/* 档案头部 */}
              <div className="bg-slate-950 p-12 text-white relative overflow-hidden">
                 <button onClick={() => setSelectedStudentId(null)} className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
                   <i className="fas fa-times"></i>
                 </button>
                 <div className="flex items-center gap-10 relative z-10">
                    <img src={selectedStudent.avatar} className="w-40 h-40 rounded-[3rem] border-8 border-white/10 shadow-2xl" alt="" />
                    <div>
                       <div className="flex items-center gap-4 mb-3">
                          <h2 className="text-5xl font-black tracking-tighter">{selectedStudent.englishName}</h2>
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 ${selectedStudent.gender === 'MALE' ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'}`}>
                            {selectedStudent.gender}
                          </span>
                       </div>
                       <p className="text-slate-400 font-bold text-xl mb-6">{selectedStudent.name} • Magic ID: <span className="text-indigo-400">{selectedStudent.id}</span></p>
                       <div className="flex gap-3">
                          <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Team {selectedStudent.groupId}</span>
                          <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Level {selectedStudent.level}</span>
                          <span className="bg-white/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10">Rank #{studentRank}</span>
                       </div>
                    </div>
                 </div>
                 <i className="fas fa-id-card absolute -left-20 -bottom-20 text-[25rem] text-white/5 -rotate-12"></i>
              </div>

              {/* 档案主体 - 四大维度 */}
              <div className="flex-1 p-12 space-y-12">
                 {/* 维度1: 基础档案 */}
                 <section>
                    <div className="flex items-center gap-3 mb-8">
                       <i className="fas fa-address-book text-indigo-600 text-xl"></i>
                       <h3 className="text-xl font-black text-slate-800">基础行政档案 (Admin Profile)</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {[
                         { label: '家长电话', value: selectedStudent.parentPhone, icon: 'fa-phone' },
                         { label: '出生日期', value: selectedStudent.birthday || '未录入', icon: 'fa-cake-candles' },
                         { label: '入校日期', value: new Date(selectedStudent.enrollmentDate).toLocaleDateString(), icon: 'fa-calendar-days' },
                         { label: '剩余课时', value: `${selectedStudent.paidHours} / 40`, icon: 'fa-clock' }
                       ].map((item, i) => (
                         <div key={i} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all">
                            <div className="flex items-center gap-3 text-slate-400 mb-2">
                               <i className={`fas ${item.icon} text-xs`}></i>
                               <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            </div>
                            <p className="text-lg font-black text-slate-800">{item.value}</p>
                         </div>
                       ))}
                    </div>
                 </section>

                 {/* 维度2: 学术成绩表现 */}
                 <section>
                    <div className="flex items-center gap-3 mb-8">
                       <i className="fas fa-graduation-cap text-indigo-600 text-xl"></i>
                       <h3 className="text-xl font-black text-slate-800">学术表现轨迹 (Academic Trajectory)</h3>
                    </div>
                    <div className="bg-white border rounded-[3rem] overflow-hidden shadow-sm">
                       <table className="w-full text-left">
                          <thead className="bg-slate-50">
                             <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-8 py-5">考核类型</th>
                                <th className="px-8 py-5">考核名称/关卡</th>
                                <th className="px-8 py-5">成绩结果</th>
                                <th className="px-8 py-5">完成日期</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y text-sm">
                             {studentDictations.map(res => (
                               <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-8 py-5 font-black text-indigo-500 text-xs">听写考核</td>
                                  <td className="px-8 py-5 font-bold text-slate-700">{res.listId}</td>
                                  <td className="px-8 py-5">
                                     <span className={`px-3 py-1 rounded-lg font-black ${res.score >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                       {res.score} ⚡
                                     </span>
                                  </td>
                                  <td className="px-8 py-5 text-slate-400 font-medium">{new Date(res.completedAt).toLocaleDateString()}</td>
                               </tr>
                             ))}
                             {studentDictations.length === 0 && (
                               <tr>
                                  <td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">暂无正式考核成绩记录</td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </section>

                 {/* 维度3: 行为点数分析 */}
                 <section>
                    <div className="flex items-center gap-3 mb-8">
                       <i className="fas fa-chart-line text-indigo-600 text-xl"></i>
                       <h3 className="text-xl font-black text-slate-800">课堂行为大数据 (Behavioral Insight)</h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                       <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 flex flex-col justify-between">
                          <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">当前荣誉等级</p>
                            <h4 className="text-4xl font-black text-indigo-700">LV.{selectedStudent.level} <span className="text-lg font-bold opacity-60 ml-2">({selectedStudent.points} 点)</span></h4>
                          </div>
                          <div className="mt-10 h-3 bg-white rounded-full overflow-hidden border border-indigo-100">
                             <div className="h-full bg-indigo-500 shadow-lg" style={{ width: '75%' }} />
                          </div>
                       </div>
                       <div className="p-10 bg-slate-900 text-white rounded-[3rem] shadow-xl">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">关键指标雷达</p>
                          <div className="space-y-4">
                             {[
                               { label: '专注度', value: selectedStudent.metrics.focusScore, color: 'bg-emerald-400' },
                               { label: '出勤率', value: selectedStudent.metrics.attendanceRate, color: 'bg-blue-400' },
                               { label: '互动频率', value: 85, color: 'bg-amber-400' }
                             ].map((m, i) => (
                               <div key={i} className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-black uppercase">
                                     <span>{m.label}</span>
                                     <span>{m.value}%</span>
                                  </div>
                                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                     <div className={`h-full ${m.color}`} style={{ width: `${m.value}%` }} />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </section>

                 {/* 维度4: 个性化备注 */}
                 <section className="pb-20">
                    <div className="flex items-center gap-3 mb-8">
                       <i className="fas fa-comment-medical text-indigo-600 text-xl"></i>
                       <h3 className="text-xl font-black text-slate-800">教师寄语与档案笔记 (Teacher's Notes)</h3>
                    </div>
                    <textarea 
                      className="w-full h-48 bg-slate-50 border-0 ring-1 ring-slate-100 rounded-[2.5rem] p-8 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all leading-relaxed"
                      placeholder="在此录入该学员的个性化成长建议、课后沟通记录等..."
                      value={selectedStudent.notes || ''}
                    ></textarea>
                 </section>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClassArchives;
