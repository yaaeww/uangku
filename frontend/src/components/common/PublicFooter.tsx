import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';

export const PublicFooter = () => {
    const { t } = useTranslation();
    return (
        <footer className="bg-dagang-dark text-white pt-20 pb-10 px-6 md:px-[60px]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="space-y-6">
                        <Link to="/" className="inline-block hover:opacity-80 transition-opacity mb-6">
                            <Logo variant="horizontal" forceTheme="dark" />
                        </Link>
                        <p className="text-white/50 text-sm leading-relaxed max-w-xs font-serif">
                            {t('footer.description')}
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">{t('footer.featuresTitle')}</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><a href="/#features" className="hover:text-white transition-colors">{t('footer.features.record')}</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">{t('footer.features.budgeting')}</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">{t('footer.features.reports')}</a></li>
                            <li><a href="/#features" className="hover:text-white transition-colors">{t('footer.features.multiUser')}</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">{t('footer.resourcesTitle')}</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><Link to="/blog" className="hover:text-white transition-colors">{t('footer.resources.blog')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-dagang-accent mb-6">{t('footer.companyTitle')}</h4>
                        <ul className="space-y-4 text-sm text-white/40 font-serif">
                            <li><Link to="/about" className="hover:text-white transition-colors">{t('footer.company.about')}</Link></li>
                            <li><Link to="/privacy" className="hover:text-white transition-colors">{t('footer.company.privacy')}</Link></li>
                            <li><Link to="/terms" className="hover:text-white transition-colors">{t('footer.company.terms')}</Link></li>
                            <li><Link to="/contact" className="hover:text-white transition-colors">{t('footer.company.contact')}</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-10 border-t border-white/5 text-center text-[11px] text-white/20 font-serif tracking-widest uppercase">
                    {t('footer.copyright')}
                </div>
            </div>
        </footer>
    );
};
