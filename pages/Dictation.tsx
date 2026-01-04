
import React, { useState, useMemo, useEffect } from 'react';
import { DictationList, DictationAssignment, DictationResult, DictationItemType, UserRole, UserAccount, Student, ClassInfo, DictationWord } from '../types';
import { announceTTS } from '../services/geminiService';

interface DictationProps {
  lists: DictationList[];
  assignments: DictationAssignment[];
  results: DictationResult[];
  students: Student[];
  classes: ClassInfo[];
  currentUser: UserAccount | null;
  activeClassId: string | null;
  onAddList: (list: DictationList) => void;
  onUpdateList: (list: DictationList) => void;
  onDeleteList: (id: string) => void;
  onAddAssignment: (asn: DictationAssignment) => void;
  onCompleteTest: (res: DictationResult) => void;
}

const Dictation: React.FC<DictationProps> = ({ 
  lists, assignments, results, students, classes, currentUser, activeClassId,
  onAddList, onUpdateList, onDeleteList, onAddAssignment, onCompleteTest 
}) => {
  const isTeacher = currentUser?.role !== UserRole.PARENT;
  const isParent = currentUser?.role === UserRole.PARENT;

  const [activeTab, setActiveTab] = useState<'tasks' | 'library' | 'grading' | 'reports'>(isTeacher ? 'tasks' : 'library');
  const [view, setView] = useState<'main' | 'create-list' | 'create-task' | 'practice' | 'report-detail'>('main');

  // Form States
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [listForm, setListForm] = useState({ title: '', type: 'WORD' as DictationItemType, raw: '', isPublic: true });
  const [taskForm, setTaskForm] = useState({ title: '', listId: '', classId: activeClassId || '', deadline: '' });

  // Execution States
  const [selectedList, setSelectedList] = useState<DictationList | null>(null);
  const [selectedTask, setSelectedTask] = useState<DictationAssignment | null>(null);
  const [selectedResult, setSelectedResult] = useState<DictationResult | null>(null);
  const [practiceState, setPracticeState] = useState({
    index: 0,
    input: '',
    results: [] as any[],
    done: false
  });

  const [gradingMode, setGradingMode] = useState<'STUDENT' | 'WORD'>('STUDENT');
  const [gradingFilterClass, setGradingFilterClass] = useState(activeClassId || '');
  const [reportDate, setReportDate] = useState('');

  // Deletion confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Data Logic
  // ---------------------------------------------------------------------------

  const filteredLibrary = useMemo(() => {
    if (isTeacher) return lists;
    return lists.filter(l => l.isPublic);
  }, [lists, isTeacher]);

  const activeAssignments = useMemo(() => {
    if (isTeacher) {
      return assignments.filter(a => !activeClassId || a.classId === activeClassId);
    }
    return assignments.filter(a => currentUser?.classIds?.includes(a.classId));
  }, [assignments, isTeacher, activeClassId, currentUser]);

  const userResults = useMemo(() => {
    if (isTeacher) return results;
    return results.filter(r => currentUser?.studentIds?.includes(r.studentId));
  }, [results, isTeacher, currentUser]);

  const mistakeBank = useMemo(() => {
    const mistakes = userResults.flatMap(r => r.mistakes);
    return Array.from(new Set(mistakes));
  }, [userResults]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleOpenCreateList = () => {
    setEditingListId(null);
    setListForm({ title: '', type: 'WORD', raw: '', isPublic: true });
    setView('create-list');
  };

  const handleOpenEditList = (list: DictationList) => {
    if (list.isSyllabus) return; // Fixed resource
    setEditingListId(list.id);
    setListForm({ 
      title: list.title, 
      type: list.type, 
      raw: list.words.map(w => `${w.word}, ${w.translation}`).join('\n'), 
      isPublic: list.isPublic 
    });
    setView('create-list');
  };

  const handleSaveList = () => {
    if (!listForm.title || !listForm.raw) return;
    const words: DictationWord[] = listForm.raw.split('\n').filter(l => l.trim()).map(line => {
      const [w, t] = line.split(/[,，]/);
      return { word: w?.trim(), translation: t?.trim() || '---' };
    });

    const listData: DictationList = {
      id: editingListId || `list-${Date.now()}`,
      title: listForm.title,
      type: listForm.type,
      words,
      isPublic: listForm.isPublic,
      createdAt: editingListId ? (lists.find(l => l.id === editingListId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      createdBy: editingListId ? (lists.find(l => l.id === editingListId)?.createdBy || currentUser?.id || 'sys') : (currentUser?.id || 'sys'),
      isSyllabus: false
    };

    if (editingListId) onUpdateList(listData);
    else onAddList(listData);

    setListForm({ title: '', type: 'WORD', raw: '', isPublic: true });
    setEditingListId(null);
    setView('main');
  };

  const toggleVisibility = (list: DictationList) => {
    if (list.isSyllabus) return; // Syllabus is always public by default or managed by system
    onUpdateList({ ...list, isPublic: !list.isPublic });
  };

  const handleDeleteList = () => {
    if (confirmDeleteId) {
      onDeleteList(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const handleSaveTask = () => {
    if (!taskForm.title || !taskForm.listId || !taskForm.classId) return;
    onAddAssignment({
      id: `task-${Date.now()}`,
      ...taskForm,
      teacherId: currentUser?.id || '',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });
    setView('main');
  };

  const startPractice = (list: DictationList, task?: DictationAssignment) => {
    setSelectedList(list);
    setSelectedTask(task || null);
    setPracticeState({ index: 0, input: '', results: [], done: false });
    setView('practice');
    setTimeout(() => announceTTS(list.words[0].word), 500);
  };

  const handleNextWord = () => {
    if (!selectedList) return;
    const currentWord = selectedList.words[practiceState.index].word;
    const isCorrect = practiceState.input.trim().toLowerCase() === currentWord.toLowerCase();
    
    const newResults = [...practiceState.results, {
      word: currentWord,
      input: practiceState.input,
      isCorrect
    }];

    if (practiceState.index < selectedList.words.length - 1) {
      const nextIdx = practiceState.index + 1;
      setPracticeState({
        ...practiceState,
        index: nextIdx,
        input: '',
        results: newResults
      });
      announceTTS(selectedList.words[nextIdx].word);
    } else {
      const score = Math.round((newResults.filter(r => r.isCorrect).length / selectedList.words.length) * 100);
      const student = isParent ? students.find(s => currentUser?.studentIds?.includes(s.id)) : null;

      onCompleteTest({
        id: `res-${Date.now()}`,
        studentId: student?.id || currentUser?.id || 'guest',
        studentName: student?.englishName || currentUser?.name || 'Guest',
        listId: selectedList.id,
        assignmentId: selectedTask?.id,
        score,
        details: newResults,
        mistakes: newResults.filter(r => !r.isCorrect).map(r => r.word),
        completedAt: new Date().toISOString()
      });
      setPracticeState({ ...practiceState, results: newResults, done: true });
    }
  };

  // ---------------------------------------------------------------------------
  // Sub-components
  // ---------------------------------------------------------------------------

  const ModalWrapper = ({ children, title, onClose }: any) => (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[4rem] p-10 md:p-14 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-300 my-auto">
        <div className="flex justify-between items-center mb-10">
           <h3 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h3>
           <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"><i className="fas fa-times"></i></button>
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* 顶部导航 */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex bg-white/80 backdrop-blur-xl p-1.5 rounded-[2rem] border shadow-sm w-fit overflow-x-auto no-scrollbar">
          {isTeacher && (
            <button onClick={() => setActiveTab('tasks')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'tasks' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              听写任务
            </button>
          )}
          <button onClick={() => setActiveTab('library')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'library' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            词库管理
          </button>
          {isTeacher && (
            <button onClick={() => setActiveTab('grading')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'grading' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
              智能批改
            </button>
          )}
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0 ${activeTab === 'reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>
            听写报告
          </button>
        </div>

        {activeTab === 'library' && isTeacher && (
          <button onClick={handleOpenCreateList} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-black transition-all flex items-center gap-3">
             <i className="fas fa-plus"></i> 新建词库
          </button>
        )}
        {activeTab === 'tasks' && isTeacher && (
          <button onClick={() => setView('create-task')} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-3">
             <i className="fas fa-paper-plane"></i> 发布任务
          </button>
        )}
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {activeAssignments.map(task => {
               const list = lists.find(l => l.id === task.listId);
               const cls = classes.find(c => c.id === task.classId);
               const done = results.filter(r => r.assignmentId === task.id).length;
               const total = students.filter(s => s.classId === task.classId).length;
               
               return (
                 <div key={task.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start mb-6">
                       <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase">{cls?.name || 'ALL'}</span>
                       <span className="text-[10px] font-bold text-slate-300">{new Date(task.deadline).toLocaleDateString()} 截止</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-2">{task.title}</h4>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                      类型: {list?.type} • 词数: {list?.words.length}
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between mb-8">
                       <span className="text-[10px] font-black text-slate-400 uppercase">完成情况</span>
                       <span className="text-sm font-black text-indigo-600">{done} / {total}</span>
                    </div>
                    <button 
                      onClick={() => list && startPractice(list, task)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all"
                    >
                      立即开始
                    </button>
                 </div>
               );
             })}
          </div>
        )}

        {activeTab === 'library' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
             {filteredLibrary.map(list => (
               <div key={list.id} className={`bg-white p-8 rounded-[3rem] border-2 shadow-sm transition-all flex flex-col justify-between group h-full ${list.isSyllabus ? 'border-slate-100' : 'border-transparent hover:border-indigo-400 hover:shadow-2xl'}`}>
                  <div className="relative">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-2 items-center">
                        <span className="bg-slate-50 text-slate-400 text-[9px] font-black px-2 py-0.5 rounded-md border border-slate-100 uppercase">{list.type}</span>
                        {list.isSyllabus && (
                          <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1">
                            <i className="fas fa-lock text-[8px]"></i> 大纲词库
                          </span>
                        )}
                      </div>
                      
                      {isTeacher && !list.isSyllabus && (
                        <div className="flex items-center gap-3">
                           <button 
                             onClick={() => toggleVisibility(list)}
                             className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${list.isPublic ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}
                             title={list.isPublic ? "已公开" : "私有"}
                           >
                             <i className={`fas ${list.isPublic ? 'fa-eye' : 'fa-eye-slash'} text-xs`}></i>
                           </button>
                           <button onClick={() => handleOpenEditList(list)} className="text-slate-300 hover:text-indigo-600 transition-colors"><i className="fas fa-pen-to-square"></i></button>
                           <button onClick={() => setConfirmDeleteId(list.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><i className="fas fa-trash-can"></i></button>
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-black text-slate-800 text-xl mb-4 group-hover:text-indigo-600 transition-colors">{list.title}</h4>
                    
                    <div className="space-y-2 mb-8 bg-slate-50/50 p-4 rounded-2xl border border-slate-50">
                      {list.words.slice(0, 3).map((w, i) => (
                        <div key={i} className="text-[11px] text-slate-500 flex justify-between font-bold">
                           <span>{w.word}</span>
                           <span className="text-slate-300">{w.translation}</span>
                        </div>
                      ))}
                      {list.words.length > 3 && (
                        <p className="text-[9px] text-indigo-400 font-black tracking-widest uppercase mt-2">
                           + {list.words.length - 3} MORE ITEMS
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => startPractice(list)} 
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl group-hover:bg-indigo-600 transition-all"
                  >
                    自主魔法练习
                  </button>
               </div>
             ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <div className="bg-white rounded-[3rem] p-12 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
                   <i className="fas fa-trash-can"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-800 text-center mb-2">确认删除词库?</h3>
                <p className="text-slate-400 font-bold text-center text-sm mb-10">此操作不可撤销，且会影响已指派的听写任务。</p>
                <div className="flex gap-4">
                   <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">取消</button>
                   <button onClick={handleDeleteList} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-100">确认删除</button>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'grading' && isTeacher && (
           <div className="bg-white rounded-[4rem] border shadow-sm overflow-hidden min-h-[600px] flex flex-col">
              <div className="p-10 border-b flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
                 <div className="flex items-center gap-6">
                    <h3 className="text-2xl font-black text-slate-800">班级批改工作台</h3>
                    <div className="flex bg-white p-1 rounded-xl border shadow-sm">
                       <button onClick={() => setGradingMode('STUDENT')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${gradingMode === 'STUDENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>按学生</button>
                       <button onClick={() => setGradingMode('WORD')} className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${gradingMode === 'WORD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>按单词</button>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-[3.5rem] border shadow-sm overflow-hidden flex flex-col">
                   <div className="p-8 border-b flex justify-between items-center">
                      <h3 className="text-xl font-black text-slate-800">听写历史踪迹</h3>
                      <input 
                        type="date" 
                        className="bg-slate-50 border px-4 py-2 rounded-xl text-[10px] font-black outline-none"
                        value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                      />
                   </div>
                   <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-4 space-y-4">
                      {userResults.filter(r => !reportDate || r.completedAt.includes(reportDate)).map(res => (
                        <div key={res.id} onClick={() => { setSelectedResult(res); setView('report-detail'); }} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between hover:border-indigo-200 cursor-pointer group transition-all">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner ${res.score >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                 {res.score}
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 text-lg leading-tight">{lists.find(l => l.id === res.listId)?.title}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                    {new Date(res.completedAt).toLocaleString()} • {res.studentName}
                                 </p>
                              </div>
                           </div>
                           <i className="fas fa-arrow-right text-slate-200 group-hover:text-indigo-400 transition-colors mr-4"></i>
                        </div>
                      ))}
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col h-full min-h-[500px]">
                   <h3 className="text-2xl font-black mb-8 relative z-10 flex items-center gap-3">
                      <i className="fas fa-ghost text-rose-500"></i> 
                      {isTeacher ? '全班错词频率' : '魔法错词本'}
                   </h3>
                   <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 relative z-10">
                      {mistakeBank.map((word, i) => (
                        <div key={word} className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer" onClick={() => announceTTS(word)}>
                           <div>
                              <span className="font-bold text-sm block">{word}</span>
                              <span className="text-[8px] text-slate-500 font-black uppercase">Click to pronounce</span>
                           </div>
                           <i className="fas fa-volume-high text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                      ))}
                   </div>
                   <i className="fas fa-spell-check absolute -right-20 -bottom-20 text-[20rem] text-white/5 -rotate-12 pointer-events-none"></i>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------------
          MODALS
      --------------------------------------------------------------------------- */}

      {/* Practice Interface */}
      {view === 'practice' && selectedList && (
        <div className="fixed inset-0 bg-slate-950 z-[200] flex flex-col animate-in fade-in duration-500">
           {!practiceState.done ? (
             <>
               <div className="p-8 flex justify-between items-center">
                  <button onClick={() => setView('main')} className="text-white/40 hover:text-white transition-all"><i className="fas fa-times text-2xl"></i></button>
                  <div className="flex gap-2">
                     {selectedList.words.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i === practiceState.index ? 'bg-indigo-500 ring-4 ring-indigo-500/30 scale-125' : i < practiceState.index ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                     ))}
                  </div>
                  <div className="text-indigo-400 font-black text-sm uppercase tracking-widest">
                     {practiceState.index + 1} / {selectedList.words.length}
                  </div>
               </div>

               <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-20">
                     <p className="text-indigo-400 font-black uppercase tracking-[0.4em] text-xs mb-8">{selectedList.type} Mode</p>
                     <button 
                       onClick={() => announceTTS(selectedList.words[practiceState.index].word)}
                       className="w-44 h-44 rounded-full bg-indigo-600 flex items-center justify-center text-5xl text-white shadow-[0_0_80px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all"
                     >
                       <i className="fas fa-volume-up"></i>
                     </button>
                     <p className="text-white/40 mt-12 text-3xl font-medium italic">"{selectedList.words[practiceState.index].translation}"</p>
                  </div>

                  <div className="w-full max-w-4xl px-4">
                     <input 
                       autoFocus
                       className="w-full bg-transparent border-b-8 border-white/10 focus:border-indigo-600 text-white text-center text-5xl lg:text-7xl font-black outline-none pb-8 transition-all tracking-tight placeholder:text-white/5"
                       placeholder="TYPE HERE..."
                       value={practiceState.input}
                       onChange={e => setPracticeState({...practiceState, input: e.target.value})}
                       onKeyDown={e => e.key === 'Enter' && handleNextWord()}
                     />
                     <div className="mt-20">
                        <button 
                          onClick={handleNextWord}
                          className="px-24 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black text-lg uppercase tracking-widest hover:bg-indigo-50 shadow-2xl transition-all"
                        >
                          {practiceState.index === selectedList.words.length - 1 ? '提交结果' : '下一个单词'}
                        </button>
                     </div>
                  </div>
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-700">
                <div className="bg-white rounded-[5rem] p-20 w-full max-w-3xl shadow-2xl relative overflow-hidden">
                   <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8">
                     <i className="fas fa-award"></i>
                   </div>
                   <h2 className="text-5xl font-black text-slate-800 mb-2">完成!</h2>
                   <div className="grid grid-cols-2 gap-10 mb-16">
                      <div className="p-10 bg-slate-50 rounded-[3rem] border">
                         <p className="text-7xl font-black text-slate-800">
                           {practiceState.results.filter(r => r.isCorrect).length}
                         </p>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">正确数</p>
                      </div>
                      <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100">
                         <p className="text-7xl font-black text-indigo-600">
                           {Math.round((practiceState.results.filter(r => r.isCorrect).length / selectedList.words.length) * 100)}
                         </p>
                         <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-4">最终得分</p>
                      </div>
                   </div>
                   <button onClick={() => setView('main')} className="mt-16 w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                      返回
                   </button>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Create / Edit List Modal */}
      {view === 'create-list' && (
        <ModalWrapper title={editingListId ? "修改听写词库" : "定义听写词库"} onClose={() => { setView('main'); setEditingListId(null); }}>
           <div className="space-y-8">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">资源标题</label>
                 <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-6 rounded-3xl font-bold outline-indigo-500" placeholder="如: Unit 3 核心词汇" value={listForm.title} onChange={e => setListForm({...listForm, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">内容类型</label>
                    <select className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-3xl font-bold outline-indigo-500" value={listForm.type} onChange={e => setListForm({...listForm, type: e.target.value as any})}>
                       <option value="WORD">单词短语</option>
                       <option value="PHRASE">复合词组</option>
                       <option value="SENTENCE">长难句子</option>
                       <option value="PARAGRAPH">短文默写</option>
                    </select>
                 </div>
                 <div className="flex items-center gap-4 pl-4 pt-8">
                    <div 
                      onClick={() => setListForm({...listForm, isPublic: !listForm.isPublic})}
                      className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${listForm.isPublic ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${listForm.isPublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">允许全员练习</label>
                 </div>
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">批量录入 (英文, 中文)</label>
                 <textarea className="w-full h-64 bg-slate-50 border-0 ring-1 ring-slate-100 p-6 rounded-3xl font-bold outline-indigo-500 resize-none" placeholder="apple, 苹果&#10;banana, 香蕉" value={listForm.raw} onChange={e => setListForm({...listForm, raw: e.target.value})} />
              </div>
              <button onClick={handleSaveList} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {editingListId ? '保存修改' : '立即同步到词库'}
              </button>
           </div>
        </ModalWrapper>
      )}

      {/* Create Task Modal */}
      {view === 'create-task' && (
        <ModalWrapper title="发布听写任务" onClose={() => setView('main')}>
           <div className="space-y-6">
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">任务名称</label>
                 <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" placeholder="如: 本周重点词汇验收" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} />
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">选择词库</label>
                 <select className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" value={taskForm.listId} onChange={e => setTaskForm({...taskForm, listId: e.target.value})}>
                    <option value="">-- 请选择关联词库 --</option>
                    {lists.map(l => <option key={l.id} value={l.id}>{l.title} ({l.type})</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">指派班级</label>
                    <select className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" value={taskForm.classId} onChange={e => setTaskForm({...taskForm, classId: e.target.value})}>
                       <option value="">全校区</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">截止日期</label>
                    <input type="date" className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" value={taskForm.deadline} onChange={e => setTaskForm({...taskForm, deadline: e.target.value})} />
                 </div>
              </div>
              <button onClick={handleSaveTask} className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 mt-6">
                下发任务到学生端
              </button>
           </div>
        </ModalWrapper>
      )}

      {/* Result Detail Modal */}
      {view === 'report-detail' && selectedResult && (
        <ModalWrapper title="成绩详情透视" onClose={() => setView('main')}>
           <div className="space-y-8">
              <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-3xl border">
                 <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl font-black text-indigo-600 shadow-sm border border-indigo-100">
                    {selectedResult.score}
                 </div>
                 <div>
                    <h4 className="text-xl font-black text-slate-800">{selectedResult.studentName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                      {lists.find(l => l.id === selectedResult.listId)?.title}
                    </p>
                 </div>
              </div>
              <div className="space-y-3">
                 {selectedResult.details.map((d, i) => (
                    <div key={i} className={`p-5 rounded-2xl border flex justify-between items-center ${d.isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-rose-50/30 border-rose-100'}`}>
                       <div>
                          <span className="font-black text-slate-700">{d.word}</span>
                          {!d.isCorrect && <span className="text-[10px] text-rose-500 font-bold ml-3 italic">Typed: {d.input || '(empty)'}</span>}
                       </div>
                       <i className={`fas ${d.isCorrect ? 'fa-check text-emerald-500' : 'fa-xmark text-rose-500'} text-sm`}></i>
                    </div>
                 ))}
              </div>
           </div>
        </ModalWrapper>
      )}
    </div>
  );
};

export default Dictation;
