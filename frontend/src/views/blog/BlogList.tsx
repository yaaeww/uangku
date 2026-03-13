import { useState, useEffect } from 'react';
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
        <div className="min-h-screen bg-dagang-cream flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-dagang-green/20 border-t-dagang-green rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-dagang-cream text-dagang-dark">
            <PublicHeader />
            <div className="pb-20">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-dagang-dark text-white pt-48 pb-20 px-6">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-dagang-green opacity-10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-dagang-accent opacity-5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />
                    
                    <div className="max-w-7xl mx-auto relative z-10 text-center space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 bg-dagang-green/20 border border-dagang-green/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-dagang-green-pale mb-4"
                        >
                            Wawasan Keuangan Keluarga
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-serif leading-tight"
                        >
                            Blog <span className="italic text-dagang-accent">Uangku</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-white/60 max-w-2xl mx-auto font-serif"
                        >
                            Tips cerdas mengatur keuangan, rencana masa depan, dan strategi investasi untuk keluarga modern.
                        </motion.p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
                    <div className="bg-white/80 backdrop-blur-xl border border-white p-4 rounded-[32px] shadow-2xl shadow-black/5 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 flex items-center gap-4 bg-dagang-cream/50 border border-black/5 rounded-2xl px-6 py-3.5 w-full">
                            <Search className="w-5 h-5 text-dagang-gray/50" />
                            <input 
                                type="text" 
                                placeholder="Cari artikel menarik..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-serif w-full"
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto px-2">
                            <button 
                                onClick={() => setSelectedCategory('All')}
                                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    selectedCategory === 'All' ? 'bg-dagang-dark text-white' : 'text-dagang-gray hover:bg-dagang-light'
                                }`}
                            >
                                Semua
                            </button>
                            {categories.map(cat => (
                                <button 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.name)}
                                    className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                        selectedCategory === cat.name ? 'bg-dagang-dark text-white' : 'text-dagang-gray hover:bg-dagang-light'
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
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group bg-white rounded-[40px] border border-black/5 shadow-sm hover:shadow-2xl hover:shadow-dagang-green/5 transition-all overflow-hidden flex flex-col h-full"
                                >
                                    <Link to={`/blog/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden">
                                        {post.featured_image ? (
                                            <img 
                                                src={getStorageUrl(post.featured_image)} 
                                                alt={post.title}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-dagang-light flex items-center justify-center text-dagang-gray/20">
                                                <Folder className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-6 left-6">
                                            <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                {post.category?.name || 'General'}
                                            </span>
                                        </div>
                                    </Link>
                                    
                                    <div className="p-8 flex flex-col flex-1 space-y-4">
                                        <div className="flex items-center gap-4 text-[10px] font-black text-dagang-gray/40 uppercase tracking-widest">
                                            <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> Admin</div>
                                        </div>
                                        <Link to={`/blog/${post.slug}`} className="block group/title">
                                            <h3 className="text-2xl font-serif text-dagang-dark leading-tight group-hover/title:text-dagang-green transition-colors line-clamp-2">
                                                {post.title}
                                            </h3>
                                        </Link>
                                        <p className="text-sm text-dagang-gray font-serif leading-relaxed line-clamp-3">
                                            {post.meta_description || post.content.substring(0, 150) + '...'}
                                        </p>
                                        <div className="pt-6 mt-auto">
                                            <Link 
                                                to={`/blog/${post.slug}`}
                                                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-dagang-dark group/btn"
                                            >
                                                Baca Selengkapnya 
                                                <div className="w-8 h-8 rounded-full bg-dagang-light group-hover/btn:bg-dagang-green group-hover/btn:text-white transition-all flex items-center justify-center">
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
                            <div className="w-20 h-20 bg-dagang-light rounded-full flex items-center justify-center mx-auto text-dagang-gray/30">
                                <SearchX className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-serif">Artikel tidak ditemukan</h3>
                                <p className="text-dagang-gray font-serif">Coba gunakan kata kunci lain atau pilih kategori yang berbeda.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Newsletter Section */}
                <div className="max-w-7xl mx-auto px-6 pt-20">
                    <div className="bg-dagang-green rounded-[60px] p-10 md:p-20 text-white relative overflow-hidden text-center space-y-10">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
                        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                            <h2 className="text-4xl md:text-5xl font-serif">Jangan Lewatkan Update CerDAS</h2>
                            <p className="text-white/70 font-serif">Kirimkan tips keuangan eksklusif langsung ke inbox Anda setiap minggu. Gratis selamanya.</p>
                            <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-3xl shadow-2xl">
                                <input 
                                    type="email" 
                                    placeholder="Alamat email Anda..." 
                                    className="bg-transparent border-none focus:ring-0 text-black px-6 py-3 flex-1 text-sm font-serif"
                                />
                                <button className="bg-dagang-dark text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Berlangganan</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <PublicFooter />
        </div>
    );
};
