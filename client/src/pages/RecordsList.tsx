import { trpc } from '../trpc';
import { Link } from 'wouter';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from 'framer-motion';

export default function RecordsList() {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.records.getRecent.useQuery();
  const { data: beans } = trpc.beans.list.useQuery();

  const deleteRecord = trpc.records.delete.useMutation({
    onSuccess: () => {
      utils.records.getRecent.invalidate();
    }
  });

  if (isLoading) {
    return <div className="text-center mt-20 text-gray-500">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto relative z-10 pb-20">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/">
          <motion.button 
            className="text-primary hover:text-primary/80 cursor-pointer flex items-center bg-white/40 backdrop-blur-md px-4 py-2 rounded-xl border border-white/50 transition-all hover:bg-white/60 shadow-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回仪表盘
          </motion.button>
        </Link>
      </div>

      <LiquidGlassPanel paddingClass="p-8">
        <h1 className="text-2xl font-bold mb-8 text-foreground drop-shadow-sm">最近冲煮记录 (前20条)</h1>
        
        {records && records.length > 0 ? (
          <div className="space-y-6">
            {records.map(record => {
              const bean = beans?.find(b => b.id === record.beanId);
              const realCurveData = record.curveData ? JSON.parse(record.curveData) : null;
              
              return (
                <div key={record.id} className="border-b border-gray-300/30 last:border-0 pb-6 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                    <div>
                      <div className="font-bold text-lg text-foreground flex items-center flex-wrap gap-2">
                        {record.brewMethod || '未知方式'}
                        {bean && (
                          <Link href={`/beans/${bean.id}`}>
                            <span className="text-sm px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors">
                              {bean.name}
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium flex items-center gap-4">
                      <span>{new Date(record.brewDate).toLocaleString()}</span>
                      <button 
                        onClick={() => {
                          if (confirm('确定要删除这条记录吗？')) {
                            deleteRecord.mutate({ id: record.id });
                          }
                        }}
                        disabled={deleteRecord.isPending}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="删除记录"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </div>
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
                        <LineChart data={realCurveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#94a3b8" vertical={false} />
                          <XAxis dataKey="time" tickFormatter={(val) => `${val}s`} stroke="#475569" fontSize={11} tickMargin={5} />
                          <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#6366f1" fontSize={11} tickFormatter={(val) => `${val}g`} />
                          <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} stroke="#3b82f6" fontSize={11} tickFormatter={(val) => `${val}`} width={30} />
                          <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.5)', padding: '8px', fontSize: '12px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="weight" name="重量 (g)" stroke="#6366f1" strokeWidth={2} dot={false} isAnimationActive={false} />
                          <Line yAxisId="right" type="stepAfter" dataKey="flow" name="流速 (g/s)" stroke="#3b82f6" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            暂无任何冲煮记录
          </div>
        )}
      </LiquidGlassPanel>
    </div>
  );
}
