import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';
import { motion } from 'framer-motion';
import { Shield, Target, Users, Zap } from 'lucide-react';

export const AboutPage: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-dagang-cream flex flex-col">
            <PublicHeader />
            
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto space-y-20">
                    
                    {/* Hero Section */}
                    <section className="text-center space-y-6">
                        <motion.span 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 bg-dagang-green/10 text-dagang-green text-xs font-bold tracking-widest uppercase rounded-full"
                        >
                            {t('aboutPage.hero.badge')}
                        </motion.span>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-serif text-dagang-dark leading-tight"
                        >
                            {t('aboutPage.hero.titlePart1')} <br />
                            <span className="text-dagang-green italic">{t('aboutPage.hero.titlePart2')}</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg text-dagang-gray max-w-2xl mx-auto leading-relaxed"
                        >
                            {t('aboutPage.hero.subtitle')}
                        </motion.p>
                    </section>

                    {/* Visi Misi */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="p-8 bg-white rounded-3xl border border-dagang-dark/5 shadow-xl shadow-dagang-dark/5 space-y-4"
                        >
                            <div className="w-12 h-12 bg-dagang-green text-white rounded-2xl flex items-center justify-center">
                                <Target className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-serif text-dagang-dark">{t('aboutPage.vision.title')}</h3>
                            <p className="text-dagang-gray leading-relaxed">
                                {t('aboutPage.vision.desc')}
                            </p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="p-8 bg-white rounded-3xl border border-dagang-dark/5 shadow-xl shadow-dagang-dark/5 space-y-4"
                        >
                            <div className="w-12 h-12 bg-dagang-accent text-dagang-dark rounded-2xl flex items-center justify-center">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-serif text-dagang-dark">{t('aboutPage.mission.title')}</h3>
                            <ul className="text-dagang-gray space-y-2 list-disc list-inside leading-relaxed">
                                <li>{t('aboutPage.mission.items.0')}</li>
                                <li>{t('aboutPage.mission.items.1')}</li>
                                <li>{t('aboutPage.mission.items.2')}</li>
                                <li>{t('aboutPage.mission.items.3')}</li>
                            </ul>
                        </motion.div>
                    </div>

                    {/* Core Values */}
                    <section className="space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-serif text-dagang-dark">{t('aboutPage.values.title')}</h2>
                            <p className="text-dagang-gray">{t('aboutPage.values.subtitle')}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {[
                                { 
                                    icon: Shield, 
                                    title: t('aboutPage.values.items.0.title'), 
                                    desc: t('aboutPage.values.items.0.desc'),
                                    color: 'text-dagang-green'
                                },
                                { 
                                    icon: Users, 
                                    title: t('aboutPage.values.items.1.title'), 
                                    desc: t('aboutPage.values.items.1.desc'),
                                    color: 'text-dagang-accent'
                                },
                                { 
                                    icon: Zap, 
                                    title: t('aboutPage.values.items.2.title'), 
                                    desc: t('aboutPage.values.items.2.desc'),
                                    color: 'text-orange-500'
                                }
                            ].map((value, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="text-center space-y-4"
                                >
                                    <div className={`mx-auto w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/5 ${value.color}`}>
                                        <value.icon className="w-8 h-8" />
                                    </div>
                                    <h4 className="text-lg font-bold text-dagang-dark uppercase tracking-wider">{value.title}</h4>
                                    <p className="text-sm text-dagang-gray leading-relaxed">{value.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};
