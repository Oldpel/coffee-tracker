import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { trpc } from '../trpc';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const { data: beans } = trpc.beans.list.useQuery();
  const { data: records, refetch: refetchRecords } = trpc.records.getRecent.useQuery();
  const uploadMutation = trpc.records.uploadCurve.useMutation();
  const createRecordMutation = trpc.records.create.useMutation();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [inputMode, setInputMode] = useState<'csv' | 'espresso' | 'pourover'>('csv');
  const [selectedBeanId, setSelectedBeanId] = useState<string>('');

  // Espresso State
  const [espressoTime, setEspressoTime] = useState('');
  const [espressoYield, setEspressoYield] = useState('');

  // Pourover State
  const [pouroverNodes, setPouroverNodes] = useState([
    { time: '0', weight: '0' }, 
    { time: '', weight: '' }
  ]);

  // Curve viewing state
  const [viewRecordId, setViewRecordId] = useState<number | null>(null);

  useEffect(() => {
    if (beans && beans.length > 0 && !selectedBeanId) {
      setSelectedBeanId(beans[0].id.toString());
    }
  }, [beans]);

  const recordsWithCurves = records?.filter(r => r.curveData) || [];
  const activeRecord = viewRecordId 
    ? recordsWithCurves.find(r => r.id === viewRecordId) 
    : recordsWithCurves[0];
  const realCurveData = activeRecord?.curveData ? JSON.parse(activeRecord.curveData) : null;

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      await submitCsvString(text, 'CSV文件上传');
    } catch (e: any) {
      alert(`上传失败: ${e.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const submitCsvString = async (csvData: string, methodNotes: string) => {
    if (!beans || beans.length === 0) {
      throw new Error("请先去“我的豆子”添加一款咖啡豆，然后再上传冲煮曲线！");
    }
    const targetBeanId = selectedBeanId ? parseInt(selectedBeanId) : beans[0].id;

    // 每次都创建一条新记录来保存这条曲线，而不是覆盖
    const newRecord = await createRecordMutation.mutateAsync({
      beanId: targetBeanId,
      brewDate: new Date().toISOString(),
      brewMethod: methodNotes.includes('意式') ? '意式' : (methodNotes.includes('手冲') ? '手冲' : 'Pour-over'),
      notes: methodNotes
    });

    await uploadMutation.mutateAsync({
      id: newRecord.id,
      csvData: csvData
    });

    alert('保存成功！');
    refetchRecords();
    setViewRecordId(newRecord.id);
    setShowModal(false);
  };

  const handleManualSubmit = async () => {
    setIsUploading(true);
    try {
      let csv = "Time,Weight\n";
      let methodStr = "";

      if (inputMode === 'espresso') {
        const t = parseFloat(espressoTime);
        const y = parseFloat(espressoYield);
        if (isNaN(t) || isNaN(y) || t <= 0) throw new Error("请输入有效的意式萃取参数");
        
        // Generate 1-second intervals
        for (let curr = 0; curr < t; curr++) {
          csv += `${curr},${((curr / t) * y).toFixed(2)}\n`;
        }
        csv += `${t},${y}\n`;
        methodStr = `意式手动记录 (时间: ${t}s, 液重: ${y}g)`;

      } else if (inputMode === 'pourover') {
        // Validate nodes
        const sorted = [...pouroverNodes]
          .map(n => ({ t: parseFloat(n.time), w: parseFloat(n.weight) }))
          .filter(n => !isNaN(n.t) && !isNaN(n.w))
          .sort((a, b) => a.t - b.t);

        if (sorted.length < 2) throw new Error("至少需要两个有效的时间节点");
        if (sorted[0].t !== 0) throw new Error("第一个节点的时间必须为 0");

        for (let i = 0; i < sorted.length - 1; i++) {
          const nodeA = sorted[i];
          const nodeB = sorted[i+1];
          if (nodeA.t === nodeB.t) continue;

          for (let currT = nodeA.t; currT < nodeB.t; currT++) {
            const progress = (currT - nodeA.t) / (nodeB.t - nodeA.t);
            const currW = nodeA.w + progress * (nodeB.w - nodeA.w);
            csv += `${currT},${currW.toFixed(2)}\n`;
          }
        }
        const last = sorted[sorted.length - 1];
        csv += `${last.t},${last.w}\n`;
        methodStr = `手冲手动记录 (${sorted.length} 个注水节点)`;
      }

      await submitCsvString(csv, methodStr);
      
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-end mb-6 relative z-10">
        <h1 className="text-3xl font-bold">概览</h1>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          onClick={() => setShowModal(true)}
          className="glass-button px-6 shadow-sm"
        >
          + 记录/上传冲煮曲线
        </motion.button>
      </div>

      <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-md"
            onClick={() => setShowModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg relative z-10 bg-white/90 backdrop-blur-xl shadow-2xl"
            style={{ borderRadius: '1.5rem', overflow: 'hidden' }}
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ delay: 0.1, duration: 0.2 }}
              className="p-8 w-full h-full relative"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 z-20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-foreground mb-6"
              >
                曲线数据录入
              </motion.h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">选择关联的咖啡豆</label>
              <select 
                value={selectedBeanId} 
                onChange={e => setSelectedBeanId(e.target.value)} 
                className="glass-input w-full"
              >
                {beans?.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="flex space-x-2 mb-6 bg-white/40 p-1 rounded-xl">
              {[
                { id: 'csv', label: '上传 CSV' },
                { id: 'espresso', label: '手动意式' },
                { id: 'pourover', label: '手动手冲' }
              ].map(mode => (
                <button 
                  key={mode.id}
                  onClick={() => setInputMode(mode.id as any)} 
                  className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === mode.id ? 'text-primary' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  {inputMode === mode.id && (
                    <motion.div
                      layoutId="dashboard-mode-indicator"
                      className="absolute inset-0 bg-white shadow-sm z-0"
                      style={{ borderRadius: 8 }}
                      transition={{ type: "spring", stiffness: 450, damping: 25, mass: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{mode.label}</span>
                </button>
              ))}
            </div>

            {inputMode === 'csv' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">上传智能秤导出的 CSV 文件。请确保包含 `Time` 与 `Weight` 列。</p>
                <input 
                  type="file" accept=".csv,.json" className="hidden" ref={fileInputRef} onChange={handleCsvUpload} 
                />
                <motion.button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full glass-button mt-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isUploading ? '保存中...' : '选择文件并上传'}
                </motion.button>
              </div>
            )}

            {inputMode === 'espresso' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">输入总萃取时间和液重，将自动计算出平均流速曲线。</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">总萃取时间 (秒)</label>
                  <input type="number" value={espressoTime} onChange={e => setEspressoTime(e.target.value)} className="glass-input" placeholder="例如：30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">最终萃取液重 (克)</label>
                  <input type="number" value={espressoYield} onChange={e => setEspressoYield(e.target.value)} className="glass-input" placeholder="例如：36" />
                </div>
                <button onClick={handleManualSubmit} disabled={isUploading} className="w-full glass-button mt-6">
                  {isUploading ? '保存中...' : '生成并保存曲线'}
                </button>
              </div>
            )}

            {inputMode === 'pourover' && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-gray-600 mb-2">输入注水节点，系统会自动计算各阶段的平均注水流速并绘制平滑曲线。</p>
                <div className="space-y-3">
                  <div className="flex font-medium text-sm text-gray-700 ml-1">
                    <div className="w-1/2">时间节点 (秒)</div>
                    <div className="w-1/2">累积液重 (克)</div>
                  </div>
                  {pouroverNodes.map((node, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input 
                        type="number" value={node.time} 
                        onChange={e => {
                          const n = [...pouroverNodes]; n[i].time = e.target.value; setPouroverNodes(n);
                        }} 
                        className="glass-input" placeholder="秒" 
                        disabled={i === 0} // First node should always be 0s
                      />
                      <input 
                        type="number" value={node.weight} 
                        onChange={e => {
                          const n = [...pouroverNodes]; n[i].weight = e.target.value; setPouroverNodes(n);
                        }} 
                        className="glass-input" placeholder="克" 
                      />
                      {i > 0 && (
                        <button onClick={() => {
                          const n = [...pouroverNodes]; n.splice(i, 1); setPouroverNodes(n);
                        }} className="text-red-400 hover:text-red-600 p-2">✕</button>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={() => setPouroverNodes([...pouroverNodes, { time: '', weight: '' }])}
                    className="text-primary text-sm font-medium hover:text-primary/80"
                  >
                    + 添加新节点
                  </button>
                </div>
                <button onClick={handleManualSubmit} disabled={isUploading} className="w-full glass-button mt-6">
                  {isUploading ? '保存中...' : '生成并保存曲线'}
                </button>
              </div>
            )}

            </motion.div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <Link href="/beans" className="block">
          <LiquidGlassPanel paddingClass="p-6" className="flex flex-col justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 h-full group">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">我的咖啡豆库</h2>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <p className="text-4xl font-bold text-primary mt-2 drop-shadow-sm">
              {beans?.length || 0} <span className="text-lg text-gray-600 font-medium">款</span>
            </p>
          </LiquidGlassPanel>
        </Link>
        
        <Link href="/records" className="block">
          <LiquidGlassPanel paddingClass="p-6" className="flex flex-col justify-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 h-full group">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground group-hover:text-secondary transition-colors">最近冲煮记录</h2>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </div>
            <p className="text-4xl font-bold text-secondary mt-2 drop-shadow-sm">
              {records?.length || 0} <span className="text-lg text-gray-600 font-medium">次</span>
            </p>
          </LiquidGlassPanel>
        </Link>
      </div>

      {/* Brewing Curve Chart */}
      <div className="relative z-10">
        <LiquidGlassPanel paddingClass="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-foreground flex items-center">
              冲煮曲线图 
              {realCurveData && <span className="text-sm font-normal text-green-700 bg-green-100/50 backdrop-blur-md px-2 py-1 rounded ml-3 border border-green-200/50 whitespace-nowrap">有效数据</span>}
            </h2>
            
            {recordsWithCurves.length > 0 && (
              <select 
                value={activeRecord?.id || ''} 
                onChange={e => setViewRecordId(parseInt(e.target.value))}
                className="glass-input text-sm py-1.5"
              >
                {recordsWithCurves.map(r => {
                  const beanName = beans?.find(b => b.id === r.beanId)?.name || '未知豆种';
                  const dateStr = new Date(r.brewDate).toLocaleDateString();
                  return <option key={r.id} value={r.id}>{beanName} - {dateStr}</option>
                })}
              </select>
            )}
          </div>

          <div className="h-80 w-full">
            {realCurveData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realCurveData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#94a3b8" vertical={false} />
                  <XAxis dataKey="time" tickFormatter={(val) => `${val}s`} stroke="#475569" fontSize={11} tickMargin={5} />
                  <YAxis yAxisId="left" domain={['auto', 'auto']} stroke="#6366f1" fontSize={11} tickFormatter={(val) => `${val}g`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 'auto']} stroke="#3b82f6" fontSize={11} tickFormatter={(val) => `${val}`} width={30} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.5)', padding: '8px', fontSize: '12px' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="weight" name="重量 (g)" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 6 }} isAnimationActive={false} />
                  <Line yAxisId="right" type="stepAfter" dataKey="flow" name="流速 (g/s)" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-400/30 rounded-xl text-gray-500 bg-white/20">
                <svg className="w-12 h-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="font-medium">暂无曲线数据</p>
                <p className="text-sm mt-1">请点击右上方按钮上传 CSV，或使用手动录入生成曲线。</p>
              </div>
            )}
          </div>
        </LiquidGlassPanel>
      </div>
    </div>
  );
}
