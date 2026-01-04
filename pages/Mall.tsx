
import React, { useState, useMemo } from 'react';
import { Student, Product, UserRole, UserAccount } from '../types';

interface MallProps {
  students: Student[];
  products: Product[];
  currentUser: UserAccount | null;
  onAddProduct: (p: Product) => void;
  onUpdateProduct: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRedeem: (studentId: string, product: Product) => void;
}

const Mall: React.FC<MallProps> = ({ students, products, currentUser, onAddProduct, onUpdateProduct, onDeleteProduct, onRedeem }) => {
  const isParent = currentUser?.role === UserRole.PARENT;
  const isAdmin = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.CAMPUS_ADMIN;

  const [view, setView] = useState<'shop' | 'admin'>(isAdmin ? 'admin' : 'shop');
  const [isAdding, setIsAdding] = useState(false);
  
  // Filter students based on parental ownership
  const filteredStudents = useMemo(() => {
    if (isParent) {
      return students.filter(s => currentUser?.studentIds?.includes(s.id));
    }
    return students;
  }, [students, isParent, currentUser]);

  const [selectedStudentId, setSelectedStudentId] = useState(filteredStudents[0]?.id || '');
  const [newProd, setNewProd] = useState({ name: '', price: 1, stock: 10, imageUrl: '' });

  const handleAdd = () => {
    if (!newProd.name) return;
    onAddProduct({
      id: Date.now().toString(),
      name: newProd.name,
      price: newProd.price,
      stock: newProd.stock,
      imageUrl: newProd.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`
    });
    setNewProd({ name: '', price: 1, stock: 10, imageUrl: '' });
    setIsAdding(false);
  };

  const selectedStudent = filteredStudents.find(s => s.id === selectedStudentId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">PointWonder Mall</h2>
          <p className="text-slate-500 font-medium">Redeem your hard-earned points for magic items!</p>
        </div>
        {isAdmin && (
          <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
            <button onClick={() => setView('shop')} className={`px-6 py-2 rounded-xl font-black text-xs transition ${view === 'shop' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Shop</button>
            <button onClick={() => setView('admin')} className={`px-6 py-2 rounded-xl font-black text-xs transition ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Inventory</button>
          </div>
        )}
      </div>

      {view === 'shop' && (
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 shadow-inner">
           <div className="flex items-center gap-4 flex-1">
              <div className="w-16 h-16 rounded-full bg-white border-4 border-indigo-200 flex items-center justify-center text-indigo-500 text-2xl shadow-sm">
                 <i className="fas fa-user-tag"></i>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase text-indigo-400">Current Shopper</p>
                {filteredStudents.length > 1 ? (
                  <select 
                    className="bg-transparent border-0 font-black text-indigo-900 text-lg outline-none cursor-pointer"
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                  >
                    {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.englishName} ({s.name})</option>)}
                  </select>
                ) : (
                  <span className="font-black text-indigo-900 text-lg">
                    {selectedStudent?.englishName || 'No bound children'}
                  </span>
                )}
              </div>
           </div>
           <div className="bg-white px-8 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-4">
              <i className="fas fa-star text-amber-500 text-xl"></i>
              <div>
                <p className="text-3xl font-black text-slate-800 leading-none">{selectedStudent?.points || 0}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Available Points</p>
              </div>
           </div>
        </div>
      )}

      {view === 'shop' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
              <div className="h-56 overflow-hidden relative">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute top-5 right-5 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black shadow-sm uppercase ${p.stock > 0 ? 'bg-white/90 text-indigo-600' : 'bg-rose-500 text-white'}`}>
                  {p.stock > 0 ? `${p.stock} In Stock` : 'Sold Out'}
                </div>
              </div>
              <div className="p-8">
                <h4 className="font-black text-slate-800 text-xl mb-2">{p.name}</h4>
                <div className="flex items-center gap-2 text-amber-500 font-black mb-6">
                  <i className="fas fa-star text-sm"></i>
                  <span className="text-lg">{p.price} Points</span>
                </div>
                <button 
                  disabled={p.stock <= 0 || (selectedStudent?.points || 0) < p.price}
                  onClick={() => onRedeem(selectedStudentId, p)}
                  className="w-full bg-slate-50 text-indigo-600 py-4 rounded-2xl font-black text-sm hover:bg-indigo-600 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-indigo-600 transition-all shadow-md active:scale-95"
                >
                  Redeem Gift
                </button>
              </div>
            </div>
          ))}
          {products.length === 0 && (
             <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center text-slate-300">
                <i className="fas fa-gift text-5xl mb-4 opacity-10"></i>
                <p className="font-bold">The mall is empty. Restock soon!</p>
             </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
            <div className="p-8 border-b flex flex-col sm:flex-row justify-between items-center gap-4">
              <h3 className="text-xl font-black text-slate-800">Inventory Control Center</h3>
              <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all">
                <i className="fas fa-plus mr-2"></i> Create New Item
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <th className="px-8 py-5">Item Details</th>
                    <th className="px-8 py-5">Redemption Price</th>
                    <th className="px-8 py-5">Current Stock</th>
                    <th className="px-8 py-5">Availability</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <img src={p.imageUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" alt="" />
                           <span className="font-black text-slate-800">{p.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-amber-500 font-black">
                           <i className="fas fa-star text-xs"></i>
                           {p.price}
                        </div>
                      </td>
                      <td className="px-8 py-6 font-bold text-slate-600">{p.stock} units</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase border ${p.stock > 5 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {p.stock > 5 ? 'High Stock' : p.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => onDeleteProduct(p.id)} className="text-slate-300 hover:text-rose-500 transition-colors mx-2"><i className="fas fa-trash"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isAdding && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
               <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-10 animate-in zoom-in-95 duration-200">
                  <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                    <i className="fas fa-magic text-indigo-600"></i> New Mall Item
                  </h3>
                  <div className="space-y-6">
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Product Title</label>
                       <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 font-bold" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Price (Points)</label>
                          <input type="number" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 font-bold" value={newProd.price} onChange={e => setNewProd({...newProd, price: parseFloat(e.target.value)})} />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Initial Stock</label>
                          <input type="number" className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 font-bold" value={newProd.stock} onChange={e => setNewProd({...newProd, stock: parseInt(e.target.value)})} />
                        </div>
                     </div>
                     <div>
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Photo Link</label>
                       <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 p-4 rounded-2xl outline-indigo-500 text-xs font-mono" placeholder="https://..." value={newProd.imageUrl} onChange={e => setNewProd({...newProd, imageUrl: e.target.value})} />
                     </div>
                  </div>
                  <div className="flex gap-4 mt-10">
                     <button onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Discard</button>
                     <button onClick={handleAdd} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100">Add to Store</button>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Mall;
