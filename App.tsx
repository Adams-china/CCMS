
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserRole, AppState, Campus, ClassInfo, Student, Message, Homework, HomeworkSubmission, ActivityLog, Resource, Product, UserAccount, DictationList, DictationResult, LessonPlanRecord, ClassFeedback, AcademicLevel, DictationAssignment, SyllabusRecord } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Management from './pages/Management';
import PointWonderland from './pages/PointWonderland';
import Mall from './pages/Mall';
import Resources from './pages/Resources';
import Reports from './pages/Reports';
import Messages from './pages/Messages';
import HomeworkPage from './pages/Homework';
import Dictation from './pages/Dictation';
import AccountManagement from './pages/AccountManagement';
import Toolbox from './pages/Toolbox';
import TimerPage from './pages/Timer';
import ClassArchives from './pages/ClassArchives';
import { announceTTS } from './services/geminiService';

const INITIAL_CAMPUSES: Campus[] = [
  { id: 'cp-1', name: '杭州西湖校区', address: '西湖区文二路100号', status: 'ACTIVE', createdAt: new Date().toISOString() },
  { id: 'cp-2', name: '上海浦东校区', address: '浦东新区陆家嘴中心', status: 'ACTIVE', createdAt: new Date().toISOString() }
];

const INITIAL_CLASSES: ClassInfo[] = [
  { id: 'cl-1', campusId: 'cp-1', name: '启蒙A1班', schedules: [{ day: 1, startTime: '17:00', endTime: '18:30' }, { day: 4, startTime: '17:00', endTime: '18:30' }] },
  { id: 'cl-2', campusId: 'cp-1', name: '飞跃B2班', schedules: [{ day: 2, startTime: '18:30', endTime: '20:00' }, { day: 5, startTime: '18:30', endTime: '20:00' }] }
];

const INITIAL_LEVELS: AcademicLevel[] = [
  { id: 'lv-1', name: '幼儿启蒙英语', lessonsCount: 48, durationCategory: 'LONG', season: 'REGULAR', isCore: true },
  { id: 'lv-2', name: '暑期绘本集训', lessonsCount: 12, durationCategory: 'SHORT', season: 'SUMMER', isCore: false },
  { id: 'lv-3', name: 'KET 冲刺班', lessonsCount: 24, durationCategory: 'LONG', season: 'SPRING', isCore: true },
];

const INITIAL_SYLLABUS: SyllabusRecord[] = [
  { id: 'syl-1', levelId: 'lv-1', unit: 'Unit 1', lessonName: 'Welcome to Wonderland', coreTopic: 'Greetings & Intros', standardObjectives: ['Say hello/goodbye', 'Introduce name'], recommendedDuration: 1 },
  { id: 'syl-2', levelId: 'lv-1', unit: 'Unit 1', lessonName: 'Phonics A & B', coreTopic: 'Letter Recognition', standardObjectives: ['Sound of A/B', 'Write A/B'], recommendedDuration: 1 },
  { id: 'syl-3', levelId: 'lv-1', unit: 'Unit 1', lessonName: 'My Family', coreTopic: 'Family Members', standardObjectives: ['Identify Mom/Dad', 'This is my...'], recommendedDuration: 1 },
  { id: 'syl-4', levelId: 'lv-1', unit: 'Unit 2', lessonName: 'Colors of Rainbow', coreTopic: 'Colors', standardObjectives: ['Red, Blue, Yellow', 'Color objects'], recommendedDuration: 1 },
];

