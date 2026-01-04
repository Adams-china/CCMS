
import React, { useState, useMemo } from 'react';
import { Campus, ClassInfo, Student, ClassSchedule, UserRole, AcademicLevel } from '../types';

interface ManagementProps {
  userRole: UserRole;
  campuses: Campus[];
  classes: ClassInfo[];
  academicLevels: AcademicLevel[];
  students: Student[];
  activeCampusId: string | null;
  onUpdateCampus: (id: string | null) => void;
  onAddCampus: (c: Campus) => void;
  onDeleteCampus: (id: string) => void;
  onAddClass: (c: ClassInfo) => void;
  onUpdateClass: (c: ClassInfo) => void;
  onDeleteClass: (id: string) => void;
  onAddLevel: (lv: AcademicLevel) => void;
  onUpdateLevel: (lv: AcademicLevel) => void;
  onDeleteLevel: (id: string) => void;
  onImportStudents: (data: string) => void;
}

const Management: React.FC<ManagementProps> = ({ 
  userRole, campuses, classes, academicLevels, students, activeCampusId, onUpdateCampus,
  onAddCampus, onDeleteCampus, onAddClass, onUpdateClass, onDeleteClass, 
  onAddLevel, onUpdateLevel, onDeleteLevel, onImportStudents 
}) => {
  const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;
  const isCampusAdmin = userRole === UserRole.CAMPUS_ADMIN;
  const isTeacher = userRole === UserRole.TEACHER;
  
  // 教师默认只能看到班级和导入
  const [activeSubTab, setActiveSubTab] = useState<'level' | 'campus' | 'class' | 'student'>(
    isTeacher ? 'class' : (isSuperAdmin ? 'level' : 'class')
  );

  const [classSearch, setClassSearch] = useState('');

  // 状态管理
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [campusForm, setCampusForm] = useState({ name: '', address: '', contact: '' });

  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classForm, setClassForm] = useState({ name: '', campusId: '', capacity: 15, level: 'Beginner' });
  const [schedules, setSchedules] = useState<ClassSchedule[]>([{ day: 1, startTime: '18:00', endTime: '19:30' }]);

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; type: 'CAMPUS' | 'CLASS'; id: string; name: string } | null>(null);
  const [importText, setImportText] = useState('');

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const matchesCampus = !activeCampusId || c.campusId === activeCampusId;
      const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase());
      return matchesCampus && matchesSearch;
    });
  }, [classes, activeCampusId, classSearch]);

  const handleSaveClass = () => {
    if (!classForm.name || !classForm.campusId) return;
    const classData: ClassInfo = {
      id: editingClassId || `cl-${Date.now()}`,
      campusId: classForm.campusId,
      name: classForm.name,
      capacity: classForm.capacity,
      level: classForm.level,
      schedules: schedules
    };
    if (editingClassId) onUpdateClass(classData);
    else onAddClass(classData);
    setShowClassModal(false);
  };

  const getDayName = (day: number) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 顶部标签切换器 */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex bg-white/70 backdrop-blur-xl p-1.5 rounded-[2rem] border shadow-sm w-fit overflow-x-auto no-scrollbar">
          {!isTeacher && isSuperAdmin && (
            <button onClick={() => setActiveSubTab('level')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'level' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              学术级别定义
            </button>
          )}
          {!isTeacher && (isSuperAdmin || isCampusAdmin) && (
            <button onClick={() => setActiveSubTab('campus')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'campus' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              校区矩阵管理
            </button>
          )}
          <button onClick={() => setActiveSubTab('class')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'class' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            班级档案管理
          </button>
          <button onClick={() => setActiveSubTab('student')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSubTab === 'student' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            批量学员导入
          </button>
        </div>
      </div>

      {/* 学术级别模块 (管理员专用) */}
      {activeSubTab === 'level' && !isTeacher && (
        <div className="space-y-10">
           <div className="flex justify-between items-end">
              <div>
                <h3 className="text-3xl font-black text-slate-800">学术课程体系</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">定义标准化级别与建议课时</p>
              </div>
              <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                 <i className="fas fa-plus"></i> 创建级别
              </button>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {academicLevels.map(lv => (
                <div key={lv.id} className="bg-white p-8 rounded-[3rem] border shadow-sm">
                   <h4 className="text-xl font-black text-slate-800 mb-2">{lv.name}</h4>
                   <p className="text-3xl font-black text-indigo-600">{lv.lessonsCount} <span className="text-sm text-slate-300">课时</span></p>
                   <div className="mt-4 flex gap-2">
                      <span className="text-[9px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-md uppercase tracking-tight">{lv.durationCategory}</span>
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md uppercase tracking-tight">{lv.season}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 校区矩阵模块 (管理员专用) */}
      {activeSubTab === 'campus' && !isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <button 
            onClick={() => setShowCampusModal(true)}
            className="bg-white border-4 border-dashed border-slate-100 p-12 rounded-[3.5rem] flex flex-col items-center justify-center gap-6 text-slate-300 hover:border-indigo-400 hover:text-indigo-600 transition-all h-full"
          >
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl"><i className="fas fa-plus"></i></div>
            <p className="font-black text-xs uppercase tracking-widest">新建校区据点</p>
          </button>
          {campuses.map(c => (
            <div key={c.id} className={`bg-white p-10 rounded-[3.5rem] border shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between ${activeCampusId === c.id ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-100'}`}>
              <div>
                <div className="flex justify-between items-start mb-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${activeCampusId === c.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-indigo-50 text-indigo-600'}`}>
                      <i className="fas fa-building"></i>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => onUpdateCampus(c.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeCampusId === c.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white'}`}>
                        {activeCampusId === c.id ? '已选中' : '选择'}
                      </button>
                      <button onClick={() => onDeleteCampus(c.id)} className="w-9 h-9 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all"><i className="fas fa-trash-can text-sm"></i></button>
                   </div>
                </div>
                <h4 className="text-2xl font-black text-slate-800 mb-1">{c.name}</h4>
                <p className="text-xs text-slate-400 font-bold"><i className="fas fa-location-dot mr-1"></i> {c.address}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 班级档案模块 (教师可用) */}
      {activeSubTab === 'class' && (
        <div className="space-y-10">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
             <div>
               <h3 className="text-3xl font-black text-slate-800">班级档案矩阵</h3>
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">查看与管理校区下所有活跃班级单位</p>
             </div>
             <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="搜索班级名称..." 
                  className="bg-white border px-6 py-3 rounded-2xl text-xs font-bold outline-indigo-500 w-64 shadow-sm"
                  value={classSearch}
                  onChange={e => setClassSearch(e.target.value)}
                />
                <button 
                  onClick={() => { setEditingClassId(null); setClassForm({ name: '', campusId: activeCampusId || campuses[0]?.id || '', capacity: 15, level: 'Beginner' }); setShowClassModal(true); }}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-3"
                >
                  <i className="fas fa-plus"></i> 新建教学单元
                </button>
             </div>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {filteredClasses.map(cls => (
               <div key={cls.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col justify-between">
                 <div>
                    <div className="flex justify-between items-start mb-6">
                       <span className="text-[10px] font-black bg-indigo-50 text-indigo-500 px-3 py-1 rounded-lg uppercase tracking-widest">
                         {campuses.find(cp => cp.id === cls.campusId)?.name || '未选校区'}
                       </span>
                       <div className="flex gap-2">
                         <button onClick={() => { setEditingClassId(cls.id); setClassForm({ ...cls }); setSchedules(cls.schedules); setShowClassModal(true); }} className="text-slate-300 hover:text-indigo-600 transition-colors"><i className="fas fa-pen-to-square"></i></button>
                         <button onClick={() => onDeleteClass(cls.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><i className="fas fa-trash-can"></i></button>
                       </div>
                    </div>
                    <h5 className="text-xl font-black text-slate-800 mb-4">{cls.name}</h5>
                    <div className="space-y-2">
                       {cls.schedules.map((s, i) => (
                         <div key={i} className="bg-slate-50 px-4 py-2 rounded-xl flex items-center justify-between text-[11px] font-black text-slate-600">
                            <span className="text-indigo-500">{getDayName(s.day)}</span>
                            <span>{s.startTime} - {s.endTime}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* 学员导入模块 (教师可用) */}
      {activeSubTab === 'student' && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white p-12 lg:p-16 rounded-[4.5rem] shadow-sm border border-slate-100 text-center">
             <div className="w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl mx-auto mb-8 shadow-2xl">
               <i className="fas fa-file-import"></i>
             </div>
             <h3 className="text-3xl font-black text-slate-800 mb-4">学员档案批量同步</h3>
             <p className="text-slate-400 font-bold mb-10 text-sm">支持跨班级、跨校区的学员信息快速录入。请按照姓名、英文名、家长手机号的顺序进行粘贴。</p>
             <textarea 
              className="w-full h-80 bg-slate-900 rounded-[2.5rem] p-10 font-mono text-emerald-400 text-sm outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-700 leading-relaxed"
              placeholder={`/* 格式: 姓名, 英文名, 手机号 */\n张三, Kevin, 13811112222\n李四, Lily, 13833334444`}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
             />
             <div className="mt-10 flex gap-4 justify-center">
               <button 
                onClick={() => { onImportStudents(importText); setImportText(''); alert('导入成功'); }}
                className="px-12 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
               >
                 立即确认导入
               </button>
             </div>
          </div>
        </div>
      )}

      {/* 班级编辑弹窗 */}
      {showClassModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4rem] p-12 w-full max-w-3xl shadow-2xl animate-in zoom-in-95">
              <h3 className="text-3xl font-black text-slate-800 mb-10">{editingClassId ? '修改教学档案' : '新建教学单元'}</h3>
              <div className="grid grid-cols-2 gap-8 mb-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">班级名称</label>
                    <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" placeholder="如: 启蒙A班" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">归属校区</label>
                    <select className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" value={classForm.campusId} onChange={e => setClassForm({...classForm, campusId: e.target.value})}>
                      <option value="">-- 请选择校区 --</option>
                      {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center ml-4 mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">排课方案 (支持多时段)</label>
                    <button onClick={() => setSchedules([...schedules, { day: 1, startTime: '18:00', endTime: '19:30' }])} className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">新增排课</button>
                 </div>
                 <div className="max-h-60 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    {schedules.map((s, idx) => (
                      <div key={idx} className="flex gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 items-center">
                          <select className="flex-1 bg-white border-0 ring-1 ring-slate-100 p-4 rounded-xl font-black text-xs" value={s.day} onChange={e => {
                            const ns = [...schedules]; ns[idx].day = parseInt(e.target.value); setSchedules(ns);
                          }}>
                             {[1,2,3,4,5,6,0].map(d => <option key={d} value={d}>{getDayName(d)}</option>)}
                          </select>
                          <input type="time" className="flex-1 bg-white border-0 ring-1 ring-slate-100 p-4 rounded-xl font-black text-xs" value={s.startTime} onChange={e => {
                            const ns = [...schedules]; ns[idx].startTime = e.target.value; setSchedules(ns);
                          }} />
                          <span className="text-slate-300 font-black">至</span>
                          <input type="time" className="flex-1 bg-white border-0 ring-1 ring-slate-100 p-4 rounded-xl font-black text-xs" value={s.endTime} onChange={e => {
                            const ns = [...schedules]; ns[idx].endTime = e.target.value; setSchedules(ns);
                          }} />
                          <button onClick={() => setSchedules(schedules.filter((_, i) => i !== idx))} className="text-rose-500 hover:scale-110 transition-transform"><i className="fas fa-trash-can"></i></button>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 mt-12">
                 <button onClick={() => setShowClassModal(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs">暂不保存</button>
                 <button onClick={handleSaveClass} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-indigo-100">保存档案</button>
              </div>
           </div>
        </div>
      )}

      {/* 校区新建弹窗 */}
      {showCampusModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[4rem] p-12 w-full max-w-xl shadow-2xl animate-in zoom-in-95">
              <h3 className="text-3xl font-black text-slate-800 mb-10">建立教育校区</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">校区名称</label>
                    <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" placeholder="如: 杭州城西旗舰中心" value={campusForm.name} onChange={e => setCampusForm({...campusForm, name: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">物理地址</label>
                    <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" placeholder="详细街道与门牌号" value={campusForm.address} onChange={e => setCampusForm({...campusForm, address: e.target.value})} />
                 </div>
              </div>
              <div className="flex gap-4 mt-12">
                 <button onClick={() => setShowCampusModal(false)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs">取消</button>
                 <button onClick={() => { onAddCampus({ id: `cp-${Date.now()}`, ...campusForm, status: 'ACTIVE', createdAt: new Date().toISOString() }); setShowCampusModal(false); }} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">立即建立校区</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Management;
