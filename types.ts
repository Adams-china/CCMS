
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CAMPUS_ADMIN = 'CAMPUS_ADMIN',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT'
}

export type DictationItemType = 'WORD' | 'PHRASE' | 'SENTENCE' | 'PARAGRAPH';
export type ToolType = 'VENN' | 'T_CHART' | 'WEB_CHART' | 'FISHBONE' | 'KWL' | 'STORY_MAP' | 'MATCHING' | 'WORD_MINER' | 'UNSCRAMBLE';

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  campusId?: string;
  classIds?: string[];
  studentIds?: string[];
  email: string;
  phone?: string;
  avatar?: string;
}

export interface DictationWord { 
  word: string; 
  translation: string; 
}

export interface DictationList { 
  id: string; 
  title: string; 
  type: DictationItemType;
  words: DictationWord[]; 
  createdAt: string; 
  createdBy: string;
  isPublic: boolean; 
  isSyllabus?: boolean; 
}

export interface DictationAssignment {
  id: string;
  listId: string;
  classId: string;
  teacherId: string;
  title: string;
  deadline: string;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: string;
}

/**
 * Interface for storing dictation test results
 */
export interface DictationResult {
  id: string;
  studentId: string;
  studentName: string;
  listId: string;
  assignmentId?: string;
  score: number;
  details: {
    word: string;
    input: string;
    isCorrect: boolean;
  }[];
  mistakes: string[];
  completedAt: string;
}

export interface SyllabusRecord {
  id: string;
  levelId: string;
  unit: string;
  lessonName: string;
  coreTopic: string;
  standardObjectives: string[];
  recommendedDuration: number; // in hours
}

export interface LessonPlanRecord { 
  id: string; 
  classId: string; 
  teacherId: string; 
  teacherName: string; 
  date: string; 
  hour: number; // 课时序号
  title: string; // 课程名称
  teachingContents: string; // 教学内容
  objectives: string[]; // 学习目标
  dictationListId?: string; // 关联听写词库ID
  notes?: string; // 备注
  syllabusId?: string; // 关联大纲ID
}

export interface AppState {
  user: UserAccount | null;
  accounts: UserAccount[];
  campuses: Campus[];
  classes: ClassInfo[];
  academicLevels: AcademicLevel[];
  students: Student[];
  messages: Message[];
  homeworks: Homework[];
  submissions: HomeworkSubmission[];
  dictationLists: DictationList[];
  dictationAssignments: DictationAssignment[];
  dictationResults: DictationResult[];
  activityLogs: ActivityLog[];
  resources: Resource[];
  syllabus: SyllabusRecord[];
  lessonPlans: LessonPlanRecord[];
  classFeedback: ClassFeedback[];
  products: Product[];
  activeCampusId: string | null;
  activeClassId: string | null;
}

export interface Campus { id: string; name: string; address: string; contact?: string; status: 'ACTIVE' | 'INACTIVE'; createdAt: string; }
export interface ClassSchedule { day: number; startTime: string; endTime: string; }
export interface ClassInfo { id: string; campusId: string; name: string; schedules: ClassSchedule[]; capacity?: number; level?: string; }
export interface AcademicLevel { id: string; name: string; lessonsCount: number; durationCategory: 'SHORT' | 'LONG'; season: 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER' | 'REGULAR'; isCore: boolean; }
export interface Student { 
  id: string; 
  classId: string; 
  campusId: string; 
  name: string; 
  englishName: string; 
  avatar: string; 
  gender: 'MALE' | 'FEMALE' | 'OTHER'; 
  points: number; 
  coins: number; 
  level: number; 
  totalHours: number; 
  paidHours: number; 
  groupId: string; 
  parentPhone: string; 
  enrollmentDate: string; 
  metrics: { homeworkStreak: number; dictationAvg: number; attendanceRate: number; focusScore: number; callOutCount: number; breakCount: number; isGroupLeader: boolean; }; 
  birthday?: string;
  notes?: string;
}
export interface Message { id: string; senderId: string; senderName: string; recipientId: string; content: string; timestamp: string; isRead: boolean; type: 'DIRECT' | 'SYSTEM' | 'URGENT' | 'CLASS' | 'GLOBAL'; }
export interface Homework { id: string; classId: string; teacherId: string; title: string; description: string; deadline: string; rewardPoints: number; createdAt: string; }
export interface HomeworkSubmission { id: string; homeworkId: string; studentId: string; studentName: string; content: string; imageUrl?: string; status: 'PENDING' | 'SUBMITTED' | 'GRADED'; grade?: 'A' | 'B' | 'C'; feedback?: string; }
export interface ActivityLog { 
  id: string; 
  teacherId: string; 
  teacherName: string; 
  action: string; 
  target: string; 
  timestamp: string; 
  type: 'UPLOAD' | 'UPDATE' | 'FEEDBACK' | 'POINTS' | 'SYSTEM' | 'PLANNING'; 
}
export interface Resource { id: string; title: string; category: 'Syllabus' | 'LessonPlan' | 'Material'; content: string; author: string; shared: boolean; visibility: 'TEACHERS' | 'PARENTS_TEACHERS'; fileType?: string; fileSize?: string; }
export interface ClassFeedback { 
  id: string; 
  classId: string; 
  teacherId: string; 
  teacherName: string;
  date: string; 
  lessonPlanId?: string;
  covered: string; 
  issues: string; 
  successes: string; 
  rating: number; 
}
export interface Product { id: string; name: string; price: number; stock: number; imageUrl: string; }
