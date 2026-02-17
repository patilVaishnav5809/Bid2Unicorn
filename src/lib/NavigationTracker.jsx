import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { base44 } from '@/api/base44Client';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const pagesConfigRef = useRef(null);

    // Load config once
    useEffect(() => {
        import('@/pages.config').then(module => {
            pagesConfigRef.current = module.pagesConfig;
            console.log('NavigationTracker: Config loaded dynamically');
        }).catch(err => {
            console.error('NavigationTracker: Failed to load pagesConfig', err);
        });
    }, []);

    // Log user activity when navigating to a page
    useEffect(() => {
        if (!pagesConfigRef.current) return;

        const { Pages, mainPage } = pagesConfigRef.current;
        const mainPageKey = mainPage ?? (Pages ? Object.keys(Pages)[0] : null);

        // Extract page name from pathname
        const pathname = location.pathname;
        let pageName;

        if (pathname === '/' || pathname === '') {
            pageName = mainPageKey;
        } else {
            // Remove leading slash and get the first segment
            const pathSegment = pathname.replace(/^\//, '').split('/')[0];

            // Try case-insensitive lookup in Pages config
            if (Pages) {
                const pageKeys = Object.keys(Pages);
                const matchedKey = pageKeys.find(
                    key => key.toLowerCase() === pathSegment.toLowerCase()
                );
                pageName = matchedKey || null;
            }
        }

        if (isAuthenticated && pageName) {
            console.log('NavigationTracker: Attempting to log', pageName);
            if (base44 && base44.appLogs) {
                base44.appLogs.logUserInApp(pageName).catch((err) => {
                    console.warn('NavigationTracker: Log failed', err);
                });
            } else {
                console.warn('NavigationTracker: base44 or appLogs missing', base44);
            }
        }
    }, [location.pathname, isAuthenticated, pagesConfigRef.current]); 

    return null;
}