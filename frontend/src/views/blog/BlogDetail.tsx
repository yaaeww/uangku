import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, 
    Share2,
    Clock,
    Tag,
    ArrowLeft,
    ArrowRight,
    X,
    Copy,
    Check,
    Facebook,
    Twitter,
    MessageCircle
} from 'lucide-react';
import { PublicHeader } from '../../components/common/PublicHeader';
import { PublicFooter } from '../../components/common/PublicFooter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const BlogDetail = () => {
    const { t, i18n } = useTranslation();
    const { slug } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const response = await api.get(`/blog/${slug}`);
                setPost(response.data);
                
                // Fetch recommendations (other posts in same category)
                const recsRes = await api.get(`/blog?status=published`);
                setRecommendations(recsRes.data.filter((p: any) => p.slug !== slug).slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch article detail", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [slug]);

    // JSON-LD Schema Markup for SEO
    useEffect(() => {
        if (!post) return;
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": post.title,
            "description": post.meta_description || post.title,
            "image": post.featured_image ? `${window.location.origin}${post.featured_image}` : undefined,
            "author": {
                "@type": "Person",
                "name": post.author?.full_name || "UangKu Team"
            },
            "publisher": {
                "@type": "Organization",
                "name": "UangKu",
                "logo": {
                    "@type": "ImageObject",
                    "url": `${window.location.origin}/logo.png`
                }
            },
            "datePublished": post.created_at,
            "dateModified": post.updated_at || post.created_at,
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": window.location.href
            },
            "keywords": post.keywords || undefined
        };

        // Set page title and meta
        document.title = `${post.title} - UangKu Blog`;
        
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', post.meta_description || post.title);

        // Inject JSON-LD
        const scriptId = 'blog-jsonld';
        let existingScript = document.getElementById(scriptId);
        if (existingScript) existingScript.remove();
        
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
        
        return () => {
            const el = document.getElementById(scriptId);
            if (el) el.remove();
        };
    }, [post]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareData = {
        title: post?.title || 'UangKu Article',
        url: window.location.href
    };

    const socialLinks = [
        { 
            name: 'WhatsApp', 
            icon: MessageCircle, 
            color: 'bg-[#25D366]', 
            link: `https://wa.me/?text=${encodeURIComponent(shareData.title + ' ' + shareData.url)}` 
        },
        { 
            name: 'Facebook', 
            icon: Facebook, 
            color: 'bg-[#1877F2]', 
            link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareData.url)}` 
        },
        { 
            name: 'X (Twitter)', 
            icon: Twitter, 
            color: 'bg-[#000000]', 
            link: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.title)}&url=${encodeURIComponent(shareData.url)}` 
        },
    ];

    if (loading) return (
        <div className="min-h-screen bg-[var(--background)]">
            <PublicHeader />
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
            </div>
            <PublicFooter />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-[var(--background)]">
            <PublicHeader />
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[32px] flex items-center justify-center text-red-500 mb-4">
                    <Tag className="w-12 h-12 opacity-40" />
                </div>
                <h2 className="text-4xl font-heading text-[var(--text-main)]">{t('blogDetail.notFound.title')}</h2>
                <p className="text-[var(--text-muted)] opacity-60 max-w-md text-center font-medium">{t('blogDetail.notFound.desc')}</p>
                <Link to="/blog" className="px-10 py-5 bg-dagang-dark text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 active:scale-95 transition-all hover:opacity-90">{t('blogDetail.notFound.backBtn')}</Link>
            </div>
            <PublicFooter />
        </div>
    );

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <PublicHeader />
            <div className="text-[var(--text-main)]">
                {/* Header / Meta */}
                <header className="pt-32 sm:pt-48 md:pt-56 pb-12 sm:pb-24 px-4 sm:px-6 relative overflow-hidden bg-[var(--surface-card)]">
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/[0.03] to-transparent pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-[100px] pointer-events-none" />
                    
                    <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                        <Link 
                            to="/blog" 
                            className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] hover:text-[var(--primary)] transition-all group px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full border border-[var(--border)]"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('blogDetail.nav.back')}
                        </Link>
                        <div className="space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-4"
                            >
                                <span className="px-5 py-2 bg-[var(--primary)] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[var(--primary)]/20">
                                    {post.category?.name || 'Inspiration'}
                                </span>
                                <div className="flex items-center gap-3 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.15em] opacity-60">
                                    <Clock className="w-4 h-4 text-[var(--primary)]" /> 5 {t('blogDetail.meta.readTime')}
                                </div>
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="text-4xl sm:text-5xl md:text-7xl font-heading leading-tight md:leading-[1.1] tracking-tight text-[var(--text-main)] break-words"
                            >
                                {post.title}
                            </motion.h1>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 py-10 border-t border-[var(--border)] border-dashed mt-12"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-dagang-dark to-black rounded-[24px] flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-black/20 ring-4 ring-white/5 overflow-hidden">
                                        <img 
                                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'Admin')}&background=10b981&color=ffffff&bold=true&font-size=0.33`} 
                                            alt="Author"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-lg font-black text-[var(--text-main)]">{post.author_name || t('blogDetail.meta.admin')}</div>
                                        <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.25em] opacity-40">{t('blogDetail.meta.role')}</div>
                                    </div>
                                </div>
                                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5">
                                    <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em] opacity-30">{t('blogDetail.meta.publishedOn')}</div>
                                    <div className="text-base font-black text-[var(--text-main)] flex items-center gap-2.5">
                                        <Calendar className="w-4 h-4 text-[var(--primary)] opacity-60" />
                                        {new Date(post.created_at).toLocaleDateString(i18n.language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 md:-mt-20">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                            className="aspect-video md:aspect-[21/9] rounded-[32px] sm:rounded-[64px] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-2 sm:border-4 border-[var(--surface-card)] relative group"
                        >
                        {post.featured_image ? (
                            <img 
                                src={getStorageUrl(post.featured_image)} 
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]"
                            />
                        ) : (
                            <div className="w-full h-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                                <Tag className="w-24 h-24 text-[var(--text-muted)] opacity-5" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                    </motion.div>
                </div>

                {/* Content Body */}
                <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-24 md:py-32 overflow-hidden">
                        {/* Article Body */}
                        <div className="space-y-16">
                            {/* Summary / Intro */}
                            <div className="text-lg sm:text-2xl md:text-3xl font-heading text-[var(--text-main)] leading-relaxed border-l-4 sm:border-l-8 border-[var(--primary)] pl-6 sm:pl-12 py-4 sm:py-6 bg-gradient-to-r from-[var(--primary)]/[0.05] to-transparent rounded-r-[32px] sm:rounded-r-[48px] relative overflow-hidden shadow-sm mb-12 sm:mb-16">
                                <div className="absolute -left-4 -top-4 text-6xl sm:text-9xl font-serif text-[var(--primary)]/10 pointer-events-none select-none">“</div>
                                <p className="relative z-10 break-words">{post.meta_description}</p>
                            </div>

                            {/* Main Content Rendered */}
                            <div className="prose prose-emerald prose-sm sm:prose-base md:prose-lg lg:prose-xl prose-headings:font-heading prose-a:text-[var(--primary)] prose-a:font-black prose-a:no-underline hover:prose-a:underline prose-img:rounded-[24px] sm:prose-img:rounded-[32px] prose-img:shadow-2xl dark:prose-invert mx-auto max-w-none w-full break-words overflow-hidden">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {post.content}
                                </ReactMarkdown>
                            </div>

                            {/* Tags */}
                            {post.keywords && (
                                <div className="pt-16 border-t border-[var(--border)] border-dashed flex gap-4 flex-wrap">
                                    <Tag className="w-5 h-5 text-[var(--primary)] opacity-40 mt-1" />
                                    {post.keywords.split(',').map((tag: string, i: number) => (
                                        <span key={i} className="px-6 py-3 bg-[var(--surface-card)] border border-[var(--border)] rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/[0.02] transition-all cursor-pointer shadow-sm">
                                            {tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                </main>

                {/* Desktop Floating Share - Fixed instead of grid to avoid misalignment */}
                <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 z-40">
                    <div className="flex flex-col gap-6 items-center">
                        <button 
                            onClick={() => setShowShareModal(true)}
                            className="w-14 h-14 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] transition-all shadow-xl shadow-black/5 hover:shadow-[var(--primary)]/20 active:scale-90 group/btn"
                        >
                            <Share2 className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <div className="w-[1px] h-20 bg-gradient-to-b from-[var(--border)] to-transparent" />
                        <div className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] opacity-20 [writing-mode:vertical-lr] rotate-180 py-4 select-none">{t('blogDetail.share.wisdom')}</div>
                    </div>
                </div>

                {/* Recommendations */}
                <section className="bg-[var(--surface)] py-24 border-t border-[var(--border)]">
                    <div className="max-w-7xl mx-auto px-6 space-y-16">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-4xl font-heading text-[var(--text-main)]">{t('blogDetail.recommendations.title')}</h2>
                                <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-[0.3em] mt-2">{t('blogDetail.recommendations.subtitle')}</p>
                            </div>
                            <Link to="/blog" className="px-8 py-3 bg-[var(--surface-card)] border border-[var(--border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-main)] flex items-center gap-3 hover:bg-[var(--primary)] hover:text-white transition-all shadow-sm active:scale-95">
                                {t('blogDetail.recommendations.viewAllBtn')} <ArrowLeft className="w-4 h-4 rotate-180" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                            {recommendations.map(rec => (
                                <Link key={rec.id} to={`/blog/${rec.slug}`} className="group flex flex-col h-full bg-[var(--surface-card)] rounded-[40px] border border-[var(--border)] overflow-hidden hover:shadow-2xl hover:shadow-black/5 transition-all duration-500">
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img 
                                            src={getStorageUrl(rec.featured_image)} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                            alt={rec.title} 
                                        />
                                    </div>
                                    <div className="p-8 space-y-4">
                                        <div className="flex items-center gap-3 text-[9px] font-black text-[var(--primary)] uppercase tracking-widest">
                                            {rec.category?.name || t('blogList.card.generalCategory')}
                                        </div>
                                        <h4 className="text-xl font-heading text-[var(--text-main)] group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-tight">{rec.title}</h4>
                                        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)] border-dashed mt-auto">
                                            <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">{t('blogDetail.recommendations.readMore')}</span>
                                            <ArrowRight className="w-4 h-4 text-[var(--primary)] transform group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Floating Action Button for Mobile Share */}
                <div className="fixed bottom-10 right-10 lg:hidden shadow-2xl z-50">
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="w-16 h-16 bg-[var(--primary)] text-white rounded-[24px] flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-2xl shadow-[var(--primary)]/20"
                    >
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShareModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-[var(--surface-card)] rounded-[40px] border border-[var(--border)] shadow-2xl overflow-hidden p-8 space-y-8"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-heading">{t('blogDetail.shareModal.title')}</h3>
                                <button 
                                    onClick={() => setShowShareModal(false)}
                                    className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-[var(--text-muted)]" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">{t('blogDetail.shareModal.copyLink')}</p>
                                <div className="flex items-center gap-3 p-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--border)]">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={window.location.href} 
                                        className="bg-transparent border-none focus:ring-0 text-xs font-bold text-[var(--text-muted)] flex-1 truncate px-2"
                                    />
                                    <button 
                                        onClick={handleCopyLink}
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${copied ? 'bg-green-500 text-white' : 'bg-[var(--primary)] text-white'}`}
                                    >
                                        {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50">{t('blogDetail.shareModal.socialMedia')}</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {socialLinks.map((social) => (
                                        <a 
                                            key={social.name}
                                            href={social.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex flex-col items-center gap-3"
                                        >
                                            <div className={`w-16 h-16 ${social.color} text-white rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform active:scale-95`}>
                                                <social.icon className="w-7 h-7" />
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] opacity-60 group-hover:opacity-100 transition-opacity">{social.name}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PublicFooter />
        </div>
    );
};
