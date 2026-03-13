import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getStorageUrl } from '../../services/api';
import { motion } from 'framer-motion';
import { 
    Calendar, 
    Share2,
    Clock,
    Tag,
    ArrowLeft
} from 'lucide-react';
import { PublicHeader } from '../../components/common/PublicHeader';
import { PublicFooter } from '../../components/common/PublicFooter';

export const BlogDetail = () => {
    const { slug } = useParams();
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [recommendations, setRecommendations] = useState<any[]>([]);

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

    if (loading) return (
        <div className="min-h-screen bg-white">
            <PublicHeader />
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
            </div>
            <PublicFooter />
        </div>
    );

    if (!post) return (
        <div className="min-h-screen bg-dagang-cream">
            <PublicHeader />
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
                <h2 className="text-3xl font-serif">Artikel tidak ditemukan</h2>
                <Link to="/blog" className="px-8 py-4 bg-dagang-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Kembali ke Blog</Link>
            </div>
            <PublicFooter />
        </div>
    );

    return (
        <div className="min-h-screen bg-white">
            <PublicHeader />
            <div className="text-dagang-dark">
                {/* Header / Meta */}
                <header className="pt-48 pb-16 px-6 bg-dagang-cream/30 border-b border-black/5">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <Link 
                            to="/blog" 
                            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-dagang-gray hover:text-dagang-green transition-colors group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Kembali ke Daftar
                        </Link>

                        <div className="space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3"
                            >
                                <span className="px-3 py-1 bg-dagang-green/10 text-dagang-green rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {post.category?.name || 'Umum'}
                                </span>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-dagang-gray uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" /> 5 Menit Baca
                                </div>
                            </motion.div>

                            <motion.h1 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-4xl md:text-6xl font-serif leading-tight text-dagang-dark"
                            >
                                {post.title}
                            </motion.h1>

                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="flex items-center justify-between py-6 border-y border-black/5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-dagang-dark rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        A
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">Admin Uangku</div>
                                        <div className="text-[10px] text-dagang-gray font-black uppercase tracking-widest">Content Strategist</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-dagang-gray font-black uppercase tracking-widest mb-1">Diterbitkan Pada</div>
                                    <div className="text-sm font-bold flex items-center gap-2 justify-end">
                                        <Calendar className="w-4 h-4 text-dagang-green" />
                                        {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </header>

                {/* Featured Image */}
                <div className="max-w-6xl mx-auto px-6 -mt-10 md:-mt-20">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="aspect-[21/9] rounded-[40px] overflow-hidden shadow-2xl border-4 border-white relative"
                    >
                        {post.featured_image ? (
                            <img 
                                src={getStorageUrl(post.featured_image)} 
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-dagang-light flex items-center justify-center">
                                <Tag className="w-20 h-20 text-dagang-gray/10" />
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* Content Body */}
                <main className="max-w-4xl mx-auto px-6 py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                        {/* Floating Sidebar Shared */}
                        <aside className="lg:col-span-1 hidden lg:block sticky top-32 h-fit">
                            <div className="flex flex-col gap-4">
                                <button className="w-12 h-12 rounded-full border border-black/5 flex items-center justify-center hover:bg-dagang-dark hover:text-white transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <div className="w-[1px] h-10 bg-black/5 mx-auto" />
                                <div className="text-[10px] font-black uppercase tracking-widest text-dagang-gray [writing-mode:vertical-lr] rotate-180 py-4">Bagikan</div>
                            </div>
                        </aside>

                        {/* Article Body */}
                        <div className="lg:col-span-11 space-y-12">
                            {/* Summary / Intro */}
                            <div className="text-2xl font-serif italic text-dagang-gray leading-relaxed border-l-4 border-dagang-green pl-10 py-2">
                                {post.meta_description}
                            </div>

                            {/* Main Content Rendered with simple spacing */}
                            <div className="prose prose-lg prose-dagang max-w-none">
                                <div className="text-lg leading-relaxed text-dagang-dark/80 font-serif whitespace-pre-line space-y-6">
                                    {post.content}
                                </div>
                            </div>

                            {/* Tags */}
                            {post.keywords && (
                                <div className="pt-12 border-t border-black/5 flex gap-3 flex-wrap">
                                    {post.keywords.split(',').map((tag: string, i: number) => (
                                        <span key={i} className="px-4 py-2 bg-dagang-light rounded-xl text-[10px] font-black uppercase tracking-widest text-dagang-gray">
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Recommendations */}
                <section className="bg-dagang-cream/20 py-20 border-t border-black/5">
                    <div className="max-w-7xl mx-auto px-6 space-y-12">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-serif">Artikel Terkait</h2>
                            <Link to="/blog" className="text-[10px] font-black uppercase tracking-widest text-dagang-green flex items-center gap-2 hover:underline">
                                Lihat Semua <ArrowLeft className="w-4 h-4 rotate-180" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {recommendations.map(rec => (
                                <Link key={rec.id} to={`/blog/${rec.slug}`} className="group space-y-4">
                                    <div className="aspect-video rounded-3xl overflow-hidden border border-black/5">
                                        <img 
                                            src={getStorageUrl(rec.featured_image)} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            alt={rec.title} 
                                        />
                                    </div>
                                    <h4 className="text-lg font-bold font-serif group-hover:text-dagang-green transition-colors">{rec.title}</h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Floating Action Button for Mobile Share */}
                <div className="fixed bottom-10 right-10 lg:hidden shadow-2xl z-50">
                    <button className="w-14 h-14 bg-dagang-dark text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform">
                        <Share2 className="w-6 h-6" />
                    </button>
                </div>
            </div>
            <PublicFooter />
        </div>
    );
};
