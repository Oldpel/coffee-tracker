import { trpc } from '../trpc';
import { useState } from 'react';
import LiquidGlassPanel from '../components/LiquidGlassPanel';

export default function CommunityPage() {
  const { data, isLoading } = trpc.community.listPosts.useQuery({ page: 1, pageSize: 20 });
  const [showAddPost, setShowAddPost] = useState(false);

  const utils = trpc.useUtils();
  const createPost = trpc.community.createPost.useMutation({
    onSuccess: () => {
      utils.community.listPosts.invalidate();
      setShowAddPost(false);
    }
  });

  const handleAddPost = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPost.mutate({
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      category: formData.get('category') as string,
    });
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">社群交流</h1>
        <button 
          onClick={() => setShowAddPost(!showAddPost)}
          className="glass-button"
        >
          {showAddPost ? '取消发布' : '发布讨论'}
        </button>
      </div>

      {showAddPost && (
        <LiquidGlassPanel paddingClass="p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">发布新讨论</h3>
          <form onSubmit={handleAddPost} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">标题</label>
              <input type="text" name="title" required className="glass-input" placeholder="起一个吸引人的标题..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">分类</label>
              <select name="category" className="glass-input">
                <option value="豆子分享">豆子分享</option>
                <option value="冲煮技巧">冲煮技巧</option>
                <option value="设备评测">设备评测</option>
                <option value="其他">其他交流</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 ml-1 mb-1">内容</label>
              <textarea name="content" required rows={6} className="glass-input" placeholder="分享你的想法..."></textarea>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={createPost.isPending} className="glass-button px-8">
                {createPost.isPending ? '发布中...' : '确认发布'}
              </button>
            </div>
          </form>
        </LiquidGlassPanel>
      )}
      
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
              <p className="text-gray-700 mt-2 line-clamp-3 leading-relaxed">{post.content}</p>
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
