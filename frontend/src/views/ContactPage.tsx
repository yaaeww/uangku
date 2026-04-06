import React from 'react';
import { useTranslation } from 'react-i18next';
import { PublicHeader } from '../components/common/PublicHeader';
import { PublicFooter } from '../components/common/PublicFooter';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, MapPin, Instagram, Youtube, Facebook, Twitter, Link2 } from 'lucide-react';
import { AdminController } from '../controllers/AdminController';
import { useEffect, useState } from 'react';

export const ContactPage: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await AdminController.getPublicSettings();
                setSettings(data || {});
            } catch (error) {
                console.error('Failed to fetch public settings', error);
            }
        };
        fetchSettings();
    }, []);

    const socialMedia = [
        { icon: Instagram, label: 'Instagram (Jasaweb Pro)', link: settings.social_instagram_1 || 'https://www.instagram.com/jasaweb_pro/' },
        { icon: Instagram, label: 'Instagram (AplikasiDagang)', link: settings.social_instagram_2 || 'https://www.instagram.com/aplikasidagang/' },
        { icon: Youtube, label: 'Youtube', link: settings.social_youtube || 'https://www.youtube.com/@aplikasidagang' },
        { icon: Facebook, label: 'Facebook', link: settings.social_facebook || 'https://www.facebook.com/aplikasidagang?_rdc=1&_rdr#' },
        { icon: Link2, label: 'Tiktok', link: settings.social_tiktok || 'https://www.tiktok.com/@aplikasidagang' },
        { icon: Twitter, label: 'X (Twitter)', link: settings.social_twitter || 'https://x.com/aplikasidagang' },
    ];

    return (
        <div className="min-h-screen bg-dagang-cream flex flex-col font-sans">
            <PublicHeader />
            
            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto space-y-16">
                    <header className="text-center space-y-4">
                         <h1 className="text-4xl md:text-5xl font-serif text-dagang-dark italic leading-tight">{t('contactPage.hero.titlePart1')} <span className="text-dagang-green">{t('contactPage.hero.titlePart2')}</span></h1>
                         <p className="text-dagang-gray max-w-2xl mx-auto leading-relaxed font-serif italic text-lg">
                            {t('contactPage.hero.desc')}
                         </p>
                    </header>

                    <div className="grid md:grid-cols-5 gap-12 items-start">
                        
                        {/* Left Column: Info Card */}
                        <div className="md:col-span-2 space-y-8 bg-white p-10 rounded-[40px] shadow-2xl shadow-dagang-dark/5 border border-dagang-dark/5">
                            <h3 className="text-2xl font-serif text-dagang-dark">{t('contactPage.info.title')}</h3>
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-dagang-green-pale text-dagang-green flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-dagang-gray uppercase tracking-widest mb-1">{t('contactPage.info.building')}</p>
                                        <p className="text-dagang-dark text-sm leading-relaxed">
                                            {settings.contact_building || t('contactPage.info.address')}
                                        </p>
                                        <p className="text-dagang-dark/60 text-xs mt-1">
                                            {settings.contact_address}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-dagang-gray uppercase tracking-widest mb-1">{t('contactPage.info.emailSupport')}</p>
                                        <p className="text-dagang-dark text-sm">{settings.contact_email_support || 'info@aplikasidagang.co.id'}</p>
                                        <p className="text-dagang-dark/60 text-xs">{settings.contact_email_admin || 'admin@aplikasidagang.co.id'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-dagang-green-pale text-dagang-green flex items-center justify-center flex-shrink-0">
                                        <MessageCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-dagang-gray uppercase tracking-widest mb-1">{t('contactPage.info.phone')}</p>
                                        <p className="text-dagang-dark text-sm">{settings.contact_phone_primary || '0812 2242 9289'}</p>
                                        <p className="text-dagang-dark/60 text-xs">{settings.contact_phone_secondary || '0813 8486 8040'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-dagang-dark/5 space-y-6">
                                <h4 className="text-sm font-black text-dagang-dark uppercase tracking-widest">{t('contactPage.social.title')}</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {socialMedia.map((social, idx) => (
                                        <a 
                                            key={idx} 
                                            href={social.link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-2xl bg-dagang-cream hover:bg-dagang-green-pale text-dagang-gray hover:text-dagang-green transition-all border border-transparent hover:border-dagang-green/20 overflow-hidden"
                                        >
                                            <social.icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-[10px] font-bold tracking-tight truncate">{social.label}</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: CTA Cards */}
                        <div className="md:col-span-3">
                            <motion.a 
                                href={settings.whatsapp_link || `https://wa.me/${(settings.whatsapp_number || '6281222429289').replace(/\s+/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="group p-12 bg-dagang-dark text-white rounded-[40px] shadow-2xl flex items-center justify-between transition-transform hover:scale-[1.01] overflow-hidden relative min-h-[300px]"
                            >
                                <div className="absolute top-0 right-0 w-48 h-48 bg-dagang-green/10 rounded-full blur-3xl -mr-24 -mt-24" />
                                <div className="space-y-4 relative z-10">
                                    <h3 className="text-4xl font-serif italic">{t('contactPage.cta.title')}</h3>
                                    <p className="text-white/60 text-lg max-w-sm">{t('contactPage.cta.desc')}</p>
                                </div>
                                <div className="w-20 h-20 bg-dagang-green text-white rounded-[24px] flex items-center justify-center group-hover:scale-110 transition-transform relative z-10 shadow-lg shadow-dagang-green/20">
                                    <MessageCircle className="w-10 h-10" />
                                </div>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </main>

            <PublicFooter />
        </div>
    );
};
