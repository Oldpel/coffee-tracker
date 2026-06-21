import { trpc } from '../trpc';
import { useState, useRef, useEffect } from 'react';
import LiquidGlassPanel from '../components/LiquidGlassPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function RecordChartModal({ recordId, onClose }: { recordId: number, onClose: () => void }) {
  const { data: record, isLoading } = trpc.records.getById.useQuery({ id: recordId });

  let realCurveData = null;
  if (record && record.curveData) {
    try {
      const parsed = JSON.parse(record.curveData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        realCurveData = parsed;
      }
    } catch (e) {
      console.error("Failed to parse curve data", e);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl overflow-hidden p-6 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
        
        {isLoading ? (
          <div className="py-12 text-center text-gray-500">加载中...</div>
        ) : record ? (
          <div>
            <h3 className="text-xl font-bold text-foreground mb-4">冲煮曲线记录</h3>
            <div className="flex gap-4 mb-6">
              <div className="bg-primary/10 px-3 py-1 rounded-lg text-primary text-sm font-medium">冲煮日期: {new Date(record.brewDate).toLocaleDateString()}</div>
              {record.tasteRating && <div className="bg-amber-500/10 px-3 py-1 rounded-lg text-amber-600 text-sm font-medium">评分: {record.tasteRating}/10</div>}
            </div>
            
            {realCurveData ? (
              <div className="h-64 w-full bg-white/40 rounded-xl p-4 border border-white/60">
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
            ) : (
              <div className="py-12 text-center text-gray-500 bg-white/40 rounded-xl border border-white/60">这条记录没有曲线数据</div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">记录不存在或已被删除</div>
        )}
      </motion.div>
    </div>
  );
}

const PostContent = ({ text }: { text: string }) => {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  const parts = text.split(/(\[(?:豆子|曲线):\d+:[^\]]+\])/g);
  
  return (
    <>
      <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">
        {parts.map((part, i) => {
          const match = part.match(/\[(豆子|曲线):(\d+):([^\]]+)\]/);
          if (match) {
            const type = match[1];
            const id = parseInt(match[2], 10);
            const name = match[3];
            
            if (type === '曲线') {
              return (
                <span 
                  key={i} 
                  onClick={() => setSelectedRecordId(id)}
                  className="inline-flex items-center text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 mx-1 rounded cursor-pointer hover:bg-primary/20 transition-colors font-medium"
                >
                  <span className="mr-1">📈</span> {name}
                </span>
              );
            } else {
              return (
                <span 
                  key={i} 
                  className="inline-flex items-center text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 mx-1 rounded font-medium"
                >
                  <span className="mr-1">☕</span> {name}
                </span>
              );
            }
          }
          return <span key={i}>{part}</span>;
        })}
      </p>

      <AnimatePresence>
        {selectedRecordId && (
          <RecordChartModal 
            recordId={selectedRecordId} 
            onClose={() => setSelectedRecordId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default function CommunityPage() {
  const { data, isLoading } = trpc.community.listPosts.useQuery({ page: 1, pageSize: 20 });
  const [showAddPost, setShowAddPost] = useState(false);
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('豆子分享');

  // Mention State
  const { data: beansData } = trpc.beans.list.useQuery(undefined, { enabled: showAddPost });
  const { data: recordsData } = trpc.records.getRecent.useQuery(undefined, { enabled: showAddPost });
  const [mentionState, setMentionState] = useState<{
    isOpen: boolean;
    query: string;
    startIndex: number;
    endIndex: number;
  }>({ isOpen: false, query: '', startIndex: 0, endIndex: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const utils = trpc.useUtils();
  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      utils.community.listPosts.invalidate();
      setShowAddPost(false);
      setContent('');
      setTitle('');
    }
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    
    // Check for @ mention
    const cursor = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s]*)$/);
    
    if (match) {
      setMentionState({
        isOpen: true,
        query: match[1],
        startIndex: cursor - match[1].length - 1,
        endIndex: cursor
      });
    } else {
      setMentionState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleSelectMention = (type: 'bean' | 'record', id: number, name: string) => {
    const before = content.slice(0, mentionState.startIndex);
    const after = content.slice(mentionState.endIndex);
    const insertion = `[${type === 'bean' ? '豆子' : '曲线'}:${id}:${name}] `;
    
    setContent(before + insertion + after);
    setMentionState(prev => ({ ...prev, isOpen: false }));
    
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleAddPost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createPost.mutate({
      title,
      content,
      category,
    });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">社群交流</h1>
        <motion.button 
          onClick={() => setShowAddPost(!showAddPost)}
          className="glass-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {showAddPost ? '取消发布' : '发布讨论'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showAddPost && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <LiquidGlassPanel paddingClass="p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">发布新讨论</h3>
              <form onSubmit={handleAddPost} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">标题</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    className="glass-input" 
                    placeholder="起一个吸引人的标题..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">分类</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="glass-input">
                    <option value="豆子分享">豆子分享</option>
                    <option value="冲煮技巧">冲煮技巧</option>
                    <option value="设备评测">设备评测</option>
                    <option value="其他">其他交流</option>
                  </select>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">内容</label>
                  <textarea 
                    ref={textareaRef}
                    value={content}
                    onChange={handleContentChange}
                    required 
                    rows={6} 
                    className="glass-input relative z-10 bg-white/40" 
                    placeholder="分享你的想法... (输入 @ 即可选择自己的豆子或曲线)"
                  ></textarea>
                  
                  {mentionState.isOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto bg-white/95 backdrop-blur-xl border border-primary/20 shadow-xl shadow-primary/10 rounded-xl p-2">
                      <div className="text-xs text-primary/70 font-bold mb-2 px-2 uppercase tracking-wider">我的咖啡豆</div>
                      {beansData?.filter(b => b.name.toLowerCase().includes(mentionState.query.toLowerCase())).map(b => (
                        <div key={`bean-${b.id}`} onClick={() => handleSelectMention('bean', b.id, b.name)} className="cursor-pointer p-2 hover:bg-primary/10 rounded-lg text-sm text-gray-800 transition-colors flex items-center">
                          <span className="mr-2">☕</span> {b.name}
                        </div>
                      ))}
                      
                      <div className="text-xs text-primary/70 font-bold mb-2 mt-4 px-2 uppercase tracking-wider">我的冲煮记录</div>
                      {recordsData?.filter(r => {
                        const beanName = beansData?.find(b => b.id === r.beanId)?.name || '';
                        return beanName.toLowerCase().includes(mentionState.query.toLowerCase()) || 
                               (r.notes && r.notes.toLowerCase().includes(mentionState.query.toLowerCase()));
                      }).map(r => {
                        const beanName = beansData?.find(b => b.id === r.beanId)?.name || '未知豆子';
                        return (
                          <div key={`record-${r.id}`} onClick={() => handleSelectMention('record', r.id, `${new Date(r.brewDate).toLocaleDateString()}-${beanName}`)} className="cursor-pointer p-2 hover:bg-primary/10 rounded-lg text-sm text-gray-800 transition-colors flex items-center justify-between">
                            <span className="flex items-center"><span className="mr-2">📈</span> {beanName}</span>
                            <span className="text-xs text-gray-500">{new Date(r.brewDate).toLocaleDateString()}</span>
                          </div>
                        );
                      })}
                      
                      {beansData?.length === 0 && recordsData?.length === 0 && (
                        <div className="p-2 text-sm text-gray-500 text-center">暂无数据</div>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <motion.button 
                    type="submit" 
                    disabled={createPost.isPending} 
                    className="glass-button px-8"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {createPost.isPending ? '发布中...' : '确认发布'}
                  </motion.button>
                </div>
              </form>
            </LiquidGlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
      
      {isLoading ? (
        <LiquidGlassPanel paddingClass="p-8 text-center text-gray-500 font-medium">加载中...</LiquidGlassPanel>
      ) : data && data.posts.length > 0 ? (
        <div className="space-y-4">
          {data.posts.map(post => (
            <LiquidGlassPanel key={post.id} paddingClass="p-6" className="hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-foreground">{post.title}</h3>
                <span className="bg-primary/10 text-primary border border-primary/20 backdrop-blur-md text-xs px-2 py-1 rounded-full">{post.category}</span>
              </div>
              <PostContent text={post.content} />
              <div className="flex items-center text-sm text-gray-500 mt-4 space-x-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  {post.authorName || '匿名用户'}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  {post.commentCount} 评论
                </span>
              </div>
            </LiquidGlassPanel>
          ))}
        </div>
      ) : (
        <LiquidGlassPanel paddingClass="py-12 text-center text-gray-500">
          <p className="font-medium text-lg">还没有人发布讨论</p>
          <p className="text-sm mt-2">快来抢沙发吧！</p>
        </LiquidGlassPanel>
      )}
    </div>
  );
}
