import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiClient } from '../lib/apiClient';
import { useRoute, useLocation } from 'wouter';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Layers, ArrowRight, Search, Database, Component, ArrowUpRight, Sparkles, Activity, AlertCircle } from 'lucide-react';
import { useQuran } from '../contexts/QuranContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { QuranLoader } from '../components/ui/QuranLoader';
import { NetworkError as NetworkErrorPage } from '@/components/errors/NetworkError';
import { ServerError as ServerErrorPage } from '@/components/errors/ServerError';
import { ErrorLayout } from '@/components/errors/ErrorLayout';
import { AppError, NetworkError } from '../lib/errors';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

interface RootItem {
    root: string;
    count: number;
}

interface LengthStats {
    roots: RootItem[];
    summary: {
        total_occurrences: number;
        total_roots: number;
    }
}

const BATCH_SIZE = 48; // Items to load per batch

const RootLengthExplorer: React.FC = () => {
    const [match, params] = useRoute('/morphology/:length');
    const [location, setLocation] = useLocation();
    const { searchByRoot } = useQuran();

    const [data, setData] = useState<LengthStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AppError | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

    // Scroll State
    const { scrollY } = useScroll();
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        return scrollY.on("change", (latest) => {
            setShowScrollTop(latest > 300);
        });
    }, [scrollY]);

    const length = params?.length ? parseInt(params.length) : 0;

    // Fetch Data
    useEffect(() => {
        if (!length) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const result = await apiClient.get<{ success: boolean; data: LengthStats }>(`statistics/roots-by-length/${length}`);
                if (result.success) {
                    setData(result.data);
                } else {
                    throw new AppError('Unknown error');
                }
            } catch (err) {
                console.error(err);
                if (err instanceof AppError) {
                    setError(err);
                } else {
                    setError(new AppError('Failed to load roots data'));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [length]);

    const handleRootClick = (root: string) => {
        setLocation(`/details/${encodeURIComponent(root)}/root/search`);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filter Roots
    const filteredRoots = useMemo(() => {
        if (!data) return [];
        if (!searchQuery) return data.roots;
        return data.roots.filter(r => r.root.includes(searchQuery));
    }, [data, searchQuery]);

    // Visible Roots (Batching)
    const visibleRoots = useMemo(() => {
        return filteredRoots.slice(0, visibleCount);
    }, [filteredRoots, visibleCount]);

    // Infinite Scroll Trigger
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
                visibleCount < filteredRoots.length
            ) {
                setVisibleCount(prev => Math.min(prev + BATCH_SIZE, filteredRoots.length));
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [visibleCount, filteredRoots.length]);

    // Reset visible count on search/length change
    useEffect(() => {
        setVisibleCount(BATCH_SIZE);
    }, [searchQuery, length]);

    const getLengthName = (len: number) => {
        if (len === 3) return "الثلاثية";
        if (len === 4) return "الرباعية";
        if (len === 5) return "الخماسية";
        if (len === 6) return "السداسية";
        return `${len} أحرف`;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <QuranLoader message="جاري تحليل البيانات..." />
            </div>
        );
    }

    if (error) {
        if (error.name === 'NetworkError') {
            return <NetworkErrorPage onRetry={() => window.location.reload()} />;
        }
        if (error.name === 'ServerError') {
            return <ServerErrorPage error={error} onRetry={() => window.location.reload()} />;
        }
        return (
            <div className="min-h-screen">
                <ErrorLayout
                    title="خطأ في جلب البيانات"
                    description={error.message}
                    icon={<AlertCircle className="w-10 h-10 text-destructive" />}
                    action="retry"
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-20 font-sans">

            {/* Header Background */}
            <div className="fixed top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-primary/5 via-background to-background -z-10 pointer-events-none" />

            {/* Main Header */}
            <div className="container relative z-10 pt-12 pb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center mb-8"
                >
                    <Button
                        variant="ghost"
                        className="hover:bg-primary/5 text-muted-foreground hover:text-primary transition-colors gap-2"
                        onClick={() => setLocation('/dashboard')}
                    >
                        <ArrowRight className="w-4 h-4" />
                        عودة للوحة التحكم
                    </Button>
                </motion.div>

                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1">
                                علم الصرف
                            </Badge>
                            <Badge variant="secondary" className="px-3 py-1">
                                {length} أحرف
                            </Badge>
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold font-quran text-foreground mb-4 drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-l from-primary to-primary/70">
                            الجذور {getLengthName(length)}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-2xl font-amiri leading-relaxed">
                            استكشاف {data.summary.total_roots.toLocaleString()} جذراً فريداً في القرآن الكريم مصنفة حسب بنائها الصرفي.
                        </p>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="flex gap-4">
                        {[
                            { icon: Component, label: "جذر فريد", value: data.summary.total_roots, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                            { icon: Database, label: "موضع", value: data.summary.total_occurrences, color: "text-blue-500", bg: "bg-blue-500/10" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                            >
                                <Card className="bg-card/50 backdrop-blur border-border hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-6 flex flex-col items-center min-w-[140px]">
                                        <div className={`p-3 rounded-full mb-3 ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-6 h-6" />
                                        </div>
                                        <span className="text-3xl font-bold font-mono">{stat.value.toLocaleString()}</span>
                                        <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Grid Content */}
            <div className="container min-h-[500px]">
                {/* Search Bar & Navigation - Sticky */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="sticky top-4 z-30 shadow-2xl shadow-primary/5 rounded-2xl mb-8"
                >
                    <div className="bg-card/80 backdrop-blur-xl p-2 rounded-2xl border border-border flex items-center gap-2 pr-4 pl-2 transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        {/* Sticky Back Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation('/dashboard')}
                            className="text-muted-foreground hover:text-primary hover:bg-primary/5 shrink-0 gap-2"
                            title="عودة للوحة التحكم"
                        >
                            <ArrowRight className="w-5 h-5" />
                            <span className="hidden md:inline font-bold">عودة</span>
                        </Button>

                        <div className="h-8 w-px bg-border/50 mx-1" />

                        <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                        <Input
                            placeholder={`ابحث في الجذور ${getLengthName(length)}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="border-none bg-transparent focus-visible:ring-0 text-lg font-quran h-12 flex-1 min-w-0"
                        />
                        <div className="pl-4 text-sm font-bold text-muted-foreground border-r border-border/50 pr-4 shrink-0 hidden sm:block">
                            {filteredRoots.length} نتيجة
                        </div>
                    </div>
                </motion.div>
                {visibleRoots.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                        {visibleRoots.map((item, index) => (
                            <motion.div
                                key={item.root}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true, margin: "50px" }}
                                transition={{ duration: 0.3 }}
                                onClick={() => handleRootClick(item.root)}
                                className="group cursor-pointer"
                            >
                                <div className="h-full bg-card hover:bg-primary/5 border border-border hover:border-primary/30 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
                                    <div className="absolute top-0 start-0 w-full h-1 bg-gradient-to-l from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <h3 className="text-3xl font-bold font-quran text-foreground group-hover:text-primary transition-colors">
                                        {item.root}
                                    </h3>

                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full group-hover:bg-white group-hover:text-primary group-hover:shadow-sm transition-all">
                                        <Layers className="w-3 h-3" />
                                        <span>{item.count}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center py-20 text-muted-foreground"
                    >
                        <Search className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-xl">لا توجد جذور تطابق بحثك</p>
                    </motion.div>
                )}

                {/* Loading Indicator for Infinite Scroll */}
                {visibleCount < filteredRoots.length && (
                    <div className="py-12 flex justify-center">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Scroll To Top FAB */}
            <ScrollToTop />
        </div>
    );
};

export default RootLengthExplorer;
