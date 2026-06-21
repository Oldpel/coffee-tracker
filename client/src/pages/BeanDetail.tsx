import { useRoute, useLocation } from 'wouter';
import { trpc } from '../trpc';
import { useState } from 'react';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export default function BeanDetail() {
  const [, params] = useRoute('/beans/:id');
  const beanId = parseInt(params?.id || '0', 10);
  const [, setLocation] = useLocation();

  const { data: bean, isLoading: loadingBean } = trpc.beans.getById.useQuery({ id: beanId });
  const { data: records, isLoading: loadingRecords } = trpc.records.listByBean.useQuery({ beanId });

  // Add Record Form State
  const [showAddRecord, setShowAddRecord] = useState(false);
  const utils = trpc.useUtils();
  
  const createRecord = trpc.records.create.useMutation({
    onSuccess: () => {
      utils.records.listByBean.invalidate({ beanId });
      utils.records.getRecent.invalidate();
      setShowAddRecord(false);
    }
  });

  const deleteBean = trpc.beans.delete.useMutation({
    onSuccess: () => {
      utils.beans.list.invalidate();
      setLocation('/beans');
    }
  });

  const handleAddRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRecord.mutate({
      beanId,
      brewDate: formData.get('brewDate') as string || new Date().toISOString(),
      brewMethod: formData.get('brewMethod') as string,
      tasteRating: parseInt(formData.get('tasteRating') as string) || undefined,
      notes: formData.get('notes') as string,
    });
  };

  const handleDelete = () => {
    if (window.confirm("确定要删除这款咖啡豆吗？")) {
      deleteBean.mutate({ id: beanId });
    }
  };

  if (loadingBean) return <LiquidGlassPanel paddingClass="p-8 text-center text-gray-500">加载中...</LiquidGlassPanel>;
  if (!bean) return <LiquidGlassPanel paddingClass="p-8 text-center text-red-500">找不到该咖啡豆</LiquidGlassPanel>;

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => setLocation('/beans')} className="text-primary hover:text-primary/80 cursor-pointer flex items-center bg-white/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/50 transition-all hover:bg-white/60 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回列表
        </button>
        <button 
          onClick={handleDelete}
          disabled={deleteBean.isPending}
          className="text-red-500 hover:text-white bg-white/40 hover:bg-red-500 backdrop-blur-md px-4 py-2 rounded-xl border border-red-200/50 transition-all shadow-sm"
        >
          {deleteBean.isPending ? '删除中...' : '删除此豆子'}
        </button>
      </div>

      <LiquidGlassPanel paddingClass="p-8 mb-8" roundedClass="rounded-[30px]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 drop-shadow-sm">{bean.name}</h1>
          </div>
          <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold border border-primary/20 backdrop-blur-md shadow-sm">
            {bean.roastLevel}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-gray-200/50 pb-2 text-foreground">基本信息</h3>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <span className="text-gray-500 font-medium">产地</span>
              <span className="col-span-2 font-medium">{bean.origin || '未知'}</span>
              
              <span className="text-gray-500 font-medium">处理法</span>
              <span className="col-span-2 font-medium">{bean.processingMethod || '未知'}</span>
              
              <span className="text-gray-500 font-medium">购入日期</span>
              <span className="col-span-2 font-medium">
                {bean.purchaseDate ? new Date(bean.purchaseDate).toLocaleDateString() : '未知'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold border-b border-gray-200/50 pb-2 text-foreground">风味表现</h3>
            {bean.notes ? (
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{bean.notes}</p>
            ) : (
              <p className="text-gray-400 italic">暂无风味记录</p>
            )}
          </div>
        </div>
      </LiquidGlassPanel>

      <div className="flex justify-end mb-4">
        <button 
          onClick={() => setShowAddRecord(!showAddRecord)}
          className="glass-button"
        >
          {showAddRecord ? '取消添加' : '+ 添加冲煮记录'}
        </button>
      </div>

      {showAddRecord && (
        <LiquidGlassPanel paddingClass="p-6 mb-8" className="animate-fadeDown">
          <h3 className="text-lg font-semibold mb-4 text-foreground">记录一次新的冲煮</h3>
          <form onSubmit={handleAddRecord} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">冲煮日期</label>
                <input type="date" name="brewDate" required className="glass-input" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">冲煮方式</label>
                <select name="brewMethod" className="glass-input">
                  <option value="手冲">手冲</option>
                  <option value="意式">意式机</option>
                  <option value="法压壶">法压壶</option>
                  <option value="摩卡壶">摩卡壶</option>
                  <option value="冷萃">冷萃</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">口感评分 (1-10)</label>
                <input type="number" name="tasteRating" min="1" max="10" className="glass-input" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">冲煮笔记</label>
                <textarea name="notes" rows={3} className="glass-input" placeholder="记录研磨度、水温、粉水比以及风味体验..."></textarea>
              </div>
            </div>
            <div className="mt-4 text-right">
              <button type="submit" disabled={createRecord.isPending} className="glass-button">
                {createRecord.isPending ? '保存中...' : '保存记录'}
              </button>
            </div>
          </form>
        </LiquidGlassPanel>
      )}

      <LiquidGlassPanel paddingClass="p-8">
        <h2 className="text-xl font-semibold mb-6 text-foreground">冲煮历史</h2>
        {loadingRecords ? (
          <p className="text-gray-500">加载中...</p>
        ) : records && records.length > 0 ? (
          <div className="space-y-6">
            {records.map(record => {
              const realCurveData = record.curveData ? JSON.parse(record.curveData) : null;
              
              return (
                <div key={record.id} className="border-b border-gray-300/30 last:border-0 pb-6 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-lg text-foreground">{record.brewMethod || '未知方式'}</div>
                    <div className="text-sm text-gray-500">{new Date(record.brewDate).toLocaleDateString()}</div>
                  </div>
                  {record.tasteRating && (
                    <div className="mb-3 inline-block bg-primary/10 text-primary border border-primary/20 backdrop-blur-md px-2 py-1 rounded text-sm font-medium">
                      评分: {record.tasteRating}/10
                    </div>
                  )}
                  {record.notes && <p className="text-gray-700 text-sm mt-1 mb-4">{record.notes}</p>}

                  {realCurveData && (
                    <div className="h-64 w-full mt-4 bg-white/20 rounded-xl p-4 border border-white/40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={realCurveData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#94a3b8" />
                          <XAxis dataKey="time" stroke="#475569" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#6366f1" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', borderRadius: '12px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="weight" name="重量 (g)" stroke="#6366f1" strokeWidth={2} dot={false} />
                          <Line yAxisId="right" type="stepAfter" dataKey="flow" name="流速 (g/s)" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 italic">这支豆子还没有冲煮记录。</p>
        )}
      </LiquidGlassPanel>
    </div>
  );
}
