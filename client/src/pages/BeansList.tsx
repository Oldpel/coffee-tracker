import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '../trpc';
import LiquidGlassPanel from '../components/LiquidGlassPanel';

export default function BeansList() {
  const { data: beans, isLoading } = trpc.beans.list.useQuery();
  const [showAddForm, setShowAddForm] = useState(false);
  const utils = trpc.useUtils();

  const createBean = trpc.beans.create.useMutation({
    onSuccess: () => {
      utils.beans.list.invalidate();
      setShowAddForm(false);
    }
  });

  const handleAddBean = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createBean.mutate({
      name: formData.get('name') as string,
      origin: formData.get('origin') as string,
      processingMethod: formData.get('processingMethod') as string,
      roastLevel: formData.get('roastLevel') as string,
      purchaseDate: formData.get('purchaseDate') as string || new Date().toISOString(),
      notes: formData.get('notes') as string,
    });
  };

  return (
    <div className="space-y-6 relative z-10 pb-20">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">我的咖啡豆</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="glass-button"
        >
          {showAddForm ? '取消添加' : '添加新豆子'}
        </button>
      </div>

      {showAddForm && (
        <LiquidGlassPanel paddingClass="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">录入新咖啡豆</h3>
          <form onSubmit={handleAddBean} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">名称 *</label>
                <input type="text" name="name" required className="glass-input" placeholder="例如：耶加雪菲" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">产地</label>
                <input type="text" name="origin" className="glass-input" placeholder="例如：埃塞俄比亚" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">处理法</label>
                <select name="processingMethod" className="glass-input">
                  <option value="">未知</option>
                  <option value="水洗">水洗</option>
                  <option value="日晒">日晒</option>
                  <option value="蜜处理">蜜处理</option>
                  <option value="厌氧发酵">厌氧发酵</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">烘焙度</label>
                <select name="roastLevel" className="glass-input">
                  <option value="">未知</option>
                  <option value="极浅焙">极浅焙</option>
                  <option value="浅焙">浅焙</option>
                  <option value="中浅焙">中浅焙</option>
                  <option value="中焙">中焙</option>
                  <option value="深焙">深焙</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">入手日期</label>
                <input type="date" name="purchaseDate" className="glass-input" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">风味备注</label>
                <textarea name="notes" rows={2} className="glass-input" placeholder="例如：明显的茉莉花香、柑橘酸..."></textarea>
              </div>
            </div>
            <div className="mt-6">
              <button type="submit" disabled={createBean.isPending} className="glass-button w-full sm:w-auto">
                {createBean.isPending ? '保存中...' : '保存豆子'}
              </button>
            </div>
          </form>
        </LiquidGlassPanel>
      )}
      
      {isLoading ? (
        <LiquidGlassPanel paddingClass="p-8 text-center text-gray-500 font-medium">
          正在加载您的咖啡豆...
        </LiquidGlassPanel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {beans?.map((bean: any) => (
            <Link key={bean.id} href={`/beans/${bean.id}`}>
              <div className="block h-full">
                <LiquidGlassPanel className="h-full cursor-pointer hover:scale-[1.02] transition-all duration-300 group" paddingClass="p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{bean.name}</h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">烘焙度</span>
                      <span>{bean.roastLevel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">处理法</span>
                      <span>{bean.processingMethod}</span>
                    </div>
                    {bean.origin && (
                      <div className="flex justify-between">
                        <span className="font-medium">产地</span>
                        <span>{bean.origin}</span>
                      </div>
                    )}
                  </div>
                </LiquidGlassPanel>
              </div>
            </Link>
          ))}
          
          {beans?.length === 0 && (
            <div className="col-span-full">
              <LiquidGlassPanel paddingClass="py-12 text-center text-gray-500">
                <p className="text-lg font-medium">还没有添加咖啡豆</p>
                <p className="text-sm mt-2">点击右下角的 "+" 按钮添加你的第一款咖啡豆吧</p>
              </LiquidGlassPanel>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-20">
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary backdrop-blur-md border border-white/40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
