
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, UserRole, UserAccount, ClassInfo, Student } from '../types';
import { generateMessageDraft } from '../services/geminiService';

interface MessagesProps {
  messages: Message[];
  accounts: UserAccount[];
  classes: ClassInfo[];
  students: Student[];
  currentUser: UserAccount | null;
  onSendMessage: (recipientId: string, content: string, type: Message['type']) => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: (recipientId: string | 'GLOBAL_ALL') => void;
}

interface ChatGroup {
  id: string; // UserID, ClassID, or 'GLOBAL'
  name: string;
  avatar: string;
  lastMsg: Message | null;
  unreadCount: number;
  type: Message['type'];
  isTemp?: boolean;
}

const DRAFT_STORAGE_KEY = 'pointwonder_msg_drafts';

const Messages: React.FC<MessagesProps> = ({ messages, accounts, classes, students, currentUser, onSendMessage, onMarkRead, onMarkAllRead }) => {
  const [activeSideTab, setActiveSideTab] = useState<'chats' | 'contacts' | 'students'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [aiScenario, setAiScenario] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const showChatOnMobile = !!selectedChatId;

  // Persistence: Restore draft when switching conversations
  useEffect(() => {
    if (selectedChatId) {
      const allDrafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      setNewMsg(allDrafts[selectedChatId] || '');
    } else {
      setNewMsg('');
    }
  }, [selectedChatId]);

  // Persistence: Save draft on input change
  useEffect(() => {
    if (selectedChatId) {
      const allDrafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
      if (newMsg.trim()) {
        allDrafts[selectedChatId] = newMsg;
      } else {
        delete allDrafts[selectedChatId];
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(allDrafts));
    }
  }, [newMsg, selectedChatId]);

  // Filter messages relevant to current user
  const myMessages = useMemo(() => {
    if (!currentUser) return [];
    return messages.filter(m => {
      if (m.senderId === currentUser.id) return true;
      if (m.type === 'GLOBAL') return true;
      if (m.type === 'CLASS' && currentUser.classIds?.includes(m.recipientId)) return true;
      if (m.type === 'DIRECT' && m.recipientId === currentUser.id) return true;
      if (m.type === 'SYSTEM' && m.recipientId === currentUser.id) return true;
      return false;
    });
  }, [messages, currentUser]);

  const chatGroups = useMemo(() => {
    const groups: Record<string, ChatGroup> = {};

    groups['GLOBAL'] = {
      id: 'GLOBAL',
      name: '全校通知公告',
      avatar: '', 
      lastMsg: null,
      unreadCount: 0,
      type: 'GLOBAL'
    };

    currentUser?.classIds?.forEach(cid => {
      const cls = classes.find(c => c.id === cid);
      if (cls) {
        groups[cid] = {
          id: cid,
          name: `${cls.name} 班级圈`,
          avatar: '',
          lastMsg: null,
          unreadCount: 0,
          type: 'CLASS'
        };
      }
    });

    myMessages.forEach(m => {
      let bucketId = '';
      if (m.type === 'GLOBAL') bucketId = 'GLOBAL';
      else if (m.type === 'CLASS') bucketId = m.recipientId;
      else bucketId = m.senderId === currentUser?.id ? m.recipientId : m.senderId;

      if (!groups[bucketId]) {
        const otherUser = accounts.find(a => a.id === bucketId) || { name: m.senderName };
        groups[bucketId] = {
          id: bucketId,
          name: otherUser.name || '未知用户',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${bucketId}`,
          lastMsg: m,
          unreadCount: 0,
          type: m.type
        };
      }

      if (!groups[bucketId].lastMsg || new Date(m.timestamp) > new Date(groups[bucketId].lastMsg!.timestamp)) {
        groups[bucketId].lastMsg = m;
      }

      if (!m.isRead && m.recipientId === currentUser?.id && (m.type === 'DIRECT' || m.type === 'SYSTEM' || m.type === 'GLOBAL')) {
        groups[bucketId].unreadCount++;
      }
      if (!m.isRead && m.type === 'CLASS' && currentUser?.classIds?.includes(m.recipientId) && m.senderId !== currentUser?.id) {
         groups[bucketId].unreadCount++;
      }
    });

    let result = Object.values(groups).filter(g => g.lastMsg !== null || g.id === 'GLOBAL' || (currentUser?.classIds?.includes(g.id)));

    // Search Filtering
    if (searchTerm) {
      result = result.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        g.lastMsg?.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedChatId && !groups[selectedChatId]) {
      const contact = accounts.find(a => a.id === selectedChatId);
      if (contact) {
        result.unshift({
          id: contact.id,
          name: contact.name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`,
          lastMsg: null,
          unreadCount: 0,
          type: 'DIRECT',
          isTemp: true
        });
      }
    }

    return result.sort((a, b) => {
      const timeA = new Date(a.lastMsg?.timestamp || 0).getTime();
      const timeB = new Date(b.lastMsg?.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [myMessages, currentUser, accounts, classes, selectedChatId, searchTerm]);

  const filteredContacts = useMemo(() => {
    return accounts
      .filter(a => a.id !== currentUser?.id)
      .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts, currentUser, searchTerm]);

  const filteredStudents = useMemo(() => {
    return students
      .filter(s => s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.englishName.localeCompare(b.englishName));
  }, [students, searchTerm]);

  const activeChatMessages = useMemo(() => {
    if (!selectedChatId) return [];
    const group = chatGroups.find(g => g.id === selectedChatId);
    
    let baseMsgs = [];
    if (selectedChatId === 'GLOBAL') {
      baseMsgs = messages.filter(m => m.type === 'GLOBAL');
    } else if (group?.type === 'CLASS') {
      baseMsgs = messages.filter(m => m.type === 'CLASS' && m.recipientId === selectedChatId);
    } else {
      baseMsgs = myMessages.filter(m => 
        (m.senderId === selectedChatId && m.recipientId === currentUser?.id) ||
        (m.senderId === currentUser?.id && m.recipientId === selectedChatId)
      );
    }

    // Filter by search keyword if present
    if (searchTerm && selectedChatId) {
        return baseMsgs.filter(m => m.content.toLowerCase().includes(searchTerm.toLowerCase()))
                   .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    return baseMsgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedChatId, chatGroups, messages, myMessages, currentUser, searchTerm]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (selectedChatId) {
      onMarkAllRead(selectedChatId);
      inputRef.current?.focus();
    }
  }, [activeChatMessages, selectedChatId, onMarkAllRead]);

  const handleSend = () => {
    if (!newMsg.trim() || !selectedChatId || !currentUser) return;
    const group = chatGroups.find(g => g.id === selectedChatId) || { type: 'DIRECT' as Message['type'] };
    
    // Clear draft from localStorage upon successful send
    const allDrafts = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || '{}');
    delete allDrafts[selectedChatId];
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(allDrafts));

    onSendMessage(selectedChatId, newMsg, group.type);
    setNewMsg('');
  };

  const handleAiDraft = async () => {
    if (!aiScenario.trim() || !selectedChatId) return;
    setIsAiDrafting(true);
    try {
      const recipientName = chatGroups.find(g => g.id === selectedChatId)?.name || 'Recipient';
      const draft = await generateMessageDraft(aiScenario, recipientName);
      setNewMsg(draft);
      setAiScenario('');
    } catch (e) {
      console.error("AI drafting failed", e);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const startConversation = (id: string) => {
    setSelectedChatId(id);
    setActiveSideTab('chats');
  };

  const selectedGroup = chatGroups.find(g => g.id === selectedChatId);
  const canSend = useMemo(() => {
    if (!selectedGroup) return false;
    if (selectedGroup.type === 'GLOBAL') return currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.CAMPUS_ADMIN;
    if (selectedGroup.type === 'CLASS') return currentUser?.role !== UserRole.PARENT;
    return true;
  }, [selectedGroup, currentUser]);

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-10rem)] flex bg-white rounded-none md:rounded-[3rem] border-0 md:border shadow-none md:shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col shrink-0 bg-slate-50/30 ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-6 border-b bg-white space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">通讯中心</h3>
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => onMarkAllRead('GLOBAL_ALL')}
                 className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tight transition-all"
                 title="清除所有未读"
               >
                 全读
               </button>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveSideTab('chats')} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${activeSideTab === 'chats' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><i className="fas fa-comment-dots"></i></button>
                <button onClick={() => setActiveSideTab('contacts')} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${activeSideTab === 'contacts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><i className="fas fa-user-gear"></i></button>
                <button onClick={() => setActiveSideTab('students')} className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all ${activeSideTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><i className="fas fa-user-graduate"></i></button>
              </div>
            </div>
          </div>
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
            <input 
              type="text" placeholder="搜索联系人、消息或群组..."
              className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold outline-indigo-500 focus:ring-2"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeSideTab === 'chats' ? (
            <div className="divide-y divide-slate-100">
              {chatGroups.map(group => (
                <button 
                  key={group.id} onClick={() => setSelectedChatId(group.id)}
                  className={`w-full p-4 md:p-5 flex gap-3 md:gap-4 hover:bg-white transition-all text-left group border-l-4 ${selectedChatId === group.id ? 'bg-white border-indigo-600' : 'border-transparent'}`}
                >
                  <div className="relative shrink-0">
                    {group.id === 'GLOBAL' ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm"><i className="fas fa-bullhorn"></i></div>
                    ) : group.type === 'CLASS' ? (
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm"><i className="fas fa-school"></i></div>
                    ) : (
                      <img src={group.avatar} className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-indigo-50 shadow-sm" alt="" />
                    )}
                    {group.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">{group.unreadCount}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className="font-black text-slate-800 text-sm truncate">{group.name}</h4>
                      {group.lastMsg && <span className="text-[8px] text-slate-300 font-bold">{new Date(group.lastMsg.timestamp).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}</span>}
                    </div>
                    <p className="text-[10px] md:text-[11px] truncate font-medium text-slate-400">
                      {group.lastMsg ? group.lastMsg.content : (group.id === 'GLOBAL' ? '等待通知广播...' : '点击开始讨论')}
                    </p>
                  </div>
                </button>
              ))}
              {chatGroups.length === 0 && <div className="p-10 text-center text-slate-300 text-xs font-bold">未找到匹配的会话</div>}
            </div>
          ) : activeSideTab === 'contacts' ? (
            <div className="divide-y divide-slate-100">
              {filteredContacts.map(contact => (
                <button key={contact.id} onClick={() => startConversation(contact.id)} className="w-full p-4 md:p-5 flex items-center gap-3 hover:bg-white transition-all">
                  <img src={contact.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className="w-10 h-10 rounded-xl bg-slate-50" alt="" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 text-sm truncate">{contact.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{contact.role.replace('_', ' ')}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <button key={student.id} onClick={() => {
                   // In a real app, this might start a chat with the PARENT of the student
                   // For this demo, we'll find the parent account or a mock contact
                   const parent = accounts.find(a => a.studentIds?.includes(student.id));
                   if (parent) startConversation(parent.id);
                   else alert(`正在为您寻找 ${student.englishName} 的家长联系方式...`);
                }} className="w-full p-4 md:p-5 flex items-center gap-3 hover:bg-white transition-all">
                   <img src={student.avatar} className="w-10 h-10 rounded-xl bg-slate-50" alt="" />
                   <div className="flex-1 min-w-0">
                      <h4 className="font-black text-slate-800 text-sm truncate">{student.englishName} ({student.name})</h4>
                      <p className="text-[9px] text-indigo-500 font-bold uppercase">班级 ID: {student.classId}</p>
                   </div>
                   <i className="fas fa-comment-dots text-slate-200 group-hover:text-indigo-400"></i>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-white ${!showChatOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {selectedChatId ? (
          <>
            <div className="p-4 md:p-6 border-b flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
               <div className="flex items-center gap-3 md:gap-4">
                  <button onClick={() => setSelectedChatId(null)} className="md:hidden w-8 h-8 flex items-center justify-center text-slate-400"><i className="fas fa-arrow-left"></i></button>
                  <div className="relative">
                    {selectedChatId === 'GLOBAL' ? (
                       <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-amber-500 flex items-center justify-center text-white"><i className="fas fa-bullhorn"></i></div>
                    ) : selectedGroup?.type === 'CLASS' ? (
                       <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white"><i className="fas fa-school"></i></div>
                    ) : (
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatId}`} className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-indigo-50" alt="" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-800 text-sm md:text-base truncate">{selectedGroup?.name}</h3>
                    <p className="text-[8px] md:text-[10px] text-indigo-400 font-black uppercase tracking-widest">{selectedGroup?.type === 'GLOBAL' ? '广播频道' : selectedGroup?.type === 'CLASS' ? '班级群聊' : '私人对话'}</p>
                  </div>
               </div>
               
               {/* Search keywords within this chat */}
               <div className="hidden lg:flex items-center bg-slate-100 rounded-full px-4 py-1.5 border border-slate-200">
                  <i className="fas fa-magnifying-glass text-[10px] text-slate-400 mr-2"></i>
                  <input 
                    type="text" 
                    placeholder="在会话中搜索..." 
                    className="bg-transparent border-0 text-[10px] font-bold outline-none w-32" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-10 space-y-6 bg-slate-50/20 custom-scrollbar">
              {activeChatMessages.map((m, idx) => {
                const isMe = m.senderId === currentUser?.id;
                const isGroup = selectedGroup?.type === 'CLASS' || selectedGroup?.type === 'GLOBAL';
                
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.senderId}`} className="w-8 h-8 rounded-lg shadow-sm self-end mb-4" alt="" />
                      )}
                      <div className="space-y-1">
                        {!isMe && isGroup && <p className="text-[8px] font-black text-slate-400 uppercase ml-2 tracking-widest">{m.senderName}</p>}
                        <div className={`p-3 md:p-4 rounded-2xl text-xs md:text-sm font-bold shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                          {m.content}
                        </div>
                        <p className={`text-[7px] text-slate-300 font-bold ${isMe ? 'text-right' : 'text-left'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {activeChatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                   <i className="fas fa-comment-slash text-3xl mb-4 opacity-10"></i>
                   <p className="font-black text-[10px] uppercase tracking-widest">暂无相关消息记录</p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-8 border-t bg-white space-y-4">
              {canSend && (
                <div className="flex items-center gap-2">
                   <div className="flex-1 flex items-center bg-indigo-50/50 rounded-2xl px-4 py-1.5 border border-indigo-100">
                      <i className="fas fa-robot text-xs text-indigo-400 mr-3"></i>
                      <input 
                        type="text" 
                        placeholder="让 AI 帮你起草回复或通知... (如: 表扬学生)" 
                        className="bg-transparent border-0 text-[11px] font-bold outline-none flex-1"
                        value={aiScenario}
                        onChange={(e) => setAiScenario(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiDraft()}
                      />
                      <button 
                        onClick={handleAiDraft}
                        disabled={isAiDrafting || !aiScenario.trim()}
                        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-30"
                      >
                        {isAiDrafting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                      </button>
                   </div>
                </div>
              )}

              {canSend ? (
                <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all">
                  <textarea 
                    ref={inputRef} rows={1} placeholder="输入消息内容..."
                    className="flex-1 bg-transparent border-0 px-3 py-3 outline-none font-bold text-slate-700 text-xs md:text-sm resize-none custom-scrollbar min-h-[44px] max-h-32"
                    value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  />
                  <button onClick={handleSend} disabled={!newMsg.trim()} className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all ${newMsg.trim() ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'}`}>
                    <i className="fas fa-paper-plane text-xs"></i>
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-2xl text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-200">
                  当前账号暂无在此频道发布消息的权限
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-32 h-32 bg-indigo-50 rounded-[3rem] flex items-center justify-center text-indigo-200 text-5xl mb-8 shadow-inner"><i className="fas fa-comments"></i></div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-4">开启沟通之旅</h3>
            <p className="max-w-xs text-slate-400 font-bold text-xs leading-relaxed uppercase tracking-widest opacity-60">选择左侧会话或班级群组，开始同步最新动态。</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
