import React, { useMemo, useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useQuran } from '../contexts/QuranContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LayoutDashboard, Search, FileText, Component, Hash } from 'lucide-react';
import { AyahList } from '../components/AyahList';
import { Card, CardContent } from '../components/ui/card';
import { QuranLoader } from '../components/ui/QuranLoader';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ScrollToTop } from '../components/ui/ScrollToTop';

// Helper to remove Tashkeel
const removeTashkeel = (text: string) => {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
};

const DetailView: React.FC = () => {
    const [match, params] = useRoute('/details/:root/:type/:value');
    const { searchResults, statistics, searchByRoot, loading } = useQuran();
    const [_, setLocation] = useLocation();

    // Local State for Interactivity
    const [searchQuery, setSearchQuery] = useState('');
    const [displayLimit, setDisplayLimit] = useState(10);
    const [sortBy, setSortBy] = useState<'default' | 'length_asc' | 'length_desc'>('default');

    // Get focus ID from URL search params
    const searchParams = new URLSearchParams(window.location.search);
    const focusAyahIdProp = searchParams.get('focus');
    const focusAyahId = focusAyahIdProp ? parseInt(focusAyahIdProp) : undefined;

    // Safe derivation of params
    const { root, type, value } = params || {};
    const decodedValue = value ? decodeURIComponent(value) : '';
    const decodedRoot = root ? decodeURIComponent(root) : '';

    // Fetch data if missing or root mismatch
    React.useEffect(() => {
        if (decodedRoot) {
            if (!searchResults || searchResults.root !== decodedRoot) {
                searchByRoot(decodedRoot);
            }
        } else {
            // If no root in URL, go back
            setLocation('/');
        }
    }, [decodedRoot, searchResults, searchByRoot, setLocation]);

    // Navigate to other roots when clicked inside cards
    const handleRootClick = (rootToNav: string) => {
        setLocation(`/details/${rootToNav}/root/search`);
    };

    // 1. Base Filtering Logic (Drill-down)
    const { baseList, title, description } = useMemo(() => {
        // Safe defaults if data is missing
        if (!searchResults || !params) {
            return { baseList: [], title: "", description: "" };
        }

        let ayahs = searchResults.ayahs || [];
        let pageTitle = "";
        let pageDesc = "";

        switch (type) {
            case 'surah':
                ayahs = ayahs.filter(a => a.surahName === decodedValue);
                pageTitle = `الآيات في سورة ${decodedValue}`;
                pageDesc = `عرض المواضع التي ورد فيها الجذر "${decodedRoot}" في سورة ${decodedValue}`;
                break;

            case 'era':
                // Note: Simplified logic
                pageTitle = `الآيات ${decodedValue === 'meccan' ? 'المكية' : 'المدنية'}`;
                pageDesc = `عرض الآيات حسب تصنيف العهد`;
                break;

            case 'juz':
                const juzNum = parseInt(decodedValue.replace(/\D/g, ''));
                if (!isNaN(juzNum)) {
                    ayahs = ayahs.filter(a => a.juz === juzNum);
                }
                pageTitle = `الآيات في الجزء ${decodedValue}`;
                pageDesc = `عرض المواضع في الجزء ${decodedValue}`;
                break;

            case 'page':
                const pageNum = parseInt(decodedValue.replace(/\D/g, ''));
                if (!isNaN(pageNum)) {
                    ayahs = ayahs.filter(a => a.page === pageNum);
                }
                pageTitle = `الآيات في الصفحة ${decodedValue}`;
                pageDesc = `عرض المواضع في الصفحة ${decodedValue}`;
                break;

            case 'form':
                ayahs = ayahs.filter(a =>
                    a.tokens.some((t: any) => (t.token_plain_norm || t.token) === decodedValue)
                );
                pageTitle = `صيغة "${decodedValue}"`;
                pageDesc = `الآيات التي وردت فيها الصيغة اللفظية "${decodedValue}"`;
                break;

            case 'compare':
                ayahs = ayahs.filter(a => a.otherRoots.includes(decodedValue));
                pageTitle = `اقتران "${decodedRoot}" مع "${decodedValue}"`;
                pageDesc = `الآيات التي جمعت بين الجذرين في سياق واحد`;
                break;

            default:
                break;
        }

        return { baseList: ayahs, title: pageTitle, description: pageDesc };
    }, [searchResults, params, type, decodedValue, decodedRoot]);

    // 2. Second Layer Filtering (Search) - INSENSITIVE
    const filteredList = useMemo(() => {
        let list = baseList || [];

        // Search Filter
        if (searchQuery.trim()) {
            const normalizedQuery = removeTashkeel(searchQuery.trim());
            list = list.filter(a => {
                const normalizedText = removeTashkeel(a.text);
                return normalizedText.includes(normalizedQuery);
            });
        }

        // Sorting Logic
        if (sortBy === 'length_asc') {
            list = [...list].sort((a, b) => a.text.length - b.text.length);
        } else if (sortBy === 'length_desc') {
            list = [...list].sort((a, b) => b.text.length - a.text.length);
        } else {
            // Default (Quranic Order or Pinning)
            // If focusAyahId exists, move it to top
            if (focusAyahId) {
                list = [...list].sort((a, b) => {
                    const idA = parseInt(a.id);
                    const idB = parseInt(b.id);
                    if (idA === focusAyahId) return -1;
                    if (idB === focusAyahId) return 1;
                    return idA - idB; // Default order otherwise
                });
            }
        }

        return list;
    }, [baseList, searchQuery, sortBy, focusAyahId]);

    // 3. Pagination Slicing
    const paginatedList = filteredList.slice(0, displayLimit);


    // 4. Scoped Statistics Calculation
    const scopedStats = useMemo(() => {
        if (!filteredList) return [];
        const uniqueSurahs = new Set(filteredList.map(a => a.surahName)).size;
        const totalAyahs = filteredList.length;
        const avgLength = totalAyahs > 0
            ? Math.round(filteredList.reduce((acc, curr) => acc + curr.text.length, 0) / totalAyahs)
            : 0;

        return [
            { label: 'عدد الآيات', value: totalAyahs, icon: Hash, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'السور', value: uniqueSurahs, icon: Component, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'متوسط الطول', value: `${avgLength} حرف`, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ];
    }, [filteredList]);


    if (loading || (decodedRoot && (!searchResults || searchResults.root !== decodedRoot))) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <QuranLoader message={`جاري استحضار تفاصيل الجذر "${decodedRoot}"...`} />
            </div>
        );
    }

    if (!searchResults || !statistics || !match || !params) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background selection:bg-primary/20 pb-20 font-sans">

            {/* Navigation Header (Breadcrumbs) */}
            <header className="sticky top-16 z-30 w-full backdrop-blur-xl bg-background/80 border-b border-border shadow-sm">
                <div className="container flex h-14 items-center">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                                    <Link href="/">
                                        <Search className="w-3.5 h-3.5" />
                                        <span>الرئيسية</span>
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="rtl:rotate-180" />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer">
                                    <Link href="/dashboard">
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span>لوحة التحكم</span>
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="rtl:rotate-180" />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-bold text-primary flex items-center gap-1">
                                    <Hash className="w-3.5 h-3.5" />
                                    <span>{decodedRoot}</span>
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </header>

            <main className="container pt-12 animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-6xl mx-auto">
                <div className="mb-8 text-center md:text-start">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{title}</h1>
                    <p className="text-muted-foreground">{description}</p>
                </div>

                {/* Scoped Stats Grid */}
                <div className="grid grid-cols-3 gap-3 md:gap-6 mb-8">
                    {scopedStats.map((stat, i) => (
                        <Card key={i} className="bg-card/40 backdrop-blur border-border/50">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <div className={`p-2 rounded-full mb-2 ${stat.bg} ${stat.color}`}>
                                    <stat.icon className="w-5 h-5" />
                                </div>
                                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                                <div className="text-xs text-muted-foreground">{stat.label}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Toolbar: Search & Actions */}
                <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-primary/10 mb-8 flex flex-col md:flex-row gap-4 justify-between items-center shadow-lg">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث في نص الآيات (بدون تشكيل)..."
                            className="pe-9 bg-secondary/5 border-primary/10 focus-visible:ring-primary/20"
                        />
                    </div>

                    {/* Controls Group */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <select
                            className="h-10 px-3 py-2 bg-secondary/5 border border-primary/10 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-auto"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                        >
                            <option value="default">الترتيب الافتراضي</option>
                            <option value="length_asc">الأقصر أولاً</option>
                            <option value="length_desc">الأطول أولاً</option>
                        </select>

                        <div className="text-sm text-muted-foreground whitespace-nowrap hidden md:block">
                            <span className="font-bold text-foreground">{paginatedList.length}</span> / <span className="font-bold text-foreground">{filteredList.length}</span>
                        </div>
                    </div>
                </div>

                {/* List Content */}
                <AyahList
                    ayahs={paginatedList}
                    highlightQuery={searchQuery || (type === 'form' ? decodedValue : undefined)}
                    focusAyahId={focusAyahId}
                    onRootClick={handleRootClick}
                />

                {/* Pagination Controls */}
                {filteredList.length > displayLimit && (
                    <div className="mt-8 flex justify-center gap-4">
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => setDisplayLimit(prev => prev + 10)}
                            className="min-w-[140px]"
                        >
                            عرض المزيد (+10)
                        </Button>
                        <Button
                            variant="secondary"
                            size="lg"
                            onClick={() => setDisplayLimit(filteredList.length)}
                        >
                            عرض الكل
                        </Button>
                    </div>
                )}

                {/* Show Less Control */}
                {displayLimit > 10 && displayLimit >= filteredList.length && filteredList.length > 10 && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDisplayLimit(10)}
                            className="text-muted-foreground"
                        >
                            طي القائمة
                        </Button>
                    </div>
                )}

            </main>

            <ScrollToTop />
        </div>
    );
};

export default DetailView;