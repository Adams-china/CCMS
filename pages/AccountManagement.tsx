
import React, { useState } from 'react';
import { UserAccount, UserRole, Campus, ClassInfo, Student } from '../types';

interface AccountManagementProps {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  campuses: Campus[];
  classes: ClassInfo[];
  onAddAccount: (acc: UserAccount) => void;
  onUpdateAccount: (acc: UserAccount) => void;
  onDeleteAccount: (id: string) => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({ 
  currentUser, accounts, campuses, classes, onAddAccount, onUpdateAccount, onDeleteAccount 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<UserAccount>>({ role: UserRole.TEACHER });

  const managedAccounts = accounts.filter(acc => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
    if (currentUser?.role === UserRole.CAMPUS_ADMIN) {
      return acc.campusId === currentUser.campusId && acc.role !== UserRole.SUPER_ADMIN && acc.role !== UserRole.CAMPUS_ADMIN;
    }
    return false;
  });

  const handleSave = () => {
    if (!formData.name || !formData.role) return;
    const newAccount: UserAccount = {
      id: `acc-${Date.now()}`,
      name: formData.name,
      email: formData.email || '',
      role: formData.role as UserRole,
      campusId: currentUser?.role === UserRole.CAMPUS_ADMIN ? currentUser.campusId : formData.campusId,
      classIds: formData.classIds,
      studentIds: formData.studentIds,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`
    };
    onAddAccount(newAccount);
    setIsModalOpen(false);
    setFormData({ role: UserRole.TEACHER });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">人员与账号系统</h2>
          <p className="text-slate-400 text-xs font-bold uppercase mt-1">
            {currentUser?.role === UserRole.SUPER_ADMIN ? '系统全局权限' : `校区管理: ${campuses.find(c => c.id === currentUser?.campusId)?.name}`}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition flex items-center gap-2"
        >
          <i className="fas fa-user-plus"></i> 创建新账号
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managedAccounts.map(acc => (
          <div key={acc.id} className="bg-white rounded-[2.5rem] p-6 border shadow-sm hover:shadow-xl transition relative group">
            <div className="flex items-center gap-4 mb-6">
              <img src={acc.avatar} className="w-16 h-16 rounded-2xl border-4 border-slate-50 shadow-inner" alt="" />
              <div>
                <h4 className="font-black text-slate-800">{acc.name}</h4>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                  acc.role === UserRole.CAMPUS_ADMIN ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  acc.role === UserRole.TEACHER ? 'bg-indigo-50 text-indigo-600 border-indigo-200' :
                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {acc.role.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <i className="fas fa-envelope w-4"></i> {acc.email || '未绑定邮箱'}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <i className="fas fa-school w-4"></i> {campuses.find(c => c.id === acc.campusId)?.name || '全校区'}
              </div>
              {acc.role === UserRole.PARENT && acc.studentIds && acc.studentIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-50 space-y-2">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">已绑定学员代码</p>
                   <div className="flex flex-wrap gap-2">
                      {acc.studentIds.map(sid => (
                        <span key={sid} className="bg-indigo-50 text-indigo-600 text-[9px] font-black px-2 py-1 rounded-md border border-indigo-100">
                           {sid}
                        </span>
                      ))}
                   </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t flex gap-2">
              <button className="flex-1 py-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase transition border border-transparent hover:border-indigo-100">
                编辑
              </button>
              <button 
                onClick={() => onDeleteAccount(acc.id)}
                className="flex-1 py-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl text-[10px] font-black uppercase transition border border-transparent hover:border-rose-100"
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-white rounded-[3rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <i className="fas fa-id-card text-indigo-600"></i> 创建新档案
              </h3>
              <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">姓名</label>
                   <input 
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 font-bold"
                    value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">角色权限</label>
                   <select 
                    className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 font-bold"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                   >
                     {currentUser?.role === UserRole.SUPER_ADMIN && <option value={UserRole.CAMPUS_ADMIN}>校区管理员</option>}
                     <option value={UserRole.TEACHER}>教师</option>
                     <option value={UserRole.PARENT}>家长</option>
                   </select>
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase">取消</button>
                 <button onClick={handleSave} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-xl uppercase">创建账号</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
