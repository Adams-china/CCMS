
import React, { useState, useMemo } from 'react';
import { generateLessonPlan } from '../services/geminiService';
import { Resource, ClassInfo, LessonPlanRecord, ClassFeedback, UserRole, DictationList, SyllabusRecord, UserAccount } from '../types';

interface ResourcesProps {
  resources: Resource[];
  dictationLists: DictationList[];
  classes: ClassInfo[];
  activeClassId: string | null;
  lessonPlans: LessonPlanRecord[];
  feedbacks: ClassFeedback[];
  currentUser: UserAccount | null;
  syllabus: SyllabusRecord[];
  onAddResource: (r: Resource) => void;
  onAddLessonPlan: (p: LessonPlanRecord) => void;
  onAddFeedback: (f: ClassFeedback) => void;
}

const Resources: React.FC<ResourcesProps> = ({ 
  resources, dictationLists, classes, activeClassId, lessonPlans, feedbacks, currentUser, syllabus, onAddResource, onAddLessonPlan, onAddFeedback 
}) => {
  const isTeacher = currentUser?.role !== UserRole.PARENT;

  // Navigation State
  const [viewMode, setViewMode] = useState<'SYLLABUS' | 'PLANNER' | 'FEEDBACK'>('SYLLABUS');
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string | null>(null);
  
  // Planner State
  const [planForm, setPlanForm] = useState<Partial<LessonPlanRecord>>({
    title: '', teachingContents: '', objectives: [], dictationListId: '', notes: ''
  });
  const [newObjective, setNewObjective] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Feedback State
  const [feedbackForm, setFeedbackForm] = useState<Partial<ClassFeedback>>({
    covered: '', issues: '', successes: '', rating: 5
  });

  // Derived Data
  const activeClass = classes.find(c => c.id === activeClassId);
  
  const currentLessonPlan = useMemo(() => {
    if (!activeClassId || !selectedSyllabusId) return null;
    return lessonPlans.find(p => p.classId === activeClassId && p.syllabusId === selectedSyllabusId);
  }, [lessonPlans, activeClassId, selectedSyllabusId]);

  const historicalPlans = useMemo(() => {
    if (!selectedSyllabusId) return [];
    // Find plans for this syllabus item from OTHER classes or PAST dates
    return lessonPlans.filter(p => p.syllabusId === selectedSyllabusId && p.id !== currentLessonPlan?.id);
  }, [lessonPlans, selectedSyllabusId, currentLessonPlan]);

  // Handlers
  const handleSyllabusSelect = (syl: SyllabusRecord) => {
    if (!activeClassId && isTeacher) {
      alert("请先在左侧侧边栏选择一个活跃班级，以便为该班级制定教案。");
      return;
    }
    setSelectedSyllabusId(syl.id);
    
    // Pre-fill form if plan exists, otherwise use syllabus defaults
    if (currentLessonPlan) {
      setPlanForm(currentLessonPlan);
    } else {
      setPlanForm({
        title: syl.lessonName,
        objectives: syl.standardObjectives,
        teachingContents: '',
        dictationListId: '',
        notes: ''
      });
    }
    setViewMode('PLANNER');
  };

  const handleSavePlan = () => {
    if (!planForm.title || !currentUser || !activeClassId || !selectedSyllabusId) return;
    
    const syl = syllabus.find(s => s.id === selectedSyllabusId);
    
    const newPlan: LessonPlanRecord = {
      id: currentLessonPlan?.id || `lp-${Date.now()}`,
      classId: activeClassId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      date: new Date().toISOString(),
      hour: syl?.recommendedDuration || 1,
      syllabusId: selectedSyllabusId,
      title: planForm.title || '',
      teachingContents: planForm.teachingContents || '',
      objectives: planForm.objectives || [],
      dictationListId: planForm.dictationListId,
      notes: planForm.notes
    };

    onAddLessonPlan(newPlan);
    alert("教案已保存！");
  };

  const handleAiPlanRequest = async () => {
    if (!planForm.title) return;
    setIsAiGenerating(true);
    try {
      const result = await generateLessonPlan(`Course title: ${planForm.title}. Generate detailed lesson plan.`);
      setPlanForm(prev => ({ ...prev, teachingContents: result }));
    } catch (e) {
      alert("AI Service Busy.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (!currentUser || !activeClassId) return;
    onAddFeedback({
      id: `fb-${Date.now()}`,
      classId: activeClassId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      date: new Date().toISOString(),
      lessonPlanId: currentLessonPlan?.id,
      covered: feedbackForm.covered || '',
      issues: feedbackForm.issues || '',
      successes: feedbackForm.successes || '',
      rating: feedbackForm.rating || 5
    });
    setFeedbackForm({ covered: '', issues: '', successes: '', rating: 5 });
    alert("课后反馈已提交！");
    setViewMode('SYLLABUS');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Area */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border">
         <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <i className="fas fa-book-journal-whills text-indigo-600"></i>
              学术教研中心
            </h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
               {activeClass ? `Current Context: ${activeClass.name}` : 'Select a class to manage plans'}
            </p>
         </div>
         <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button 
              onClick={() => setViewMode('SYLLABUS')} 
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'SYLLABUS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
               Syllabus Matrix
            </button>
            <button 
              onClick={() => {
                if (!currentLessonPlan && !selectedSyllabusId) {
                  alert("请先从大纲中选择一节课。"); 
                  setViewMode('SYLLABUS');
                } else {
                  setViewMode('PLANNER');
                }
              }}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'PLANNER' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
               Plan Editor
            </button>
            <button 
              onClick={() => setViewMode('FEEDBACK')}
              className={`px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${viewMode === 'FEEDBACK' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-white'}`}
            >
               Post-Class Feedback
            </button>
         </div>
      </div>

      {/* VIEW 1: SYLLABUS TABLE (DEFAULT) */}
      {viewMode === 'SYLLABUS' && (
        <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
           <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">Standard Curriculum</h3>
              <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-lg border">Level 1 Regular</span>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                       <th className="px-8 py-5">Unit</th>
                       <th className="px-8 py-5">Lesson Name</th>
                       <th className="px-8 py-5">Core Topic</th>
                       <th className="px-8 py-5">Objectives</th>
                       <th className="px-8 py-5">Status (Active Class)</th>
                       <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {syllabus.map(syl => {
                       const plan = lessonPlans.find(p => p.classId === activeClassId && p.syllabusId === syl.id);
                       return (
                          <tr key={syl.id} className="group hover:bg-indigo-50/30 transition-colors">
                             <td className="px-8 py-6 font-bold text-slate-500">{syl.unit}</td>
                             <td className="px-8 py-6 font-black text-slate-800 text-lg">{syl.lessonName}</td>
                             <td className="px-8 py-6 text-sm font-bold text-indigo-600">{syl.coreTopic}</td>
                             <td className="px-8 py-6">
                                <div className="flex flex-wrap gap-2">
                                   {syl.standardObjectives.map((obj, i) => (
                                      <span key={i} className="text-[9px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold">{obj}</span>
                                   ))}
                                </div>
                             </td>
                             <td className="px-8 py-6">
                                {plan ? (
                                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                                      <i className="fas fa-check-circle"></i> Planned
                                   </span>
                                ) : (
                                   <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-400 rounded-full text-[10px] font-black uppercase">
                                      Not Started
                                   </span>
                                )}
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button 
                                  onClick={() => handleSyllabusSelect(syl)}
                                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                                >
                                   {plan ? 'Edit Plan' : 'Create Plan'}
                                </button>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* VIEW 2: PLAN EDITOR */}
      {viewMode === 'PLANNER' && selectedSyllabusId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in zoom-in-95 duration-300">
           {/* Editor Column */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800">Lesson Planner</h3>
                    <div className="flex gap-3">
                       <button onClick={handleAiPlanRequest} disabled={isAiGenerating} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-100 transition-colors flex items-center gap-2">
                          {isAiGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                          AI Generate
                       </button>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Lesson Title</label>
                       <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500" value={planForm.title} onChange={e => setPlanForm({...planForm, title: e.target.value})} />
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Teaching Contents & Procedure</label>
                       <textarea className="w-full h-80 bg-slate-50 border-0 ring-1 ring-slate-100 p-6 rounded-3xl font-medium text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none" placeholder="1. Warm up..." value={planForm.teachingContents} onChange={e => setPlanForm({...planForm, teachingContents: e.target.value})} />
                    </div>

                    <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Objectives</label>
                       <div className="flex flex-wrap gap-2 mb-3">
                          {planForm.objectives?.map((obj, i) => (
                             <span key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[11px] font-black border border-indigo-100 flex items-center gap-2">
                               {obj}
                               <button onClick={() => setPlanForm({...planForm, objectives: planForm.objectives?.filter((_, idx) => idx !== i)})}><i className="fas fa-times"></i></button>
                             </span>
                          ))}
                       </div>
                       <div className="flex gap-2">
                          <input className="flex-1 bg-slate-50 border-0 ring-1 ring-slate-100 p-4 rounded-2xl text-xs font-bold" placeholder="Add custom objective..." value={newObjective} onChange={e => setNewObjective(e.target.value)} onKeyDown={e => e.key === 'Enter' && (setPlanForm({...planForm, objectives: [...(planForm.objectives || []), newObjective]}), setNewObjective(''))} />
                          <button onClick={() => { if(newObjective) { setPlanForm({...planForm, objectives: [...(planForm.objectives || []), newObjective]}); setNewObjective(''); }}} className="w-12 bg-indigo-600 text-white rounded-2xl"><i className="fas fa-plus"></i></button>
                       </div>
                    </div>

                    <div>
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Dictation Resource</label>
                         <select 
                           className="w-full bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-2xl font-bold outline-indigo-500"
                           value={planForm.dictationListId}
                           onChange={e => setPlanForm({...planForm, dictationListId: e.target.value})}
                         >
                            <option value="">-- No Dictation --</option>
                            {dictationLists.map(l => (
                              <option key={l.id} value={l.id}>{l.title}</option>
                            ))}
                         </select>
                    </div>

                    <button onClick={handleSavePlan} className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
                       Save Lesson Plan for {activeClass?.name}
                    </button>
                 </div>
              </div>
           </div>

           {/* History Sidebar */}
           <div className="space-y-6">
              <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                 <h4 className="text-xl font-black mb-4 relative z-10">Reference Plans</h4>
                 <p className="text-xs text-slate-400 mb-6 relative z-10">See how other teachers taught this lesson.</p>
                 
                 <div className="space-y-4 relative z-10 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                    {historicalPlans.length === 0 ? (
                       <p className="text-slate-500 text-sm italic">No previous plans found for this lesson.</p>
                    ) : (
                       historicalPlans.map(hp => (
                          <div key={hp.id} className="bg-white/10 p-5 rounded-2xl border border-white/5 hover:bg-white/20 transition-colors cursor-pointer" onClick={() => {
                             if(confirm("Load this historical content into your editor?")) {
                                setPlanForm({...planForm, teachingContents: hp.teachingContents, objectives: hp.objectives});
                             }
                          }}>
                             <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-xs text-indigo-300">{hp.teacherName}</span>
                                <span className="text-[9px] text-slate-400">{new Date(hp.date).toLocaleDateString()}</span>
                             </div>
                             <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{hp.teachingContents}</p>
                             <div className="mt-3 pt-3 border-t border-white/10 flex justify-end">
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Tap to Copy</span>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
                 <i className="fas fa-history absolute -right-6 -bottom-6 text-[10rem] text-white/5 rotate-12"></i>
              </div>
           </div>
        </div>
      )}

      {/* VIEW 3: FEEDBACK */}
      {viewMode === 'FEEDBACK' && (
         <div className="max-w-3xl mx-auto bg-white p-10 lg:p-14 rounded-[4rem] border shadow-xl animate-in fade-in slide-in-from-bottom-8">
            <h3 className="text-2xl font-black text-slate-800 mb-8 text-center">Post-Class Reflection</h3>
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-xs font-black text-slate-400 uppercase mb-2">Class</p>
                     <p className="text-xl font-black text-indigo-600">{activeClass?.name}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                     <p className="text-xs font-black text-slate-400 uppercase mb-2">Lesson</p>
                     <p className="text-xl font-black text-slate-800">{currentLessonPlan?.title || 'General Class'}</p>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Content Covered</label>
                  <textarea className="w-full h-24 bg-slate-50 border-0 ring-1 ring-slate-100 p-5 rounded-3xl font-medium outline-indigo-500" placeholder="What did you actually get through?" value={feedbackForm.covered} onChange={e => setFeedbackForm({...feedbackForm, covered: e.target.value})} />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Issues / Struggles</label>
                     <textarea className="w-full h-32 bg-rose-50 border-0 ring-1 ring-rose-100 p-5 rounded-3xl font-medium outline-rose-500 text-rose-800" placeholder="What was difficult?" value={feedbackForm.issues} onChange={e => setFeedbackForm({...feedbackForm, issues: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Successes / Wins</label>
                     <textarea className="w-full h-32 bg-emerald-50 border-0 ring-1 ring-emerald-100 p-5 rounded-3xl font-medium outline-emerald-500 text-emerald-800" placeholder="What went well?" value={feedbackForm.successes} onChange={e => setFeedbackForm({...feedbackForm, successes: e.target.value})} />
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Self Rating</label>
                  <div className="flex justify-between bg-slate-50 p-4 rounded-3xl">
                     {[1,2,3,4,5].map(r => (
                        <button key={r} onClick={() => setFeedbackForm({...feedbackForm, rating: r})} className={`w-12 h-12 rounded-2xl font-black text-xl transition-all ${feedbackForm.rating === r ? 'bg-indigo-600 text-white shadow-lg scale-110' : 'bg-white text-slate-300'}`}>
                           {r}
                        </button>
                     ))}
                  </div>
               </div>

               <button onClick={handleSubmitFeedback} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                  Submit Log
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Resources;
