import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';
import { motion } from 'framer-motion';
import { 
    Search, 
    Calendar, 
    User, 
    ArrowRight,
    SearchX,
    Folder
} from 'lucide-react';
import { PublicHeader } from '../../components/common/PublicHeader';
import { PublicFooter } from '../../components/common/PublicFooter';

export const BlogList = () => {
    const { t, i18n } = useTranslation();
    const [posts, setPosts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsRes, catsRes] = await Promise.all([
                    api.get('/blog'),
                    api.get('/blog/categories')
                ]);
                setPosts(postsRes.data);
                setCategories(catsRes.data);
            } catch (error) {
                console.error("Failed to fetch blog data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredPosts = posts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             post.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || post.category?.name === selectedCategory;
        const isPublished = post.status === 'published';
        return matchesSearch && matchesCategory && isPublished;
    });

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--text-main)]">
            <PublicHeader />
            <div className="pb-20">
                {/* Header Spacer - keeps light bg behind the transparent header */}
                <div className="h-[80px] bg-[#faf8f3]" />
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-dagang-dark text-white pt-20 pb-24 px-6 md:px-10">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--primary)] opacity-10 blur-[130px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[var(--accent)] opacity-5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
                    
                    <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[var(--primary)] mb-6 backdrop-blur-sm shadow-xl"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                            {t('blogList.hero.badge')}
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="text-6xl md:text-8xl font-heading leading-tight tracking-tighter"
                        >
                            {t('blogList.hero.titlePart1')} <span className="italic text-[var(--accent)] drop-shadow-sm">{t('blogList.hero.titlePart2')}</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-xl text-white/50 max-w-2xl mx-auto font-sans leading-relaxed"
                        >
                            {t('blogList.hero.subtitle')}
                        </motion.p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
                    <div className="bg-[var(--surface-card)] backdrop-blur-2xl border border-[var(--border)] p-4 rounded-[28px] shadow-2xl shadow-black/10 flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1 flex items-center gap-4 bg-black/5 dark:bg-white/5 border border-[var(--border)] rounded-[20px] px-5 py-3.5 w-full group focus-within:ring-2 focus-within:ring-[var(--primary)]/20 transition-all">
                            <Search className="w-5 h-5 text-[var(--text-muted)] opacity-50 group-focus-within:text-[var(--primary)] group-focus-within:opacity-100 transition-all" />
                            <input 
                                type="text" 
                                placeholder={t('blogList.filter.searchPlaceholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-bold w-full text-[var(--text-main)] placeholder:text-[var(--text-muted)] placeholder:opacity-50"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto px-2 no-scrollbar">
                            <button 
                                onClick={() => setSelectedCategory('All')}
                                className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap active:scale-95 ${
                                    selectedCategory === 'All' 
                                    ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 border-[var(--primary)]' 
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 border-[var(--border)]'
                                }`}
                            >
                                {t('blogList.filter.all')}
                            </button>
                            {categories.map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap active:scale-95 ${
                                        selectedCategory === cat.name 
                                        ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20 border-[var(--primary)]' 
                                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10 border-[var(--border)]'
                                    }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="max-w-7xl mx-auto px-6 py-20">
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredPosts.map((post, index) => (
                                <motion.article
                                    key={post.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05, duration: 0.5 }}
                                    className="group bg-[var(--surface-card)] rounded-[28px] border border-[var(--border)] shadow-sm hover:shadow-2xl hover:shadow-[var(--primary)]/5 transition-all duration-500 overflow-hidden flex flex-col h-full"
                                >
                                    <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                                        {post.featured_image ? (
                                            <img 
                                                src={getStorageUrl(post.featured_image)} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-[var(--text-muted)] opacity-20">
                                                <Folder className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-2 bg-[var(--surface-card)]/90 backdrop-blur-md border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm text-[var(--primary)]">
                                                {post.category?.name || t('blogList.card.generalCategory')}
                                            </span>
                                        </div>
                                    </Link>
                                    
                                    <div className="p-8 flex flex-col flex-1 space-y-5">
                                        <div className="flex items-center gap-4 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[var(--primary)]" /> {new Date(post.created_at).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-[var(--primary)]" /> {t('blogList.card.admin')}</div>
                                        </div>
                                        <Link to={`/blog/${post.slug}`} className="block group/title">
                                            <h3 className="text-2xl font-heading text-[var(--text-main)] leading-tight group-hover/title:text-[var(--primary)] transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 font-medium opacity-80">
                                            {post.meta_description || post.content.substring(0, 150) + '...'}
                                        </p>
                                        <div className="pt-6 mt-auto border-t border-[var(--border)] border-dashed">
                                            <Link 
                                                to={`/blog/${post.slug}`}
                                                className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] group/btn"
                                            >
                                                {t('blogList.card.readMore')} 
                                                <div className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/5 group-hover/btn:bg-[var(--primary)] group-hover/btn:text-white transition-all flex items-center justify-center shadow-inner">
                                                    <ArrowRight className="w-4 h-4" />
                                                </div>
                                            </Link>
                                        </div>
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 space-y-6">
                            <div className="w-20 h-20 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-[var(--text-muted)] opacity-30">
                                <SearchX className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-heading text-[var(--text-main)]">{t('blogList.empty.title')}</h3>
                                <p className="text-[var(--text-muted)] opacity-60">{t('blogList.empty.desc')}</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
            <PublicFooter />
        </div>
    );
};