const INITIAL_ACCOUNTS: UserAccount[] = [
  { id: 'u-1', name: '超级管理员', email: 'admin@wonderland.com', role: UserRole.SUPER_ADMIN, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', classIds: ['cl-1', 'cl-2'] },
  { id: 'u-2', name: 'Sarah Teacher', email: 'sarah@wonderland.com', role: UserRole.TEACHER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', classIds: ['cl-1', 'cl-2'], campusId: 'cp-1' },
  { id: 'u-3', name: '龙龙爸爸', email: 'parent@home.com', role: UserRole.PARENT, studentIds: ['s-1'], classIds: ['cl-1'], avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Parent' },
  { id: 'u-4', name: '上海校区主管', email: 'sh@wonderland.com', role: UserRole.CAMPUS_ADMIN, campusId: 'cp-2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Executive' },
  { id: 'u-5', name: 'Ruby Teacher', email: 'ruby@wonderland.com', role: UserRole.TEACHER, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ruby', classIds: ['cl-1'], campusId: 'cp-1' }
];

const INITIAL_MESSAGES: Message[] = [
  { id: 'm-0', senderId: 'u-1', senderName: '系统公告', recipientId: 'GLOBAL', content: '欢迎使用 PointWonder 全新消息系统，支持全校广播与班级群聊！', timestamp: new Date(Date.now() - 86400000).toISOString(), isRead: false, type: 'GLOBAL' },
  { id: 'm-class-1', senderId: 'u-2', senderName: 'Sarah Teacher', recipientId: 'cl-1', content: '各位家长，明天的户外教学请准时到达集合点。', timestamp: new Date(Date.now() - 3600000).toISOString(), isRead: false, type: 'CLASS' },
  { id: 'm-1', senderId: 'u-2', senderName: 'Sarah Teacher', recipientId: 'u-3', content: 'Allen 今天的课堂表现非常出色！他在 Story Map 环节表现出了极强的逻辑思维能力。', timestamp: new Date(Date.now() - 1800000).toISOString(), isRead: false, type: 'DIRECT' },
];

const INITIAL_STUDENTS: Student[] = [
  { 
    id: 's-1', campusId: 'cp-1', classId: 'cl-1', name: '张小龙', englishName: 'Allen', 
    gender: 'MALE', birthday: '2016-05-20',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Allen', points: 450, coins: 1200, level: 3, totalHours: 12, paidHours: 40, groupId: 'A', 
    parentPhone: '13811112222', enrollmentDate: '2023-09-01',
    metrics: { homeworkStreak: 5, dictationAvg: 88, attendanceRate: 98, focusScore: 90, callOutCount: 1, breakCount: 0, isGroupLeader: true }
  },
  { 
    id: 's-2', campusId: 'cp-1', classId: 'cl-1', name: '李梅', englishName: 'Lily', 
    gender: 'FEMALE', birthday: '2017-02-14',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lily', points: 380, coins: 800, level: 2, totalHours: 10, paidHours: 32, groupId: 'B', 
    parentPhone: '13922223333', enrollmentDate: '2023-10-10',
    metrics: { homeworkStreak: 3, dictationAvg: 92, attendanceRate: 100, focusScore: 95, callOutCount: 0, breakCount: 0, isGroupLeader: false }
  }
];

const INITIAL_DICTATION_LISTS: DictationList[] = [
  { id: 'syllabus-1', title: 'Starter: Level 1 Phonics (大纲词库)', type: 'WORD', words: [{word: 'apple', translation: '苹果'}, {word: 'bag', translation: '包'}, {word: 'cat', translation: '猫'}], createdAt: new Date().toISOString(), createdBy: 'system', isPublic: true, isSyllabus: true },
  { id: 'list-1', title: 'Unit 3: My Family', type: 'WORD', words: [{word: 'father', translation: '父亲'}, {word: 'mother', translation: '母亲'}], createdAt: new Date().toISOString(), createdBy: 'u-2', isPublic: true }
];

const INITIAL_LESSON_PLANS: LessonPlanRecord[] = [
  {
    id: 'lp-1', classId: 'cl-1', teacherId: 'u-2', teacherName: 'Sarah Teacher', date: new Date().toISOString(),
    hour: 1, title: 'Welcome to Wonderland & Phonics A',
    teachingContents: '1. Ice breaking games. 2. Introduction to Letter A and B. 3. Group activity: Finding Magic Letters.',
    objectives: ['Students can recognize Letter A and B', 'Students can introduce themselves in English'],
    dictationListId: 'syllabus-1',
    notes: 'Focus on Allen\'s engagement.',
    syllabusId: 'syl-1'
  },
  {
    id: 'lp-past-1', classId: 'cl-99-old', teacherId: 'u-5', teacherName: 'Ruby Teacher', date: new Date(Date.now() - 86400000 * 30).toISOString(),
    hour: 1, title: 'Welcome & Phonics Intro',
    teachingContents: 'Used flashcards for A/B. Song: "Ants on the Apple".',
    objectives: ['Recognize A/B sounds'],
    notes: 'Kids loved the song.',
    syllabusId: 'syl-1'
  }
];

const INITIAL_LOGS: ActivityLog[] = [
  { id: 'log-1', teacherId: 'u-5', teacherName: 'Ruby Teacher', action: 'updated lesson plan', target: 'Phonics A (Class cl-99)', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'PLANNING' },
  { id: 'log-2', teacherId: 'u-2', teacherName: 'Sarah Teacher', action: 'uploaded resource', target: 'Phonics_Flashcards.pdf', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'UPLOAD' }
];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: INITIAL_ACCOUNTS[0],
    accounts: INITIAL_ACCOUNTS,
    campuses: INITIAL_CAMPUSES,
    classes: INITIAL_CLASSES,
    academicLevels: INITIAL_LEVELS,
    students: INITIAL_STUDENTS,
    messages: INITIAL_MESSAGES,
    homeworks: [],
    submissions: [],
    dictationLists: INITIAL_DICTATION_LISTS,
    dictationAssignments: [],
    dictationResults: [],
    activityLogs: INITIAL_LOGS,
    resources: [],
    lessonPlans: INITIAL_LESSON_PLANS,
    syllabus: INITIAL_SYLLABUS,
    classFeedback: [],
    products: [],
    activeCampusId: 'cp-1',
    activeClassId: 'cl-1',
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [timeLeft, setTimeLeft] = useState(60);
  const [initialTime, setInitialTime] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [selectedSoundId, setSelectedSoundId] = useState('wizard');
  const timerRef = useRef<any>(null);

  const unreadCount = useMemo(() => {
    if (!state.user) return 0;
    return state.messages.filter(m => {
      if (m.isRead) return false;
      if (m.recipientId === state.user.id) return true;
      if (m.type === 'GLOBAL') return true;
      if (m.type === 'CLASS' && state.user.classIds?.includes(m.recipientId) && m.senderId !== state.user.id) return true;
      return false;
    }).length;
  }, [state.messages, state.user]);

  const handleUpdateRole = (role: UserRole) => {
    const newUser = state.accounts.find(a => a.role === role) || state.accounts[0];
    setState(p => ({ ...p, user: newUser }));
  };

  const handleLogActivity = (action: string, target: string, type: ActivityLog['type']) => {
    if (!state.user) return;
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      teacherId: state.user.id,
      teacherName: state.user.name,
      action,
      target,
      timestamp: new Date().toISOString(),
      type
    };
    setState(prev => ({ ...prev, activityLogs: [newLog, ...prev.activityLogs] }));
  };

  useEffect(() => {
    if (isTimerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      announceTTS("Time is up! Magic learning session complete.");
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, timeLeft]);

  return (
    <Layout 
      activeRole={state.user?.role || UserRole.PARENT} 
      onRoleChange={handleUpdateRole} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      unreadCount={unreadCount}
      campuses={state.campuses}
      classes={state.classes}
      activeCampusId={state.activeCampusId}
      activeClassId={state.activeClassId}
      onUpdateCampus={(id) => setState(p => ({...p, activeCampusId: id, activeClassId: null}))}
      onUpdateClass={(id) => setState(p => ({...p, activeClassId: id}))}
    >
      {activeTab === 'dashboard' && <Dashboard state={state} onBindStudent={(id) => {
        const exists = state.students.some(s => s.id === id);
        if (!exists) throw new Error("无效的学员代码");
        setState(prev => ({
          ...prev,
          user: { ...prev.user!, studentIds: [...(prev.user?.studentIds || []), id] }
        }));
      }} />}
      
      {activeTab === 'archives' && <ClassArchives state={state} />}
      
      {activeTab === 'messages' && (
        <Messages 
          messages={state.messages} accounts={state.accounts} classes={state.classes} students={state.students} currentUser={state.user}
          onSendMessage={(rid, c, t) => setState(prev => ({...prev, messages: [...prev.messages, {id:`m-${Date.now()}`, senderId:prev.user?.id||'', senderName:prev.user?.name||'', recipientId:rid, content:c, timestamp:new Date().toISOString(), isRead:false, type:t}]}))}
          onMarkRead={(id) => setState(p => ({...p, messages: p.messages.map(m => m.id === id ? {...m, isRead:true} : m)}))}
          onMarkAllRead={(rid) => setState(p => ({...p, messages: p.messages.map(m => (rid === 'GLOBAL_ALL' || m.recipientId === rid || m.senderId === rid) ? {...m, isRead:true} : m)}))}
        />
      )}

      {activeTab === 'management' && (
        <Management 
          userRole={state.user?.role || UserRole.TEACHER}
          campuses={state.campuses} classes={state.classes} academicLevels={state.academicLevels} students={state.students} activeCampusId={state.activeCampusId}
          onUpdateCampus={(id) => setState(p => ({...p, activeCampusId: id, activeClassId: null}))}
          onAddCampus={(c) => setState(p => ({...p, campuses: [...p.campuses, c]}))}
          onDeleteCampus={(id) => setState(p => ({...p, campuses: p.campuses.filter(c => c.id !== id)}))}
          onAddClass={(c) => setState(p => ({...p, classes: [...p.classes, c]}))}
          onUpdateClass={(c) => setState(p => ({...p, classes: p.classes.map(old => old.id === c.id ? c : old)}))}
          onDeleteClass={(id) => setState(p => ({...p, classes: p.classes.filter(cl => cl.id !== id)}))}
          onAddLevel={(lv) => setState(p => ({...p, academicLevels: [...p.academicLevels, lv]}))}
          onUpdateLevel={(lv) => setState(p => ({...p, academicLevels: p.academicLevels.map(old => old.id === lv.id ? lv : old)}))}
          onDeleteLevel={(id) => setState(p => ({...p, academicLevels: p.academicLevels.filter(lv => lv.id !== id)}))}
          onImportStudents={(data) => {
            const lines = data.split('\n').filter(l => l.trim() && l.includes(','));
            const newStudents: Student[] = lines.map(line => {
              const [name, eng, phone] = line.split(',').map(s => s.trim());
              return {
                id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                campusId: state.activeCampusId || state.campuses[0].id,
                classId: state.activeClassId || '',
                name: name,
                englishName: eng,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${eng}`,
                gender: 'MALE',
                points: 0,
                coins: 0,
                level: 1,
                totalHours: 0,
                paidHours: 0,
                groupId: 'A',
                parentPhone: phone,
                enrollmentDate: new Date().toISOString(),
                metrics: { homeworkStreak: 0, dictationAvg: 0, attendanceRate: 100, focusScore: 0, callOutCount: 0, breakCount: 0, isGroupLeader: false }
              } as Student;
            });
            setState(p => ({ ...p, students: [...p.students, ...newStudents] }));
          }} 
        />
      )}

      {activeTab === 'dictation' && (
        <Dictation 
          lists={state.dictationLists}
          assignments={state.dictationAssignments}
          results={state.dictationResults}
          students={state.students}
          classes={state.classes}
          currentUser={state.user}
          activeClassId={state.activeClassId}
          onAddList={(l) => setState(p => ({...p, dictationLists: [...p.dictationLists, l]}))}
          onUpdateList={(l) => setState(p => ({...p, dictationLists: p.dictationLists.map(old => old.id === l.id ? l : old)}))}
          onDeleteList={(id) => setState(p => ({...p, dictationLists: p.dictationLists.filter(l => l.id !== id)}))}
          onAddAssignment={(a) => setState(p => ({...p, dictationAssignments: [...p.dictationAssignments, a]}))}
          onCompleteTest={(r) => setState(p => ({...p, dictationResults: [...p.dictationResults, r]}))}
        />
      )}

      {activeTab === 'points' && (
        <PointWonderland 
          students={state.students} userRole={state.user?.role || UserRole.PARENT} userStudentIds={state.user?.studentIds} activeClassId={state.activeClassId} activityLogs={state.activityLogs}
          onUpdatePoints={(sid, amt, reason) => {
            setState(prev => ({...prev, students: prev.students.map(s => s.id === sid ? { ...s, points: Math.max(0, s.points + amt), coins: Math.max(0, s.coins + amt * 2) } : s)}));
            if (state.user?.role !== UserRole.PARENT) handleLogActivity('awarded points', `${amt} pts for ${reason}`, 'POINTS');
          }}
          onUpdateMetrics={(sid, up) => setState(p => ({...p, students: p.students.map(s => s.id === sid ? {...s, metrics: {...s.metrics, ...up}} : s)}))}
        />
      )}

      {activeTab === 'timer' && (
        <TimerPage timeLeft={timeLeft} initialTime={initialTime} isRunning={isTimerRunning} onToggle={() => setIsTimerRunning(!isTimerRunning)} onReset={() => setTimeLeft(initialTime)} onSetTime={(s) => {setTimeLeft(s); setInitialTime(s);}} selectedSoundId={selectedSoundId} onSetSound={setSelectedSoundId} />
      )}

      {activeTab === 'toolbox' && <Toolbox state={state} />}
      {activeTab === 'mall' && <Mall students={state.students} products={state.products} currentUser={state.user} onAddProduct={(p) => {}} onUpdateProduct={(p) => {}} onDeleteProduct={(id) => {}} onRedeem={(sid, p) => {}} />}
      {activeTab === 'homework' && <HomeworkPage homeworks={state.homeworks} submissions={state.submissions} classes={state.classes} students={state.students} currentUser={state.user} activeClassId={state.activeClassId} onAddHomework={(hw) => {}} onUpdateSubmission={(sub) => {}} onSubmitHomework={(sub) => {}} onAwardPoints={(sid, amt) => {}} />}
      {activeTab === 'reports' && <Reports state={state} />}
      {activeTab === 'resources' && (
        <Resources 
          resources={state.resources} 
          dictationLists={state.dictationLists} 
          classes={state.classes} 
          activeClassId={state.activeClassId} 
          lessonPlans={state.lessonPlans} 
          feedbacks={state.classFeedback} 
          currentUser={state.user} 
          syllabus={state.syllabus}
          onAddResource={(r) => {
            setState(prev => ({...prev, resources: [...prev.resources, r]}));
            handleLogActivity('uploaded resource', r.title, 'UPLOAD');
          }} 
          onAddLessonPlan={(p) => {
            setState(prev => ({...prev, lessonPlans: [...prev.lessonPlans, p]}));
            handleLogActivity('created lesson plan', p.title, 'PLANNING');
          }} 
          onAddFeedback={(f) => {
            setState(prev => ({...prev, classFeedback: [...prev.classFeedback, f]}));
            handleLogActivity('submitted feedback', `For ${state.classes.find(c=>c.id===f.classId)?.name}`, 'FEEDBACK');
          }} 
        />
      )}
      {activeTab === 'accounts' && <AccountManagement currentUser={state.user} accounts={state.accounts} campuses={state.campuses} classes={state.classes} onAddAccount={(acc) => {}} onUpdateAccount={(acc) => {}} onDeleteAccount={(id) => {}} />}
    </Layout>
  );
};

export default App;
