import { useState, useEffect, useMemo } from 'react';
import api, { getStorageUrl } from '../../services/api';
import { motion } from 'framer-motion';
import { 
    FileText, 
    Globe, 
    Search,
    Plus,
    Edit3,
    Trash2,
    Eye,
    Save,
    Settings,
    Layout,
    Activity,
    BarChart3,
    CheckCircle2,
    Clock,
    ShieldAlert,
    TrendingUp,
    Folder,
    RefreshCw,
    ImageIcon
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';

export const WritingRoom = ({ activeSection = 'dashboard' }: { activeSection?: 'dashboard' | 'articles' | 'sitemap' }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPost, setCurrentPost] = useState<any>({
        title: '',
        slug: '',
        content: '',
        category_id: '',
        status: 'draft',
        meta_description: '',
        keywords: '',
        featured_image: ''
    });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<any>({ name: '', slug: '', description: '' });
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            await Promise.all([fetchPosts(statusFilter), fetchCategories()]);
            setLoading(false);
        };
        loadInitialData();
    }, [statusFilter]);

    const paginatedPosts = useMemo(() => {
        const start = (currentPage - 1) * postsPerPage;
        return posts.slice(start, start + postsPerPage);
    }, [posts, currentPage]);

    const fetchPosts = async (status?: string) => {
        try {
            const query = status && status !== 'All' ? `?status=${status.toLowerCase()}` : '';
            const response = await api.get(`/blog${query}`);
            setPosts(response.data);
        } catch (error) {
            console.error("Failed to fetch posts", error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/blog-mgmt/categories');
            setCategories(response.data);
        } catch (error) {
            console.error("Failed to fetch categories", error);
        }
    };

    const handleSave = async () => {
        try {
            const payload = { 
                ...currentPost,
                status: currentPost.status || 'draft'
            };
            if (!payload.category_id || payload.category_id === '') {
                delete payload.category_id;
            }

            if (currentPost.id) {
                await api.put('/blog-mgmt/posts', payload);
            } else {
                await api.post('/blog-mgmt/posts', payload);
            }
            
            setIsEditing(false);
            await fetchPosts(statusFilter);
            alert(`Artikel berhasil ${payload.status === 'published' ? 'dipublikasikan' : 'disimpan sebagai draft'}`);
            
            // Reset form
            setCurrentPost({
                title: '',
                slug: '',
                content: '',
                category_id: '',
                status: 'draft',
                meta_description: '',
                keywords: '',
                featured_image: ''
            });
        } catch (error: any) {
            console.error("Save error:", error.response?.data || error.message);
            alert("Gagal menyimpan artikel: " + (error.response?.data?.error || "Terjadi kesalahan server"));
        }
    };

    const handleCategorySave = async () => {
        try {
            setCategoryLoading(true);
            const payload = { ...currentCategory };
            if (!payload.slug) payload.slug = payload.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

            if (isEditingCategory) {
                await api.put('/blog-mgmt/categories', payload);
            } else {
                await api.post('/blog-mgmt/categories', payload);
            }
            
            await fetchCategories();
            setIsEditingCategory(false);
            setCurrentCategory({ name: '', slug: '', description: '' });
        } catch (error) {
            alert("Gagal menyimpan kategori");
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleCategoryDelete = async (id: string) => {
        if (!confirm("Hapus kategori ini? Artikel dengan kategori ini mungkin akan terpengaruh.")) return;
        try {
            setCategoryLoading(true);
            await api.delete(`/blog-mgmt/categories/${id}`);
            await fetchCategories();
        } catch (error) {
            alert("Gagal menghapus kategori");
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        // Create a canvas to convert to WebP
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const formData = new FormData();
                        formData.append('file', blob, 'image.webp');
                        try {
                            const response = await api.post('/blog-mgmt/upload', formData);
                            setCurrentPost({ ...currentPost, featured_image: response.data.url });
                        } catch (error) {
                            alert("Gagal upload gambar");
                        } finally {
                            setUploadingImage(false);
                        }
                    }
                }, 'image/webp', 0.8);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Hapus artikel ini?")) return;
        try {
            await api.delete(`/blog-mgmt/posts/${id}`);
            fetchPosts();
        } catch (error) {
            alert("Gagal menghapus");
        }
    };

    const generateSlug = (title: string) => {
        return title.toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .replace(/\s+/g, '-');
    };

    const StatsCard = ({ icon: Icon, label, value, color }: any) => (
        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-3 group hover:border-dagang-green/20 transition-all">
            <div className={`w-10 h-10 ${color.bg} ${color.text} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-[10px] font-black text-dagang-gray uppercase tracking-widest">{label}</p>
                <h4 className="text-2xl font-serif text-dagang-dark">{value}</h4>
            </div>
        </div>
    );

    const colors: any = {
        emerald: { text: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        blue: { text: 'text-blue-500', bg: 'bg-blue-500/10' },
        amber: { text: 'text-amber-500', bg: 'bg-amber-500/10' },
        purple: { text: 'text-purple-500', bg: 'bg-purple-500/10' }
    };

    if (loading) return (
        <div className="min-h-screen bg-dagang-light flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="space-y-10">
            <main>
                {isEditing ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                    >
                        {/* Editor Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-sm space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Article Title</label>
                                    <input 
                                        type="text" 
                                        value={currentPost.title}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCurrentPost({...currentPost, title: val, slug: generateSlug(val)});
                                        }}
                                        placeholder="Enter a catchy title..."
                                        className="w-full text-4xl font-serif border-none focus:ring-0 placeholder:text-black/5 p-0"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Slug (Auto-generated)</label>
                                        <div className="flex items-center gap-2 text-xs text-dagang-gray bg-dagang-light/50 px-4 py-3 rounded-2xl border border-black/5">
                                            <Globe className="w-4 h-4" />
                                            <span>uangku.id/blog/</span>
                                            <input 
                                                type="text" 
                                                value={currentPost.slug}
                                                onChange={(e) => setCurrentPost({...currentPost, slug: e.target.value})}
                                                className="bg-transparent border-none focus:ring-0 p-0 text-dagang-green font-bold flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Category</label>
                                        <select 
                                            value={currentPost.category_id}
                                            onChange={(e) => setCurrentPost({...currentPost, category_id: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold"
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Content</label>
                                    <textarea 
                                        value={currentPost.content}
                                        onChange={(e) => setCurrentPost({...currentPost, content: e.target.value})}
                                        placeholder="Start writing your masterpiece..."
                                        className="w-full min-h-[600px] border-none focus:ring-0 text-lg leading-relaxed placeholder:text-black/5 p-0 resize-none font-serif"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SEO Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-8 sticky top-28">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-dagang-green" /> SEO Parameters
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Featured Image</label>
                                        <div className="relative aspect-video bg-dagang-light rounded-2xl border-2 border-dashed border-black/5 flex items-center justify-center overflow-hidden group/img">
                                            {uploadingImage ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <RefreshCw className="w-8 h-8 text-dagang-green animate-spin" />
                                                    <span className="text-[10px] font-black text-dagang-gray uppercase tracking-widest">Converting & Uploading...</span>
                                                </div>
                                            ) : currentPost.featured_image ? (
                                                <>
                                                    <img src={getStorageUrl(currentPost.featured_image)} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                        <label htmlFor="blog-image-upload" className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase">Change Image</label>
                                                    </div>
                                                </>
                                            ) : (
                                                <label htmlFor="blog-image-upload" className="cursor-pointer flex flex-col items-center gap-2 text-dagang-gray/40 hover:text-dagang-green transition-colors">
                                                    <ImageIcon className="w-8 h-8" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Upload Image</span>
                                                </label>
                                            )}
                                            <input id="blog-image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Publishing Status</label>
                                        <select 
                                            value={currentPost.status}
                                            onChange={(e) => setCurrentPost({...currentPost, status: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-sm font-bold"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="published">Published</option>
                                            <option value="scheduled">Scheduled</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Meta Description</label>
                                        <textarea 
                                            value={currentPost.meta_description}
                                            onChange={(e) => setCurrentPost({...currentPost, meta_description: e.target.value})}
                                            maxLength={160}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-xs min-h-[120px] leading-relaxed"
                                            placeholder="Write a compelling summary for search results..."
                                        />
                                        <div className="text-[9px] text-right font-bold text-dagang-gray/40">{currentPost.meta_description?.length || 0}/160</div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Focus Keywords</label>
                                        <input 
                                            type="text" 
                                            value={currentPost.keywords}
                                            onChange={(e) => setCurrentPost({...currentPost, keywords: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-xs"
                                            placeholder="e.g. hemat, keluarga, tips"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 px-4 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest border border-black/5 hover:bg-dagang-light transition-colors"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="flex-2 px-4 py-3.5 bg-dagang-dark text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-black/10 transition-transform active:scale-95"
                                    >
                                        <Save className="w-4 h-4" /> Save Content
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : activeSection === 'dashboard' ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard 
                                icon={BarChart3} 
                                label="Total Views" 
                                value={posts.reduce((sum, p) => sum + (p.views_count || 0), 0).toLocaleString()} 
                                color={colors.emerald} 
                            />
                            <StatsCard 
                                icon={FileText} 
                                label="Published Articles" 
                                value={posts.filter(p => p.status === 'published').length} 
                                color={colors.blue} 
                            />
                            <StatsCard 
                                icon={Layout} 
                                label="Active Categories" 
                                value={categories.length} 
                                color={colors.purple} 
                            />
                            <StatsCard 
                                icon={Activity} 
                                label="Overall SEO Health" 
                                value="94.2%" 
                                color={colors.amber} 
                            />
                        </div>

                        {/* Recent Performance & Published Feed */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-6">
                                <h2 className="text-2xl font-serif">Published Performance</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {posts.filter(p => p.status === 'published').slice(0, 4).map((post) => (
                                        <div key={post.id} className="bg-white p-6 rounded-[32px] border border-black/5 shadow-sm hover:border-dagang-green/20 transition-all group">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-[9px] font-black text-dagang-green bg-dagang-green/5 px-2 py-1 rounded uppercase tracking-widest">
                                                        {post.category?.name || 'General'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-dagang-gray">
                                                        <Eye className="w-3.5 h-3.5" /> {post.views_count || 0}
                                                    </div>
                                                </div>
                                                {post.featured_image && (
                                                    <div className="aspect-video w-full rounded-2xl overflow-hidden mb-4 border border-black/5">
                                                        <img src={getStorageUrl(post.featured_image)} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <h3 className="text-lg font-serif mb-4 leading-tight group-hover:text-dagang-green transition-colors">{post.title}</h3>
                                            <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-dagang-gray/40">
                                                <span>SEO Score: {post.seo_score}%</span>
                                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className="text-lg font-serif">Real-time Insights</h3>
                                <div className="bg-white p-8 rounded-[40px] border border-black/5 shadow-sm space-y-6">
                                    <div className="space-y-4">
                                        {[
                                            { title: 'Top Performing', desc: 'Article "Tips Investasi" trending', icon: TrendingUp, color: 'text-emerald-500' },
                                            { title: 'SEO Alert', desc: '3 articles missing meta tags', icon: ShieldAlert, color: 'text-amber-500' },
                                        ].map((item, i) => (
                                            <div key={i} className="flex gap-4 p-4 bg-dagang-light/50 rounded-2xl">
                                                <item.icon className={`w-5 h-5 ${item.color} shrink-0`} />
                                                <div>
                                                    <div className="text-xs font-bold">{item.title}</div>
                                                    <div className="text-[10px] text-dagang-gray">{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="w-full py-4 bg-dagang-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">View Full Analytics</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : activeSection === 'articles' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-serif">Article Library</h2>
                                <p className="text-sm text-dagang-gray font-serif">Manage all your drafts, scheduled posts, and published articles.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setIsCategoryModalOpen(true)}
                                    className="bg-white border border-black/5 text-dagang-dark px-6 py-4 rounded-[20px] font-bold text-sm flex items-center gap-2 hover:bg-dagang-light transition-all shadow-xl shadow-black/5 active:scale-95"
                                >
                                    <Folder className="w-5 h-5" /> Manage Categories
                                </button>
                                <button 
                                    onClick={() => {
                                        setIsEditing(true);
                                        setCurrentPost({
                                            title: '', slug: '', content: '', category_id: '', status: 'draft',
                                            meta_description: '', keywords: '', featured_image: ''
                                        });
                                    }}
                                    className="bg-dagang-dark text-white px-8 py-4 rounded-[20px] font-bold text-sm flex items-center gap-2 hover:bg-black transition-all shadow-xl shadow-black/10 active:scale-95"
                                >
                                    <Plus className="w-5 h-5" /> Write New Article
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-black/5 flex items-center justify-between bg-dagang-light/10">
                                <div className="flex items-center gap-6">
                                    {['All', 'Draft', 'Scheduled', 'Published'].map(status => (
                                        <button 
                                            key={status} 
                                            onClick={() => setStatusFilter(status)}
                                            className={`text-xs font-black uppercase tracking-widest transition-colors relative pb-1 ${
                                                statusFilter === status ? 'text-dagang-dark' : 'text-dagang-gray hover:text-dagang-dark'
                                            }`}
                                        >
                                            {status}
                                            {statusFilter === status && <motion.div layoutId="statusTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-dagang-green rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 bg-white border border-black/5 rounded-xl px-4 py-2">
                                    <Search className="w-4 h-4 text-dagang-gray" />
                                    <input type="text" placeholder="Search articles..." className="bg-transparent border-none focus:ring-0 text-xs w-48 font-serif" />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-dagang-gray uppercase tracking-widest border-b border-black/5">
                                            <th className="px-8 py-6">Article Info</th>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6">Category</th>
                                            <th className="px-8 py-6">Performance</th>
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {paginatedPosts.map((post: any) => (
                                            <tr key={post.id} className="hover:bg-dagang-light/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <div className="text-sm font-bold text-dagang-dark mb-1 line-clamp-1 group-hover:text-dagang-green transition-colors">{post.title}</div>
                                                        <div className="text-[10px] text-dagang-gray font-mono">/blog/{post.slug}</div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                        post.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 
                                                        post.status === 'scheduled' ? 'bg-blue-500/10 text-blue-600' : 'bg-amber-500/10 text-amber-600'
                                                    }`}>
                                                        {post.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-xs font-bold text-dagang-gray">
                                                    {post.category?.name || 'Uncategorized'}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-dagang-gray">
                                                            <Eye className="w-3.5 h-3.5" /> {post.views_count || 0}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-dagang-gray">
                                                            <Activity className="w-3.5 h-3.5" /> {post.seo_score || 0}%
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-[10px] font-black text-dagang-gray uppercase tracking-widest">
                                                    {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => { setCurrentPost(post); setIsEditing(true); }}
                                                            className="p-2 hover:bg-black hover:text-white rounded-lg transition-all"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(post.id)}
                                                            className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <TablePagination 
                            currentPage={currentPage}
                            totalItems={posts.length}
                            itemsPerPage={postsPerPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                ) : activeSection === 'sitemap' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-serif">Sitemap & Bot Control</h2>
                                <p className="text-sm text-dagang-gray font-serif">Configure how search engines interact with your content.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="px-6 py-3 bg-white border border-black/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-dagang-light transition-colors">Test Sitemap.xml</button>
                                <button className="px-6 py-3 bg-dagang-green text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-dagang-green/10">Re-index All</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-[40px] border border-black/5 shadow-sm p-8">
                                    <h3 className="text-xl font-serif mb-6">Indexed Paths</h3>
                                    <div className="space-y-4">
                                        {[
                                            { path: '/', priority: 1.0, frequency: 'daily', bots: true, private: false },
                                            { path: '/blog', priority: 0.8, frequency: 'daily', bots: true, private: false },
                                            { path: '/pricing', priority: 0.5, frequency: 'weekly', bots: true, private: false },
                                            { path: '/checkout', priority: 0.0, frequency: 'never', bots: false, private: true },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center justify-between p-6 bg-dagang-light/30 rounded-3xl border border-black/5">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${item.private ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                        {item.private ? <ShieldAlert className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold">{item.path}</div>
                                                        <div className="text-[10px] text-dagang-gray font-black uppercase tracking-widest">Priority: {item.priority} • {item.frequency}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-dagang-gray/40 mb-1">Bots {item.bots ? 'Allowed' : 'Blocked'}</span>
                                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${item.bots ? 'bg-dagang-green' : 'bg-dagang-gray/20'}`}>
                                                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${item.bots ? 'translate-x-5' : 'translate-x-0'}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-dagang-dark text-white p-8 rounded-[40px] shadow-2xl space-y-6">
                                    <h3 className="text-xl font-serif">Global Bot Control</h3>
                                    <p className="text-xs text-white/50 leading-relaxed font-serif">Manage how major search bots (Google, Bing, Baidu) see your site globally.</p>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Googlebot</span>
                                            <CheckCircle2 className="w-5 h-5 text-dagang-green" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Bingbot</span>
                                            <CheckCircle2 className="w-5 h-5 text-dagang-green" />
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <span className="text-[10px] font-black uppercase tracking-widest">Baiduspider</span>
                                            <Clock className="w-5 h-5 text-amber-500" />
                                        </div>
                                    </div>
                                    <div className="pt-6 border-t border-white/10">
                                        <button className="w-full py-4 bg-dagang-green text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-dagang-green-light transition-colors">Edit Robots.txt</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-dagang-dark/20 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-black/5 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-8 border-b border-black/5 flex items-center justify-between bg-dagang-light/10">
                            <div>
                                <h3 className="text-xl font-serif">Manage Categories</h3>
                                <p className="text-[10px] font-black text-dagang-gray uppercase tracking-widest mt-1">Organize your blog content</p>
                            </div>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-black hover:text-white rounded-xl transition-all">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            <div className="bg-dagang-light/30 rounded-[32px] p-6 border border-black/5 space-y-4">
                                <h4 className="text-[11px] font-black text-dagang-gray uppercase tracking-widest">{isEditingCategory ? 'Edit Category' : 'Create New Category'}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-dagang-gray ml-1">Name</label>
                                        <input type="text" value={currentCategory.name} onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})} className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm font-bold focus:ring-dagang-green" placeholder="e.g. Tips Keuangan" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-dagang-gray ml-1">Slug</label>
                                        <input type="text" value={currentCategory.slug} onChange={(e) => setCurrentCategory({...currentCategory, slug: e.target.value})} className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm font-bold focus:ring-dagang-green" placeholder="tips-keuangan" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-dagang-gray ml-1">Description</label>
                                    <textarea value={currentCategory.description} onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})} className="w-full bg-white border border-black/5 rounded-xl px-4 py-3 text-sm font-serif min-h-[80px]" placeholder="Briefly describe what this category is about..." />
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    {isEditingCategory && (
                                        <button onClick={() => { setIsEditingCategory(false); setCurrentCategory({ name: '', slug: '', description: '' }); }} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-dagang-gray hover:text-dagang-dark transition-colors">Cancel</button>
                                    )}
                                    <button onClick={handleCategorySave} disabled={categoryLoading || !currentCategory.name} className="bg-dagang-dark text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                                        {categoryLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {isEditingCategory ? 'Update Category' : 'Create Category'}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-[11px] font-black text-dagang-gray uppercase tracking-widest">Existing Categories</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {categories.map((cat: any) => (
                                        <div key={cat.id} className="flex items-center justify-between p-5 bg-white border border-black/5 rounded-2xl hover:border-dagang-green/20 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-dagang-green/5 rounded-xl flex items-center justify-center text-dagang-green group-hover:bg-dagang-green group-hover:text-white transition-all"><Folder className="w-5 h-5" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-dagang-dark">{cat.name}</div>
                                                    <div className="text-[10px] text-dagang-gray font-mono">{cat.slug}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => { setIsEditingCategory(true); setCurrentCategory(cat); }} className="p-2 hover:bg-dagang-dark hover:text-white rounded-lg transition-all"><Edit3 className="w-4 h-4" /></button>
                                                <button onClick={() => handleCategoryDelete(cat.id)} className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
