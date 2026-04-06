import { useState, useEffect, useMemo, useRef } from 'react';
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
    ImageIcon,
    Heading1,
    Heading2,
    Heading3,
    Link2,
    Image as ImagePlus,
    Type,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    BookOpen
} from 'lucide-react';
import { TablePagination } from '../../components/common/TablePagination';
import { useModal } from '../../providers/ModalProvider';

export const WritingRoom = ({ activeSection = 'dashboard' }: { activeSection?: 'dashboard' | 'articles' | 'sitemap' }) => {
    const { showAlert, showConfirm } = useModal();
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
        featured_image: '',
        image_alt_text: ''
    });
    const [activeHeading, setActiveHeading] = useState<string | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);

    const checkActiveHeading = () => {
        if (!editorRef.current) return;
        
        const { value, selectionStart } = editorRef.current;
        // Find start of current line
        const beforeCursor = value.substring(0, selectionStart);
        const lastNewline = beforeCursor.lastIndexOf('\n');
        const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
        
        // Peeking the start of the current line
        const lineText = value.substring(lineStart, lineStart + 10);
        
        if (lineText.startsWith('### ')) {
            setActiveHeading('h3');
        } else if (lineText.startsWith('## ')) {
            setActiveHeading('h2');
        } else if (lineText.startsWith('# ')) {
            setActiveHeading('h1');
        } else {
            setActiveHeading(null);
        }
    };

    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Professional Toolbar States
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkData, setLinkData] = useState({ text: '', url: '' });
    const [showImgModal, setShowImgModal] = useState(false);
    const [imgData, setImgData] = useState({ alt: '', url: '' });
    const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });

    const handleHeading = (level: number) => {
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const prefix = '#'.repeat(level) + ' ';
        
        const selection = currentPost.content.substring(start, end);
        
        if (selection) {
            // Convert selection to heading
            const newContent = currentPost.content.substring(0, start) + 
                             `\n${prefix}${selection}\n` + 
                             currentPost.content.substring(end);
            setCurrentPost({ ...currentPost, content: newContent });
        } else {
            // Find current line and convert it
            const before = currentPost.content.substring(0, start);
            const lastNewline = before.lastIndexOf('\n');
            const lineStart = lastNewline === -1 ? 0 : lastNewline + 1;
            
            const lineContent = currentPost.content.substring(lineStart).split('\n')[0];
            const cleanLine = lineContent.replace(/^(#+\s*)/, '');
            
            const newContent = currentPost.content.substring(0, lineStart) + 
                             prefix + cleanLine + 
                             currentPost.content.substring(lineStart + lineContent.length);
            
            setCurrentPost({ ...currentPost, content: newContent });
        }
        setTimeout(checkActiveHeading, 0);
    };

    const openLinkModal = () => {
        const textarea = editorRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selection = currentPost.content.substring(start, end);
        
        setSelectionRange({ start, end });
        setLinkData({ text: selection || '', url: '' });
        setShowLinkModal(true);
    };

    const insertLink = () => {
        if (!linkData.url) return;
        const textToInsert = `[${linkData.text || linkData.url}](${linkData.url})`;
        const before = currentPost.content.substring(0, selectionRange.start);
        const after = currentPost.content.substring(selectionRange.end);
        
        setCurrentPost({ ...currentPost, content: before + textToInsert + after });
        setShowLinkModal(false);
        setLinkData({ text: '', url: '' });
    };

    const openImgModal = () => {
        const textarea = editorRef.current;
        if (!textarea) return;
        setSelectionRange({ start: textarea.selectionStart, end: textarea.selectionEnd });
        setImgData({ alt: '', url: '' });
        setShowImgModal(true);
    };

    const insertImage = () => {
        if (!imgData.url) return;
        const textToInsert = `\n![${imgData.alt || 'gambar'}](${imgData.url})\n`;
        const before = currentPost.content.substring(0, selectionRange.start);
        const after = currentPost.content.substring(selectionRange.end);
        
        setCurrentPost({ ...currentPost, content: before + textToInsert + after });
        setShowImgModal(false);
        setImgData({ alt: '', url: '' });
    };
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isEditingCategory, setIsEditingCategory] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<any>({ name: '', slug: '', description: '' });
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 10;

    // Sitemap Config State
    const [sitemapConfigs, setSitemapConfigs] = useState<any[]>([]);
    const [sitemapLoading, setSitemapLoading] = useState(false);
    const [showAddPath, setShowAddPath] = useState(false);
    const [newPathForm, setNewPathForm] = useState({ path: '', priority: 0.5, change_freq: 'weekly', allow_bots: true, is_private: false });

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

    useEffect(() => {
        if (activeSection === 'sitemap') {
            fetchSitemapConfigs();
        }
    }, [activeSection]);

    const paginatedPosts = useMemo(() => {
        const start = (currentPage - 1) * postsPerPage;
        return posts.slice(start, start + postsPerPage);
    }, [posts, currentPage]);

    useEffect(() => {
        // Set Edukasi as default for NEW articles
        if (isEditing && categories.length > 0 && !currentPost.id && !currentPost.category_id) {
            const eduCat = categories.find((c: any) => c.name === 'Edukasi' || c.slug === 'edukasi');
            if (eduCat) {
                setCurrentPost((prev: any) => ({ ...prev, category_id: eduCat.id }));
            }
        }
    }, [categories, isEditing, currentPost.id, currentPost.category_id]);

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

    const fetchSitemapConfigs = async () => {
        setSitemapLoading(true);
        try {
            const response = await api.get('/blog-mgmt/sitemap');
            setSitemapConfigs(response.data);
        } catch (error) {
            console.error("Failed to fetch sitemap configs", error);
        } finally {
            setSitemapLoading(false);
        }
    };

    const handleAddPath = async () => {
        if (!newPathForm.path) return;
        try {
            await api.post('/blog-mgmt/sitemap', newPathForm);
            showAlert('Path berhasil ditambahkan', 'success');
            setShowAddPath(false);
            setNewPathForm({ path: '', priority: 0.5, change_freq: 'weekly', allow_bots: true, is_private: false });
            fetchSitemapConfigs();
        } catch (error) {
            showAlert('Gagal menambahkan path', 'error');
        }
    };

    const handleToggleBots = async (id: string) => {
        try {
            await api.patch(`/blog-mgmt/sitemap/${id}/toggle-bots`);
            fetchSitemapConfigs();
        } catch (error) {
            showAlert('Gagal mengubah status bot', 'error');
        }
    };

    const handleDeletePath = async (id: string, path: string) => {
        showConfirm(
            'Hapus Path?',
            `Apakah Anda yakin ingin menghapus path "${path}" dari sitemap?`,
            async () => {
                try {
                    await api.delete(`/blog-mgmt/sitemap/${id}`);
                    fetchSitemapConfigs();
                    showAlert('Path berhasil dihapus', 'success');
                } catch (error) {
                    showAlert('Gagal menghapus path', 'error');
                }
            }
        );
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
            showAlert('Berhasil', `Artikel berhasil ${payload.status === 'published' ? 'dipublikasikan' : 'disimpan sebagai draft'}`, 'alert');
            
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
            showAlert('Gagal', "Gagal menyimpan artikel: " + (error.response?.data?.error || "Terjadi kesalahan server"), 'danger');
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
            showAlert('Gagal', "Gagal menyimpan kategori", 'danger');
        } finally {
            setCategoryLoading(false);
        }
    };

    const handleCategoryDelete = async (id: string) => {
        showConfirm('Hapus Kategori', "Hapus kategori ini? Artikel dengan kategori ini mungkin akan terpengaruh.", async () => {
            try {
                setCategoryLoading(true);
                await api.delete(`/blog-mgmt/categories/${id}`);
                await fetchCategories();
            } catch (error) {
                showAlert('Gagal', "Gagal menghapus kategori", 'danger');
            } finally {
                setCategoryLoading(false);
            }
        }, 'danger');
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
                            showAlert('Gagal', "Gagal upload gambar", 'danger');
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
        showConfirm('Hapus Artikel', "Hapus artikel ini?", async () => {
            try {
                await api.delete(`/blog-mgmt/posts/${id}`);
                fetchPosts();
            } catch (error) {
                showAlert('Gagal', "Gagal menghapus", 'danger');
            }
        }, 'danger');
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
                {isEditing ? (() => {
                    // --- SEO Analysis Logic ---
                    const wordCount = currentPost.content ? currentPost.content.split(/\s+/).filter((w: string) => w.length > 0).length : 0;
                    const readTime = Math.max(1, Math.ceil(wordCount / 200));
                    const paragraphCount = currentPost.content ? currentPost.content.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0).length : 0;
                    const titleLen = currentPost.title?.length || 0;
                    const metaLen = currentPost.meta_description?.length || 0;
                    
                    const focusKeyword = currentPost.keywords ? currentPost.keywords.split(',')[0]?.trim().toLowerCase() : '';
                    
                    const keywordInTitle = focusKeyword && currentPost.title?.toLowerCase().includes(focusKeyword);
                    const keywordInMeta = focusKeyword && currentPost.meta_description?.toLowerCase().includes(focusKeyword);
                    const keywordInContent = focusKeyword && currentPost.content?.toLowerCase().includes(focusKeyword);
                    const keywordInSlug = focusKeyword && currentPost.slug?.toLowerCase().includes(focusKeyword.replace(/\s+/g, '-'));

                    const keywordCount = focusKeyword && currentPost.content 
                        ? (currentPost.content.toLowerCase().match(new RegExp(focusKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length 
                        : 0;
                    const keywordDensity = wordCount > 0 ? ((keywordCount / wordCount) * 100) : 0;

                    const hasHeadings = currentPost.content ? (currentPost.content.includes('## ') || currentPost.content.includes('### ')) : false;

                    const hasImage = !!currentPost.featured_image;
                    const hasAltText = !!currentPost.image_alt_text?.trim();

                    // Score Calculation
                    const seoChecks = [
                        { label: 'Judul 30-70 karakter', pass: titleLen >= 30 && titleLen <= 70 },
                        { label: 'Meta deskripsi 80-160 karakter', pass: metaLen >= 80 && metaLen <= 160 },
                        { label: 'Focus keyword terisi', pass: !!focusKeyword },
                        { label: 'Keyword ada di judul', pass: !!keywordInTitle },
                        { label: 'Konten minimal 300 kata', pass: wordCount >= 300 },
                        { label: 'Gambar featured terisi', pass: hasImage },
                        { label: 'Alt text gambar terisi', pass: hasAltText },
                        { label: 'Heading H2/H3 digunakan', pass: hasHeadings },
                    ];
                    const passedChecks = seoChecks.filter(c => c.pass).length;
                    const seoScore = Math.round((passedChecks / seoChecks.length) * 100);
                    const scoreColor = seoScore >= 80 ? 'text-emerald-500' : seoScore >= 50 ? 'text-amber-500' : 'text-red-500';
                    const scoreBg = seoScore >= 80 ? 'stroke-emerald-500' : seoScore >= 50 ? 'stroke-amber-500' : 'stroke-red-500';

                    const insertAtCursor = (text: string) => {
                        const textarea = document.getElementById('seo-content-editor') as HTMLTextAreaElement;
                        if (!textarea) return;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const before = currentPost.content.substring(0, start);
                        const after = currentPost.content.substring(end);
                        setCurrentPost({ ...currentPost, content: before + text + after });
                        setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + text.length, start + text.length);
                        }, 0);
                    };

                    const ToolbarModal = ({ title, fields, onSave, onCancel, data, setData }: any) => (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="absolute top-12 left-0 right-0 z-50 bg-white border border-dagang-green/20 rounded-2xl shadow-2xl p-4 space-y-4 max-w-sm mx-auto overflow-hidden"
                        >
                            <div className="flex items-center justify-between border-b border-black/5 pb-2">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-dagang-green">{title}</h4>
                                <button onClick={onCancel} className="text-dagang-gray hover:text-red-500 transition-colors">
                                    <XCircle className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-3 relative">
                                {fields.map((f: any) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[9px] font-bold text-dagang-gray/60 uppercase ml-1">{f.label}</label>
                                        <input 
                                            autoFocus={f.autoFocus}
                                            type="text" 
                                            value={data[f.key]} 
                                            onChange={(e) => setData({...data, [f.key]: e.target.value})}
                                            className="w-full bg-dagang-light/50 border border-black/5 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-dagang-green outline-none"
                                            placeholder={f.placeholder}
                                            onKeyDown={(e) => e.key === 'Enter' && onSave()}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <button onClick={onCancel} className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-dagang-gray hover:text-dagang-dark">Batal</button>
                                <button onClick={onSave} className="bg-dagang-green text-white px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-dagang-green/90 shadow-sm">Simpan</button>
                            </div>
                        </motion.div>
                    );

                    return (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                    >
                        {/* Editor Form */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-10 rounded-[40px] border border-black/5 shadow-sm space-y-8">
                                <div className="space-y-3 relative">
                                    <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Judul Artikel</label>
                                    <input 
                                        type="text" 
                                        value={currentPost.title}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setCurrentPost({...currentPost, title: val, slug: generateSlug(val)});
                                        }}
                                        placeholder="Tulis judul artikel yang menarik..."
                                        className="w-full text-4xl font-serif border-none focus:ring-0 placeholder:text-black/5 p-0"
                                    />
                                    <div className={`text-[10px] font-bold ${titleLen >= 30 && titleLen <= 70 ? 'text-emerald-500' : titleLen > 0 ? 'text-amber-500' : 'text-dagang-gray/40'}`}>
                                        {titleLen}/70 karakter {titleLen >= 30 && titleLen <= 70 ? 'âœ“ Ideal' : titleLen > 70 ? 'â€” Terlalu panjang' : titleLen > 0 && titleLen < 30 ? 'â€” Terlalu pendek' : ''}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3 relative">
                                        <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Slug (Otomatis)</label>
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
                                    <div className="space-y-3 relative">
                                        <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Kategori</label>
                                        <select 
                                            value={currentPost.category_id}
                                            onChange={(e) => setCurrentPost({...currentPost, category_id: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-2xl px-4 py-3 text-sm font-bold"
                                        >
                                            <option value="">Pilih Kategori</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Content Structure Toolbar */}
                                <div className="space-y-3 relative">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-black text-dagang-gray/50 uppercase tracking-widest">Konten</label>
                                        <div className="flex items-center gap-1 bg-dagang-light/50 rounded-xl p-1 border border-black/5">
                                            <button 
                                                type="button"
                                                onClick={() => handleHeading(1)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                    activeHeading === 'h1' 
                                                    ? 'bg-dagang-green text-white shadow-sm' 
                                                    : 'text-dagang-gray hover:bg-white hover:text-dagang-dark'
                                                }`}
                                                title="Insert Heading H1"
                                            >
                                                <Heading1 className="w-3.5 h-3.5" /> H1
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleHeading(2)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                    activeHeading === 'h2' 
                                                    ? 'bg-dagang-green text-white shadow-sm' 
                                                    : 'text-dagang-gray hover:bg-white hover:text-dagang-dark'
                                                }`}
                                                title="Insert Heading H2"
                                            >
                                                <Heading2 className="w-3.5 h-3.5" /> H2
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => handleHeading(3)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                                    activeHeading === 'h3' 
                                                    ? 'bg-dagang-green text-white shadow-sm' 
                                                    : 'text-dagang-gray hover:bg-white hover:text-dagang-dark'
                                                }`}
                                                title="Insert Heading H3"
                                            >
                                                <Heading3 className="w-3.5 h-3.5" /> H3
                                            </button>
                                            <div className="w-px h-5 bg-black/10" />
                                            <button 
                                                type="button"
                                                onClick={openLinkModal}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-dagang-gray hover:bg-white hover:text-dagang-dark rounded-lg transition-all"
                                                title="Insert Internal Link"
                                            >
                                                <Link2 className="w-3.5 h-3.5" /> Link
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={openImgModal}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-dagang-gray hover:bg-white hover:text-dagang-dark rounded-lg transition-all"
                                                title="Insert Image with Alt Text"
                                            >
                                                <ImagePlus className="w-3.5 h-3.5" /> Img
                                            </button>
                                        </div>
                                    </div>
                                    {/* Inline Interactive Modals */}
                                     {showLinkModal && (
                                         <ToolbarModal 
                                            title="Sisipkan Link"
                                            fields={[
                                                { key: 'text', label: 'Teks Tampilan', placeholder: 'cth: Klik di sini', autoFocus: true },
                                                { key: 'url', label: 'URL Tujuan', placeholder: 'https://...' },
                                            ]}
                                            data={linkData}
                                            setData={setLinkData}
                                            onSave={insertLink}
                                            onCancel={() => setShowLinkModal(false)}
                                         />
                                     )}

                                     {showImgModal && (
                                         <ToolbarModal 
                                            title="Sisipkan Gambar"
                                            fields={[
                                                { key: 'url', label: 'URL Gambar', placeholder: 'https://...', autoFocus: true },
                                                { key: 'alt', label: 'Alt Text (SEO)', placeholder: 'Deskripsikan gambar anda...' },
                                            ]}
                                            data={imgData}
                                            setData={setImgData}
                                            onSave={insertImage}
                                            onCancel={() => setShowImgModal(false)}
                                         />
                                     )} 
                                        <textarea
                                         ref={editorRef}
                                        id="seo-content-editor"
                                        value={currentPost.content}
                                        onChange={(e) => {
                                            setCurrentPost({...currentPost, content: e.target.value});
                                            setTimeout(checkActiveHeading, 0);
                                        }}
                                        onKeyUp={checkActiveHeading}
                                        onMouseUp={checkActiveHeading}
                                        onSelect={checkActiveHeading}
                                        placeholder="Mulai menulis artikel Anda di sini...\n\nGunakan toolbar di atas untuk menambahkan heading (H2, H3), link internal, dan gambar.\n\nContoh:\n## Sub Judul\nTulis paragraf di sini...\n\n### Sub-Sub Judul\nTulis lebih detail di sini..."
                                        className="w-full min-h-[600px] border-none focus:ring-0 text-lg leading-relaxed placeholder:text-black/5 p-0 resize-none font-serif"
                                    />
                                </div>

                                {/* Readability Stats Bar */}
                                <div className="flex items-center gap-6 pt-4 border-t border-black/5">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-dagang-gray/60 uppercase tracking-widest">
                                        <Type className="w-3.5 h-3.5" />
                                        {wordCount} kata
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-dagang-gray/60 uppercase tracking-widest">
                                        <Clock className="w-3.5 h-3.5" />
                                        {readTime} mnt baca
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-dagang-gray/60 uppercase tracking-widest">
                                        <BookOpen className="w-3.5 h-3.5" />
                                        {paragraphCount} paragraf
                                    </div>
                                    {focusKeyword && (
                                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                            keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 'text-emerald-500' : keywordDensity > 2.5 ? 'text-red-500' : 'text-amber-500'
                                        }`}>
                                            <Activity className="w-3.5 h-3.5" />
                                            Density: {keywordDensity.toFixed(1)}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SEO Sidebar */}
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[32px] border border-black/5 shadow-sm space-y-8 sticky top-28">
                                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-dagang-green" /> SEO Parameters
                                </h3>

                                {/* Live SEO Score Ring */}
                                <div className="flex items-center gap-6 p-6 bg-dagang-light/30 rounded-3xl border border-black/5">
                                    <div className="relative w-20 h-20 shrink-0">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                            <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-black/5" />
                                            <circle 
                                                cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round"
                                                className={`${scoreBg} transition-all duration-700`}
                                                strokeDasharray={`${seoScore * 0.974} 100`}
                                            />
                                        </svg>
                                        <div className={`absolute inset-0 flex items-center justify-center text-lg font-black ${scoreColor}`}>
                                            {seoScore}
                                        </div>
                                    </div>
                                    <div>
                                        <div className={`text-sm font-black ${scoreColor}`}>
                                            {seoScore >= 80 ? 'Sangat Baik!' : seoScore >= 50 ? 'Cukup Baik' : 'Perlu Perbaikan'}
                                        </div>
                                        <div className="text-[10px] text-dagang-gray/60 font-bold mt-1">
                                            {passedChecks}/{seoChecks.length} kriteria terpenuhi
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Google SERP Preview */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest flex items-center gap-2">
                                            <Search className="w-3 h-3" /> Google Preview
                                        </label>
                                        <div className="bg-white border border-black/10 rounded-2xl p-5 space-y-1.5 shadow-sm">
                                            <div className="text-sm text-blue-700 font-medium truncate cursor-pointer hover:underline">
                                                {currentPost.title || 'Judul Artikel Anda'}
                                            </div>
                                            <div className="text-[11px] text-emerald-700 truncate">
                                                uangku.id/blog/{currentPost.slug || 'slug-artikel'}
                                            </div>
                                            <div className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                                {currentPost.meta_description || 'Meta deskripsi akan muncul di sini. Tulis ringkasan menarik untuk hasil pencarian Google...'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Featured Image */}
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

                                    {/* Image Alt Text */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">
                                            Image Alt Text <span className="text-amber-500">(SEO)</span>
                                        </label>
                                        <input 
                                            type="text"
                                            value={currentPost.image_alt_text || ''}
                                            onChange={(e) => setCurrentPost({...currentPost, image_alt_text: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-xs"
                                            placeholder="Deskripsikan gambar untuk aksesibilitas & SEO..."
                                        />
                                    </div>

                                    {/* Publishing Status */}
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

                                    {/* Meta Description */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Meta Description</label>
                                        <textarea 
                                            value={currentPost.meta_description}
                                            onChange={(e) => setCurrentPost({...currentPost, meta_description: e.target.value})}
                                            maxLength={160}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-xs min-h-[100px] leading-relaxed"
                                            placeholder="Write a compelling summary for search results..."
                                        />
                                        <div className={`text-[9px] text-right font-bold ${metaLen >= 80 && metaLen <= 160 ? 'text-emerald-500' : metaLen > 0 ? 'text-amber-500' : 'text-dagang-gray/40'}`}>
                                            {metaLen}/160 {metaLen >= 80 && metaLen <= 160 ? 'âœ“' : ''}
                                        </div>
                                    </div>

                                    {/* Focus Keywords */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">Focus Keywords</label>
                                        <input 
                                            type="text" 
                                            value={currentPost.keywords}
                                            onChange={(e) => setCurrentPost({...currentPost, keywords: e.target.value})}
                                            className="w-full bg-dagang-light border border-black/5 rounded-xl px-4 py-3 text-xs"
                                            placeholder="e.g. hemat, keluarga, tips (kata kunci pertama = fokus)"
                                        />
                                        {focusKeyword && (
                                            <div className="space-y-2 mt-3 p-4 bg-dagang-light/50 rounded-xl border border-black/5">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-dagang-gray/60 mb-2">Keyword Placement</div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[
                                                        { label: 'Judul', ok: keywordInTitle },
                                                        { label: 'Meta Desc', ok: keywordInMeta },
                                                        { label: 'Konten', ok: keywordInContent },
                                                        { label: 'Slug', ok: keywordInSlug },
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-1.5">
                                                            {item.ok 
                                                                ? <CheckCircle className="w-3 h-3 text-emerald-500" /> 
                                                                : <XCircle className="w-3 h-3 text-red-400" />
                                                            }
                                                            <span className={`text-[10px] font-bold ${item.ok ? 'text-emerald-600' : 'text-red-400'}`}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={`flex items-center gap-1.5 mt-2 text-[10px] font-bold ${
                                                    keywordDensity >= 0.5 && keywordDensity <= 2.5 ? 'text-emerald-600' : keywordDensity > 2.5 ? 'text-red-500' : 'text-amber-500'
                                                }`}>
                                                    {keywordDensity >= 0.5 && keywordDensity <= 2.5 
                                                        ? <CheckCircle className="w-3 h-3" />
                                                        : <AlertTriangle className="w-3 h-3" />
                                                    }
                                                    Density: {keywordDensity.toFixed(1)}% ({keywordCount}x muncul)
                                                    {keywordDensity > 2.5 && ' â€” Terlalu tinggi!'}
                                                    {keywordDensity > 0 && keywordDensity < 0.5 && ' â€” Terlalu rendah'}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* SEO Checklist */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest flex items-center gap-2">
                                            <Info className="w-3 h-3" /> SEO Checklist
                                        </label>
                                        <div className="space-y-1.5">
                                            {seoChecks.map((check, i) => (
                                                <div key={i} className={`flex items-center gap-2 text-[10px] font-bold py-1.5 px-3 rounded-lg ${
                                                    check.pass ? 'text-emerald-600 bg-emerald-50' : 'text-red-400 bg-red-50/50'
                                                }`}>
                                                    {check.pass 
                                                        ? <CheckCircle className="w-3 h-3 shrink-0" /> 
                                                        : <XCircle className="w-3 h-3 shrink-0" />
                                                    }
                                                    {check.label}
                                                </div>
                                            ))}
                                        </div>
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
                                        <Save className="w-4 h-4" /> Simpan Artikel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    );
                })() : activeSection === 'dashboard' ? (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard 
                                icon={BarChart3} 
                                label="Total Views" 
                                value={posts.reduce((sum, p) => sum + (p.views_count || 0), 0).toLocaleString('id-ID')} 
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
                ) : activeSection === 'sitemap' ? (() => {
                    const baseUrl = 'https://uangku.id';
                    
                    return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h2 className="text-3xl font-serif text-dagang-dark">Sitemap & Bot Control</h2>
                                <p className="text-sm text-dagang-gray font-serif">Kelola bagaimana Google memindai dan mengindeks situs Anda.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => setShowAddPath(true)}
                                    className="px-6 py-3 bg-dagang-green text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-dagang-green/10 hover:bg-dagang-green/90 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Tambah Path
                                </button>
                                <a href="/sitemap.xml" target="_blank" className="px-6 py-3 bg-white border border-black/5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-dagang-light transition-colors">
                                    <Globe className="w-4 h-4 mr-2 inline" /> Sitemap.xml
                                </a>
                            </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Managed Paths', value: sitemapConfigs.length, color: 'text-emerald-600 bg-emerald-50' },
                                { label: 'Bot Allowed', value: sitemapConfigs.filter(c => c.allow_bots).length, color: 'text-blue-600 bg-blue-50' },
                                { label: 'Bot Blocked', value: sitemapConfigs.filter(c => !c.allow_bots).length, color: 'text-red-600 bg-red-50' },
                                { label: 'Active Articles', value: posts.filter(p => p.status === 'published').length, color: 'text-purple-600 bg-purple-50' },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm">
                                    <div className={`text-2xl font-black ${stat.color.split(' ')[0]}`}>{stat.value}</div>
                                    <div className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest mt-1">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {/* Management Section */}
                            <div className="bg-white rounded-[40px] border border-black/5 shadow-sm overflow-hidden mb-8">
                                <div className="px-8 py-6 border-b border-black/5 bg-dagang-light/10 flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-dagang-green text-white rounded-2xl flex items-center justify-center shadow-lg shadow-dagang-green/20">
                                            <Settings className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-serif text-dagang-dark">Bot Indexing Control</h3>
                                            <p className="text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest mt-1">Nyalakan/Matikan akses bot untuk setiap path</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-dagang-gray/60">Googlebot</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-dagang-gray/60">Bingbot</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest border-b border-black/5 bg-gray-50/30">
                                                <th className="px-8 py-5">Path / URL</th>
                                                <th className="px-8 py-5">Googlebot & Others</th>
                                                <th className="px-8 py-5">Priority</th>
                                                <th className="px-8 py-5">Frequency</th>
                                                <th className="px-8 py-5 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {sitemapLoading ? (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-16 text-center">
                                                        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-dagang-green opacity-30" />
                                                        <p className="text-xs text-dagang-gray mt-4 font-serif italic">Memuat data sitemap...</p>
                                                    </td>
                                                </tr>
                                            ) : sitemapConfigs.length > 0 ? (
                                                sitemapConfigs.map((cfg) => (
                                                    <tr key={cfg.id} className="hover:bg-dagang-light/10 transition-colors group">
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${cfg.allow_bots ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-mono text-xs font-bold text-dagang-dark group-hover:text-dagang-green transition-colors">{cfg.path}</span>
                                                                    <span className="text-[9px] text-dagang-gray/50">Full: {baseUrl}{cfg.path}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex items-center gap-4">
                                                                <button 
                                                                    onClick={() => handleToggleBots(cfg.id)}
                                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none ${cfg.allow_bots ? 'bg-dagang-green' : 'bg-gray-200'}`}
                                                                >
                                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${cfg.allow_bots ? 'translate-x-6' : 'translate-x-1'}`} />
                                                                </button>
                                                                <div className="flex flex-col">
                                                                    <span className={`text-[10px] font-black uppercase ${cfg.allow_bots ? 'text-emerald-600' : 'text-red-500'}`}>
                                                                        {cfg.allow_bots ? 'Allowed' : 'Blocked'}
                                                                    </span>
                                                                    <span className="text-[8px] text-dagang-gray/40 font-mono">Status in robots.txt</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="px-3 py-1 bg-gray-100 rounded-lg inline-block text-[10px] font-black text-gray-600">
                                                                {cfg.priority.toFixed(1)}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-[9px] font-black uppercase text-dagang-gray/50 tracking-widest px-2 py-1 border border-black/5 rounded-md">
                                                                {cfg.change_freq}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-right">
                                                            <button 
                                                                onClick={() => handleDeletePath(cfg.id, cfg.path)}
                                                                className="p-2.5 text-red-400 hover:text-white hover:bg-red-500 transition-all rounded-xl border border-transparent hover:shadow-lg hover:shadow-red-500/20"
                                                            >
                                                                <Trash2 className="w-4.5 h-4.5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <ShieldAlert className="w-12 h-12 text-dagang-gray/20 mb-4" />
                                                            <p className="text-dagang-gray/40 font-serif italic">Belum ada konfigurasi path sitemap.</p>
                                                            <button 
                                                                onClick={() => setShowAddPath(true)}
                                                                className="mt-6 px-6 py-2 border-2 border-dagang-green/20 text-dagang-green rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dagang-green hover:text-white transition-all"
                                                            >
                                                                Tambah Konfigurasi Pertama
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        {/* Yoast-style Sitemap Preview Overlay */}
                        <div className="bg-white rounded-[40px] border border-black/5 shadow-xl p-10 space-y-8 font-sans relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Globe className="w-40 h-40 text-dagang-dark" />
                            </div>
                            
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-4">
                                    <h1 className="text-4xl font-bold text-gray-800">XML Sitemap</h1>
                                    <div className="space-y-2 text-gray-600 leading-relaxed text-sm lg:text-base">
                                        <p>
                                            Generated by <span className="text-red-600 font-bold italic">UangKu SEO</span>, this is an XML Sitemap, meant for consumption by search engines.
                                        </p>
                                        <p>
                                            You can find more information about XML sitemaps on <a href="https://sitemaps.org" target="_blank" className="text-red-600 font-bold hover:underline">sitemaps.org</a>.
                                        </p>
                                    </div>
                                    <div className="pt-4 text-gray-700 font-semibold border-t border-gray-100 flex items-center justify-between">
                                        <span>This XML Sitemap Index file contains {sitemapConfigs.filter(c => !c.is_private).length} entries.</span>
                                        <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-black uppercase tracking-widest animate-pulse">Live Preview</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-100 rounded-3xl">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b-2 border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest bg-gray-50/50">
                                                <th className="px-6 py-4">Sitemap / URL Path</th>
                                                <th className="px-6 py-4 w-56 text-right">Last Modified (GMT)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {sitemapConfigs.filter(c => !c.is_private).length > 0 ? sitemapConfigs.filter(c => !c.is_private).map((cfg, i) => (
                                                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/20 hover:bg-red-50/30 transition-colors'}>
                                                    <td className="px-6 py-4">
                                                        <a href={cfg.path} target="_blank" className="text-blue-600 hover:text-red-600 hover:underline text-sm font-medium transition-colors">
                                                            {baseUrl}{cfg.path}
                                                        </a>
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] text-gray-400 font-mono text-right">
                                                        {new Date().toISOString().replace('T', ' ').substring(0, 19)} +00:00
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={2} className="px-6 py-10 text-center text-gray-400 text-sm italic">
                                                        Tidak ada entri sitemap publik.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        </div>

                        {/* Perbedaan XML vs HTML */}
                        {/* Add Path Modal */}
                        {showAddPath && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    className="absolute inset-0 bg-dagang-dark/40 backdrop-blur-md"
                                    onClick={() => setShowAddPath(false)}
                                />
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden border border-black/5"
                                >
                                    <div className="p-6 border-b border-black/5 bg-dagang-light/10 relative">
                                        <div className="absolute top-6 right-6 cursor-pointer text-dagang-gray hover:text-dagang-dark" onClick={() => setShowAddPath(false)}>
                                            <XCircle className="w-6 h-6 opacity-20" />
                                        </div>
                                        <div className="w-12 h-12 bg-dagang-green text-white rounded-[20px] flex items-center justify-center mb-4 shadow-xl shadow-dagang-green/20">
                                            <Plus className="w-6 h-6" />
                                        </div>
                                        <h3 className="text-2xl font-serif text-dagang-dark">Tambah Path Sitemap</h3>
                                        <p className="text-[11px] text-dagang-gray font-serif mt-1">Daftarkan URL statis atau halaman khusus ke sitemap.xml.</p>
                                    </div>
                                    <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                        <div className="space-y-2.5">
                                            <label className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest pl-1">Path URL (Dimulai dengan /)</label>
                                            <div className="flex items-center gap-2.5 text-sm bg-dagang-light/50 px-5 py-3 rounded-[20px] border border-black/5 focus-within:border-dagang-green/50 transition-all shadow-inner">
                                                <Globe className="w-4 h-4 text-dagang-green/40" />
                                                <span className="text-dagang-gray/60 font-semibold text-xs">uangku.id</span>
                                                <input 
                                                    type="text"
                                                    value={newPathForm.path}
                                                    onChange={e => setNewPathForm({...newPathForm, path: e.target.value})}
                                                    placeholder="/promo-spesial"
                                                    className="flex-1 bg-transparent border-none focus:ring-0 p-0 font-mono text-[13px] font-bold text-dagang-dark"
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest pl-1">Priority</label>
                                                <div className="relative">
                                                    <select 
                                                        value={newPathForm.priority}
                                                        onChange={e => setNewPathForm({...newPathForm, priority: parseFloat(e.target.value)})}
                                                        className="w-full bg-dagang-light/50 px-5 py-3 rounded-[20px] border border-black/5 text-xs font-bold text-dagang-dark focus:ring-dagang-green appearance-none"
                                                    >
                                                        {[1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1].map(p => (
                                                            <option key={p} value={p}>{p.toFixed(1)} - {p >= 0.8 ? 'Tinggi' : p >= 0.5 ? 'Normal' : 'Rendah'}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                                        <Activity className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2.5">
                                                <label className="text-[10px] font-black text-dagang-gray/50 uppercase tracking-widest pl-1">Update Freq</label>
                                                <div className="relative">
                                                    <select 
                                                        value={newPathForm.change_freq}
                                                        onChange={e => setNewPathForm({...newPathForm, change_freq: e.target.value})}
                                                        className="w-full bg-dagang-light/50 px-5 py-3 rounded-[20px] border border-black/5 text-xs font-bold text-dagang-dark focus:ring-dagang-green appearance-none"
                                                    >
                                                        <option value="always">Always</option>
                                                        <option value="hourly">Hourly</option>
                                                        <option value="daily">Daily</option>
                                                        <option value="weekly">Weekly</option>
                                                        <option value="monthly">Monthly</option>
                                                        <option value="yearly">Yearly</option>
                                                        <option value="never">Never</option>
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-5 bg-emerald-50 rounded-[28px] border border-emerald-100 flex items-center justify-between shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-white rounded-xl text-emerald-500 shadow-sm border border-emerald-100">
                                                    <CheckCircle className="w-5 h-5" />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <div className="text-[11px] font-black text-emerald-800 uppercase tracking-widest">Index Website</div>
                                                    <div className="text-[10px] text-emerald-700/70 font-serif leading-tight">Izinkan bot merayapi halaman ini.</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setNewPathForm({...newPathForm, allow_bots: !newPathForm.allow_bots})}
                                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-500 focus:outline-none shadow-inner ${newPathForm.allow_bots ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                            >
                                                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-xl transition-transform duration-500 ${newPathForm.allow_bots ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-dagang-light/20 border-t border-black/5 flex items-center justify-end gap-4">
                                        <button 
                                            onClick={() => setShowAddPath(false)}
                                            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-dagang-gray hover:text-dagang-dark transition-all rounded-xl"
                                        >
                                            Batal
                                        </button>
                                        <button 
                                            onClick={handleAddPath}
                                            className="px-10 py-3 bg-dagang-dark text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center gap-2"
                                        >
                                            <Save className="w-3.5 h-3.5" /> Simpan Path
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </div>
                    );
                })() : null}
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
