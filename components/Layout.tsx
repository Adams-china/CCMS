
import React, { useState } from 'react';
import { UserRole, Campus, ClassInfo } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount: number;
  campuses: Campus[];
  classes: ClassInfo[];
  activeCampusId: string | null;
  activeClassId: string | null;
  onUpdateCampus: (id: string | null) => void;
  onUpdateClass: (id: string | null) => void;
}

interface NavItem {
  id: string;
  icon: string;
  label: string;
  showOnlyFor?: UserRole[];
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeRole, onRoleChange, activeTab, setActiveTab, unreadCount,
  campuses, classes, activeCampusId, activeClassId, onUpdateCampus, onUpdateClass
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 定义侧边栏功能组
  const navGroups: NavGroup[] = [
    {
      label: '枢纽中心',
      items: [
        { id: 'dashboard', icon: 'fa-gauge-high', label: '控制面板' },
        { id: 'management', icon: 'fa-school-circle-check', label: '校务管理' },
        { id: 'accounts', icon: 'fa-user-gear', label: '账号管理', showOnlyFor: [UserRole.SUPER_ADMIN, UserRole.CAMPUS_ADMIN] },
      ]
    },
    {
      label: '教学工坊',
      items: [
        { id: 'archives', icon: 'fa-folder-open', label: '班级档案' },
        { id: 'dictation', icon: 'fa-spell-check', label: '听写大师' },
        { id: 'homework', icon: 'fa-book-open-reader', label: '作业系统' },
      ]
    },
    {
      label: '激励成长',
      items: [
        { id: 'points', icon: 'fa-wand-sparkles', label: '点数乐园' },
        { id: 'mall', icon: 'fa-bag-shopping', label: '积分商城' },
        { id: 'timer', icon: 'fa-hourglass-start', label: '魔法计时器' },
      ]
    },
    {
      label: '资源辅助',
      items: [
        { id: 'resources', icon: 'fa-box-archive', label: '资源中心' },
        { id: 'toolbox', icon: 'fa-toolbox', label: '思维工具箱' },
        { id: 'reports', icon: 'fa-chart-pie', label: '学情报表' },
      ]
    },
    {
      label: '互动通讯',
      items: [
        { id: 'messages', icon: 'fa-comment-dots', label: '消息通知', badge: unreadCount },
      ]
    }
  ];

  // 权限过滤逻辑
  const visibleGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (activeRole === UserRole.PARENT) {
        // 家长仅可见部分功能
        return ['dashboard', 'points', 'dictation', 'homework', 'mall', 'reports', 'messages', 'resources'].includes(item.id);
      }
      if (item.showOnlyFor) return item.showOnlyFor.includes(activeRole);
      return true;
    })
  })).filter(group => group.items.length > 0);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300">
      <div className="p-8 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg rotate-3">
          <i className="fas fa-magic"></i>
        </div>
        <span className="font-black text-white text-xl tracking-tight">PointWonder</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-8">
        {/* 全局校区/班级选择器 (仅老师/管理员可见) */}
        {activeRole !== UserRole.PARENT && (
          <div className="space-y-4 px-2 mb-6">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest block px-1">校区范围</label>
              <select 
                className="w-full bg-white/5 text-white px-3 py-2.5 rounded-xl text-xs outline-none border border-white/10 font-bold appearance-none cursor-pointer hover:border-indigo-500 transition-all"
                value={activeCampusId || ''}
                onChange={(e) => onUpdateCampus(e.target.value || null)}
              >
                <option value="" className="bg-slate-900">全校区视图</option>
                {campuses.map(c => <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-slate-500 tracking-widest block px-1">活跃班级</label>
              <select 
                className="w-full bg-white/5 text-white px-3 py-2.5 rounded-xl text-xs outline-none border border-white/10 font-bold appearance-none cursor-pointer hover:border-indigo-500 transition-all"
                value={activeClassId || ''}
                onChange={(e) => onUpdateClass(e.target.value || null)}
              >
                <option value="" className="bg-slate-900">选择活跃班级...</option>
                {classes.filter(cls => !activeCampusId || cls.campusId === activeCampusId).map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {visibleGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-2">
            <h4 className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{group.label}</h4>
            <div className="space-y-1">
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 translate-x-1' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <i className={`fas ${item.icon} w-5 text-center text-sm ${activeTab === item.id ? 'text-white' : 'text-indigo-400/60'}`}></i>
                    <span className="font-bold text-xs tracking-tight">{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-black/30 border-t border-white/5">
        <label className="text-[9px] uppercase font-black text-slate-500 block mb-3 px-1 tracking-widest">身份模拟</label>
        <select 
          className="w-full bg-slate-800 text-white px-4 py-2.5 rounded-xl text-[10px] outline-none border border-slate-700 font-bold cursor-pointer transition-colors"
          value={activeRole}
          onChange={(e) => onRoleChange(e.target.value as UserRole)}
        >
          {Object.values(UserRole).map(role => (
            <option key={role} value={role} className="bg-slate-900">{role.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <aside className="hidden lg:flex w-72 flex-col shrink-0 shadow-2xl z-40 relative">
        {sidebarContent}
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[60]" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`lg:hidden fixed inset-y-0 left-0 w-72 z-[70] transform transition-transform duration-500 ease-out shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="bg-white/90 backdrop-blur-xl h-16 border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <button className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center" onClick={() => setIsMobileMenuOpen(true)}>
              <i className="fas fa-bars-staggered"></i>
            </button>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">
               {navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'PointWonder'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">系统当前角色</p>
              <p className="text-xs font-bold text-slate-800 uppercase">{activeRole.replace('_', ' ')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
               <i className="fas fa-user-shield"></i>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-10 scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
