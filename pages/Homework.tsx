
import React, { useState } from 'react';
import { Homework, HomeworkSubmission, UserRole, ClassInfo, Student } from '../types';
import { analyzeStudentImage, announceTTS } from '../services/geminiService';

interface HomeworkProps {
  homeworks: Homework[];
  submissions: HomeworkSubmission[];
  classes: ClassInfo[];
  students: Student[];
  currentUser: { id: string; name: string; role: UserRole } | null;
  activeClassId: string | null;
  onAddHomework: (hw: Homework) => void;
  onUpdateSubmission: (sub: HomeworkSubmission) => void;
  onSubmitHomework: (sub: HomeworkSubmission) => void;
  onAwardPoints: (studentId: string, amount: number) => void;
}

const HomeworkPage: React.FC<HomeworkProps> = ({ 
  homeworks, submissions, classes, students, currentUser, activeClassId,
  onAddHomework, onUpdateSubmission, onSubmitHomework, onAwardPoints 
}) => {
  const [view, setView] = useState<'list' | 'create' | 'grade' | 'submit'>('list');
  const [selectedHwId, setSelectedHwId] = useState<string | null>(null);
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Form states
  const [newHw, setNewHw] = useState({ title: '', description: '', deadline: '', points: 5 });
  const [submissionForm, setSubmissionForm] = useState({ content: '', imageUrl: '' });
  const [feedbackForm, setFeedbackForm] = useState({ grade: 'A' as 'A'|'B'|'C', comment: '' });

  const isTeacher = currentUser?.role === UserRole.TEACHER || currentUser?.role === UserRole.SUPER_ADMIN;

  // Filter homeworks based on activeClassId
  const filteredHomeworks = homeworks.filter(hw => !activeClassId || hw.classId === activeClassId);

  const handleCreateHw = () => {
    if (!newHw.title || !activeClassId) return;
    onAddHomework({
      id: Date.now().toString(),
      classId: activeClassId,
      teacherId: currentUser?.id || '',
      title: newHw.title,
      description: newHw.description,
      deadline: newHw.deadline,
      rewardPoints: newHw.points,
      createdAt: new Date().toISOString()
    });
    setView('list');
    setNewHw({ title: '', description: '', deadline: '', points: 5 });
  };

  const handleGrade = async () => {
    const sub = submissions.find(s => s.id === selectedSubId);
    const hw = homeworks.find(h => h.id === sub?.homeworkId);
    if (!sub || !hw) return;

    const pointMap = { 'A': hw.rewardPoints, 'B': Math.ceil(hw.rewardPoints * 0.7), 'C': Math.ceil(hw.rewardPoints * 0.4) };
    const points = pointMap[feedbackForm.grade];

    onUpdateSubmission({
      ...sub,
      status: 'GRADED',
      grade: feedbackForm.grade,
      feedback: feedbackForm.comment,
      gradedAt: new Date().toISOString()
    });

    onAwardPoints(sub.studentId, points);
    await announceTTS(`Homework graded. ${sub.studentName} earned ${points} points!`);
    setView('list');
  };

  const handleAiFeedback = async () => {
    const sub = submissions.find(s => s.id === selectedSubId);
    if (!sub || !sub.content) return;
    setIsAiLoading(true);
    try {
      const feedback = await analyzeStudentImage(sub.imageUrl || ""); 
      setFeedbackForm(f => ({ ...f, comment: feedback || "AI was unable to generate feedback." }));
    } catch (e) {
      alert("AI Analysis failed.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Homework Hub</h2>
          {activeClassId ? (
            <p className="text-indigo-500 text-xs font-black uppercase mt-2">Active Class: {classes.find(c => c.id === activeClassId)?.name}</p>
          ) : (
            <p className="text-slate-400 text-xs font-medium mt-2">Global View (Select class for context)</p>
          )}
        </div>
        {isTeacher && view === 'list' && activeClassId && (
          <button 
            onClick={() => setView('create')}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition active:scale-95 flex items-center gap-2"
          >
            <i className="fas fa-plus"></i> New Assignment
          </button>
        )}
      </div>

      {view === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHomeworks.map(hw => {
            const subCount = submissions.filter(s => s.homeworkId === hw.id).length;
            const pendingCount = submissions.filter(s => s.homeworkId === hw.id && s.status === 'SUBMITTED').length;
            const className = classes.find(c => c.id === hw.classId)?.name || 'Class';
            
            return (
              <div key={hw.id} className="bg-white rounded-3xl border shadow-sm p-6 hover:border-indigo-200 transition group">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">{className}</span>
                  <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                    <i className="fas fa-star"></i> {hw.rewardPoints} Pts
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">{hw.title}</h4>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{hw.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-xs font-bold text-slate-400">
                    <i className="far fa-clock mr-1"></i> {new Date(hw.deadline).toLocaleDateString()}
                  </div>
                  {isTeacher ? (
                    <button 
                      onClick={() => { setSelectedHwId(hw.id); setView('grade'); }}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition flex items-center gap-2"
                    >
                      Grading {pendingCount > 0 && <span className="w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>}
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setSelectedHwId(hw.id); setView('submit'); }}
                      className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredHomeworks.length === 0 && (
            <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-slate-300">
               <i className="fas fa-book-open text-4xl mb-4 opacity-20"></i>
               <p className="font-bold">No assignments found for this selection.</p>
            </div>
          )}
        </div>
      )}

      {view === 'create' && (
        <div className="bg-white rounded-3xl border shadow-sm p-8 max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
             <i className="fas fa-plus-circle text-indigo-600"></i>
             Publish for {classes.find(c => c.id === activeClassId)?.name}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Assignment Title</label>
              <input 
                type="text" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 font-bold outline-indigo-500"
                placeholder="e.g. Unit 4 Reading Practice"
                value={newHw.title} onChange={e => setNewHw({...newHw, title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Task Description</label>
              <textarea 
                className="w-full h-32 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 outline-indigo-500 font-medium"
                placeholder="Explain what the students need to do..."
                value={newHw.description} onChange={e => setNewHw({...newHw, description: e.target.value})}
              ></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Deadline</label>
                <input 
                  type="date" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 font-bold outline-indigo-500"
                  value={newHw.deadline} onChange={e => setNewHw({...newHw, deadline: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Completion Reward</label>
                <input 
                  type="number" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 font-bold outline-indigo-500"
                  value={newHw.points} onChange={e => setNewHw({...newHw, points: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-6">
              <button onClick={() => setView('list')} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition">Cancel</button>
              <button onClick={handleCreateHw} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition">Publish Now</button>
            </div>
          </div>
        </div>
      )}

      {view === 'grade' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <button onClick={() => setView('list')} className="text-slate-400 hover:text-indigo-600 font-black text-xs flex items-center gap-2">
             <i className="fas fa-arrow-left"></i> Back to assignments
           </button>
           
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             <div className="lg:col-span-1 space-y-4">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Submissions</h4>
               <div className="bg-white rounded-3xl border shadow-sm divide-y overflow-hidden">
                 {submissions.filter(s => s.homeworkId === selectedHwId).map(sub => (
                   <button 
                     key={sub.id} 
                     onClick={() => setSelectedSubId(sub.id)}
                     className={`w-full p-4 flex items-center justify-between transition ${selectedSubId === sub.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                   >
                     <div className="flex items-center gap-3">
                       <img src={`https://i.pravatar.cc/100?u=${sub.studentId}`} className="w-8 h-8 rounded-full" alt="" />
                       <div className="text-left">
                         <p className="text-xs font-black text-slate-800">{sub.studentName}</p>
                         <p className="text-[10px] text-slate-400">{sub.status}</p>
                       </div>
                     </div>
                     {sub.status === 'SUBMITTED' && <div className="w-2 h-2 bg-rose-500 rounded-full"></div>}
                   </button>
                 ))}
               </div>
             </div>

             <div className="lg:col-span-3">
               {selectedSubId ? (
                 <div className="bg-white rounded-3xl border shadow-sm p-8 flex flex-col md:flex-row gap-8">
                   <div className="flex-1 space-y-6">
                     <div>
                       <h5 className="text-xs font-black text-slate-400 uppercase mb-2">Student Submission</h5>
                       <div className="p-6 bg-slate-50 rounded-2xl border min-h-[200px] text-slate-700 leading-relaxed font-medium">
                         {submissions.find(s => s.id === selectedSubId)?.content}
                         {submissions.find(s => s.id === selectedSubId)?.imageUrl && (
                           <img src={submissions.find(s => s.id === selectedSubId)?.imageUrl} className="mt-4 rounded-xl border w-full max-w-sm" alt="Student Work" />
                         )}
                       </div>
                     </div>
                   </div>
                   <div className="w-full md:w-80 space-y-6 border-l pl-0 md:pl-8">
                     <div className="flex justify-between items-center">
                        <h5 className="text-xs font-black text-slate-400 uppercase">Grading Panel</h5>
                        <button 
                          onClick={handleAiFeedback} 
                          disabled={isAiLoading}
                          className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-indigo-100 disabled:opacity-50 flex items-center gap-2 transition"
                        >
                          {isAiLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-robot"></i>}
                          AI Assist
                        </button>
                     </div>
                     <div className="flex justify-center gap-4">
                        {(['A','B','C'] as const).map(g => (
                          <button 
                            key={g} 
                            onClick={() => setFeedbackForm({...feedbackForm, grade: g})}
                            className={`w-12 h-12 rounded-full font-black text-lg transition flex items-center justify-center border-2 ${feedbackForm.grade === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-110' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                          >
                            {g}
                          </button>
                        ))}
                     </div>
                     <textarea 
                        className="w-full h-40 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm outline-indigo-500"
                        placeholder="Write feedback..."
                        value={feedbackForm.comment} onChange={e => setFeedbackForm({...feedbackForm, comment: e.target.value})}
                     ></textarea>
                     <button 
                        onClick={handleGrade}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-50 hover:bg-emerald-700 transition active:scale-95"
                      >
                       Grade & Award Points
                     </button>
                   </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-3xl border-2 border-dashed h-[400px] flex flex-col items-center justify-center text-slate-300">
                    <i className="fas fa-user-check text-4xl mb-4 opacity-20"></i>
                    <p className="font-bold">Select a student submission to grade</p>
                 </div>
               )}
             </div>
           </div>
        </div>
      )}

      {view === 'submit' && (
        <div className="bg-white rounded-3xl border shadow-sm p-8 max-w-2xl mx-auto animate-in fade-in duration-300">
           <div className="mb-8">
              <h3 className="text-xl font-black text-slate-800">{homeworks.find(h => h.id === selectedHwId)?.title}</h3>
              <p className="text-slate-500 mt-2">{homeworks.find(h => h.id === selectedHwId)?.description}</p>
           </div>
           <div className="space-y-6">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Your Work</label>
                <textarea 
                  className="w-full h-48 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 font-medium outline-indigo-500"
                  placeholder="Type your homework answer here..."
                  value={submissionForm.content} onChange={e => setSubmissionForm({...submissionForm, content: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase ml-2 mb-1 block">Image URL (Optional)</label>
                <input 
                  type="text" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-xs font-mono outline-indigo-500"
                  placeholder="Paste image link..."
                  value={submissionForm.imageUrl} onChange={e => setSubmissionForm({...submissionForm, imageUrl: e.target.value})}
                />
              </div>
              <div className="flex gap-3 pt-6">
                <button onClick={() => setView('list')} className="flex-1 bg-slate-100 text-slate-600 font-black py-4 rounded-2xl transition">Cancel</button>
                <button 
                  onClick={() => {
                    const hw = homeworks.find(h => h.id === selectedHwId);
                    if (!hw) return;
                    onSubmitHomework({
                      id: Date.now().toString(),
                      homeworkId: hw.id,
                      studentId: currentUser?.id || 's-demo',
                      studentName: currentUser?.name || 'Student',
                      content: submissionForm.content,
                      imageUrl: submissionForm.imageUrl,
                      status: 'SUBMITTED',
                      submittedAt: new Date().toISOString()
                    });
                    setView('list');
                    setSubmissionForm({ content: '', imageUrl: '' });
                  }}
                  className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-50 hover:bg-emerald-700 transition"
                >
                  Turn In
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HomeworkPage;
