import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/apiClient';
import { useLocation } from 'wouter';
import { useQuran } from '../../contexts/QuranContext';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Activity, Book, Database, Layers, FileText, BarChart3, Fingerprint, Sparkles, Anchor, AlertCircle } from 'lucide-react';
import { NetworkError as NetworkErrorPage } from '@/components/errors/NetworkError';
import { ServerError as ServerErrorPage } from '@/components/errors/ServerError';
import { ErrorLayout } from '@/components/errors/ErrorLayout';
import { AppError, NetworkError } from '../../lib/errors';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

interface GlobalStats {
    totalAyahs: number;
    totalSurahs: number;
    totalRoots: number;
    totalWords: number;
    rootsPerSurah: { surah_no: number; distinct_roots: number }[];
    uniqueToSurah: { surah_no: number; unique_roots_count: number }[];
    rootLength: { len: number; count: number }[];
    hapaxRoots: { root: string; count: number }[];
    topRoots: { root: string; count: number }[];
    lexicalDensity: { surah_no: number; density: number; distinct_roots: number }[];
}

export const ProjectAnalytics: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<AppError | null>(null);

    // Navigation Hooks
    const [, setLocation] = useLocation();
    const { searchByRoot } = useQuran();

    const goToSurah = (surahNo: number) => {
        setLocation(`/surah/${surahNo}`);
        if (onNavigate) onNavigate();
    };

    const handleRootClick = (root: string) => {
        setLocation(`/details/${root}/root/search`);
        if (onNavigate) onNavigate();
    };

    const handleMorphologyClick = (len: number) => {
        setLocation(`/morphology/${len}`);
        if (onNavigate) onNavigate();
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // apiClient base URL already includes '/api'
                const result = await apiClient.get<{ success: boolean; data: GlobalStats }>('statistics/global');
                if (result.success) {
                    setStats(result.data);
                } else {
                    throw new AppError('Failed to load data');
                }
            } catch (err) {
                console.error(err);
                if (err instanceof AppError) {
                    setError(err);
                } else {
                    setError(new AppError('Could not connect to server'));
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            <ErrorLayout
                title="خطأ في البيانات"
                description={error.message}
                icon={<AlertCircle className="w-10 h-10 text-destructive" />}
                action="retry"
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (!stats) return null;

    const kpis = [
        { label: 'إجمالي الجذور', value: stats.totalRoots, icon: Database, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'الكلمات المحللة', value: stats.totalWords, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'عدد الآيات', value: stats.totalAyahs, icon: Layers, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'سور القرآن', value: stats.totalSurahs, icon: Book, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
            <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 rounded-2xl border border-primary/5">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    تحليلات المشروع الشاملة
                </h2>
                <p className="text-muted-foreground">استكشاف معمق لبنية البيانات، الجذور الفريدة، والكثافة المعجمية</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="border-primary/10 bg-card/50 backdrop-blur hover:bg-card transition-colors">
                            <CardContent className="p-6">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${kpi.bg} ${kpi.color}`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <div className="text-3xl font-bold mb-1 font-mono tracking-tighter">{kpi.value.toLocaleString('en-US')}</div>
                                <div className="text-sm text-muted-foreground font-medium">{kpi.label}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Unique DNA (Unique Roots per Surah) */}
                <Card className="border-primary/10 h-full overflow-hidden relative">
                    <div className="absolute top-0 end-0 p-3 opacity-10 pointer-events-none">
                        <Fingerprint className="w-24 h-24 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Fingerprint className="w-5 h-5 text-primary" />
                            بصمات السور (الجذور المتفردة)
                        </CardTitle>
                        <CardDescription>
                            السور التي تحتوي على أكبر عدد من الجذور الحصرية - <strong>اضغط للانتقال</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 relative z-10">
                            {stats.uniqueToSurah?.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors group"
                                    onClick={() => goToSurah(item.surah_no)}
                                    title="اضغط لعرض تفاصيل السورة"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs font-mono group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{i + 1}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium group-hover:text-primary transition-colors">سورة رقم {item.surah_no}</span>
                                            <span className="text-xs font-bold bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{item.unique_roots_count} جذر</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary/20 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary/70 rounded-full group-hover:bg-primary transition-colors"
                                                style={{ width: `${(item.unique_roots_count / (stats.uniqueToSurah?.[0]?.unique_roots_count || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Top Roots (The Pillars) */}
                <Card className="border-primary/10 h-full overflow-hidden relative">
                    <div className="absolute top-0 end-0 p-3 opacity-10 pointer-events-none">
                        <Anchor className="w-24 h-24 text-blue-500" />
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Anchor className="w-5 h-5 text-blue-500" />
                            ركائز القرآن (الجذور الأكثر تكراراً)
                        </CardTitle>
                        <CardDescription>
                            الجذور القصوى التي تشكل البنية الأساسية للنص - <strong>اضغط للانتقال</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 relative z-10">
                            {stats.topRoots?.filter(item => item.root.replace(/[\u064B-\u065F\u0670]/g, "").length >= 3).map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between text-sm group cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors border border-transparent hover:border-border"
                                    onClick={() => handleRootClick(item.root)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] text-muted-foreground font-mono">{i + 1}</div>
                                        <span className="font-bold text-lg text-primary">{item.root}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-24 bg-muted overflow-hidden rounded-full hidden sm:block">
                                            <div className="h-full bg-blue-500" style={{ width: `${(item.count / (stats.topRoots?.[0]?.count || 1)) * 100}%` }}></div>
                                        </div>
                                        <span className="font-mono text-sm font-bold bg-muted px-2 rounded min-w-[3rem] text-center">{item.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Hapax Legomena (The Pearls) */}
                <Card className="border-primary/10 h-full md:col-span-2 bg-gradient-to-b from-amber-500/5 to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Sparkles className="w-5 h-5 text-amber-500" />
                            الدرر الفريدة (Hapax Legomena)
                        </CardTitle>
                        <CardDescription>
                            عينة من الجذور التي وردت <strong>مرة واحدة فقط</strong> في كامل القرآن الكريم (إجمالي العينات المعروضة: 50)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-amber-500/20 scrollbar-track-transparent">
                            {stats.hapaxRoots?.map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: i * 0.005 }}
                                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-bold border border-amber-500/20 cursor-pointer transition-all hover:scale-105 hover:shadow-sm"
                                    title="اضغط لعرض التفاصيل"
                                    onClick={() => handleRootClick(item.root)}
                                >
                                    {item.root}
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Lexical Density */}
                <Card className="border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <BarChart3 className="w-5 h-5 text-green-500" />
                            الكثافة المعجمية (ثراء المفردات)
                        </CardTitle>
                        <CardDescription>
                            أعلى السور تنوعاً في المفردات - <strong>اضغط للانتقال</strong>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.lexicalDensity?.map((item, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors group"
                                    onClick={() => goToSurah(item.surah_no)}
                                    title="اضغط لعرض تفاصيل السورة"
                                >
                                    <div className="w-8 font-bold text-muted-foreground text-xs group-hover:text-primary transition-colors">#{item.surah_no}</div>
                                    <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute top-0 start-0 h-full bg-green-500/70"
                                            style={{ width: `${item.density * 100}%` }}
                                        />
                                    </div>
                                    <div className="w-12 text-end font-mono text-xs text-green-600 dark:text-green-400 font-bold">{(item.density * 100).toFixed(1)}%</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Structure Analysis */}
                <Card className="border-primary/10 h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Layers className="w-5 h-5 text-primary" />
                            علم الصرف (طول الجذور)
                        </CardTitle>
                        <CardDescription>
                            توزيع الجذور حسب عدد الأحرف (ثلاثي، رباعي، خماسي)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center p-8">
                        <div className="flex items-end gap-8 h-[180px] w-full justify-center">
                            {stats.rootLength?.map((item, i) => (
                                <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer w-1/4" onClick={() => handleMorphologyClick(item.len)}>
                                    <div className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 text-primary">{item.count}</div>
                                    <div
                                        className="w-full max-w-[60px] bg-gradient-to-t from-primary/10 to-primary/50 border-t-2 border-primary/50 rounded-t-lg transition-all duration-500 group-hover:to-primary/70 relative hover:scale-105"
                                        style={{ height: `${(item.count / stats.totalRoots) * 100 * 1.5}px`, minHeight: '20px' }}
                                    >
                                        <div className="absolute bottom-0 w-full h-[1px] bg-primary/20"></div>
                                    </div>
                                    <div className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full">{item.len} أحرف</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-8 border-t border-dashed border-border/50">
                <p>بيانات حية من قاعدة بيانات الجذور القرآنية v2.0</p>
            </div>
            <ScrollToTop />
        </div>
    );
};
