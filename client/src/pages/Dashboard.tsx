import React, { useMemo } from 'react';
import { useQuran } from '../contexts/QuranContext';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowRight, Printer, TrendingUp, BookOpen, Layers, Activity, Fingerprint, Star, Share2, Clock, MapPin, ListFilter } from 'lucide-react';
import { motion } from 'framer-motion';
import { RevelationTimeline, EraDistribution, NetworkGraph, WordFormsList, RelationshipMatrix } from '../components/charts/DashboardCharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ScrollToTop } from '../components/ui/ScrollToTop';
import { PageContainer } from '../components/ui/PageContainer'; // استيراد المكون الموحد

// --- Custom Local Components (Preserved for specific dashboard needs) ---

const SurahHeatmap = ({ surahData, onClick }: { surahData: { [key: string]: number }, onClick?: (surah: string) => void }) => {
    const entries = Object.entries(surahData);
    const max = Math.max(...Object.values(surahData), 1);

    return (
        <div className="w-full">
            <div className="flex flex-wrap gap-1 justify-center p-4 bg-secondary/5 rounded-xl border border-primary/5">
                {entries.map(([name, count], i) => (
                    <motion.div
                        key={i}
                        onClick={() => onClick && onClick(name)}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="group relative flex-col items-center justify-center cursor-pointer"
                    >
                        {/* Heatmap Cell */}
                        <div
                            className={`w-2 h-8 md:w-3 md:h-12 rounded-sm transition-all duration-300 hover:scale-125 hover:z-10 ${count > 0 ? 'bg-primary shadow-[0_0_5px_theme(colors.primary.DEFAULT)]' : 'bg-muted/20'
                                }`}
                            style={{
                                opacity: Math.max(0.1, count / max),
                            }}
                        />

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-popover text-popover-foreground text-xs p-2 rounded shadow-xl whitespace-nowrap z-50 pointer-events-none">
                            <div className="font-bold text-primary">سورة {name}</div>
                            <div>{count} موضع</div>
                        </div>
                    </motion.div>
                ))}
                {entries.length === 0 && <div className="text-muted-foreground text-sm">لا توجد بيانات كافية للرسم الحراري</div>}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-2">
                <span>توزيع الكثافة عبر السور (اللون الأغمق = تكرار أكثر)</span>
                <span>{entries.length} سورة فيها هذا الجذر</span>
            </div>
        </div>
    );
};

const CustomBarChart = ({ data, onClick }: { data: { label: string, value: number }[], onClick?: (label: string) => void }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-3">
            {data.map((d, i) => (
                <div key={i} className="group flex items-center gap-3 text-sm cursor-pointer hover:bg-secondary/10 p-1 rounded-md transition-colors" onClick={() => onClick && onClick(d.label)}>
                    <div className="w-24 text-muted-foreground truncate font-medium text-xs md:text-sm group-hover:text-primary">{d.label}</div>
                    <div className="flex-1 h-2 bg-secondary/30 rounded-full overflow-hidden relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(d.value / max) * 100}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="h-full bg-gradient-to-l from-primary to-primary/60 rounded-full"
                        />
                    </div>
                    <div className="w-8 text-end font-bold text-primary text-xs">{d.value}</div>
                </div>
            ))}
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { statistics, searchResults } = useQuran();
    const [_, setLocation] = useLocation();
    const [timelineSort, setTimelineSort] = React.useState<'quran' | 'revelation'>('quran');

    // Redirect logic handled via effect, but PageContainer handles display
    React.useEffect(() => {
        if (!searchResults || !statistics) {
            setLocation('/');
        }
    }, [searchResults, statistics, setLocation]);

    // --- Derived Data ---
    const topSurahs = useMemo(() => {
        if (!statistics) return [];
        return Object.entries(statistics.surahDistribution)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 8)
            .map(([name, count]) => ({ label: `سورة ${name}`, value: count }));
    }, [statistics]);

    // Deep Insights Calculation
    const { longestAyah, shortestAyah, centerOfGravityData } = useMemo(() => {
        if (!searchResults) return { longestAyah: null, shortestAyah: null, centerOfGravityData: { maxFrequency: 0, candidates: [] } };

        const sorted = [...searchResults.ayahs].sort((a, b) => a.text.length - b.text.length);

        // Find Max Frequency
        let maxFreq = 0;
        searchResults.ayahs.forEach(a => {
            const count = Number(a.rootCount) || 0;
            if (count > maxFreq) maxFreq = count;
        });

        // Find all candidates with max frequency
        const candidates = searchResults.ayahs.filter(a => (Number(a.rootCount) || 0) === maxFreq);

        return {
            shortestAyah: sorted[0],
            longestAyah: sorted[sorted.length - 1],
            centerOfGravityData: {
                maxFrequency: maxFreq,
                candidates: candidates
            }
        };
    }, [searchResults]);

    const [cgIndex, setCgIndex] = React.useState(0);

    // Reset index when root changes
    React.useEffect(() => {
        setCgIndex(0);
    }, [searchResults?.root]);

    const currentCgAyah = centerOfGravityData.candidates[cgIndex];
    const isUniform = centerOfGravityData.maxFrequency <= 1;

    // --- Navigation Handlers ---
    const handleNavigation = (type: string, value: string, focusAyahId?: number) => {
        if (!searchResults) return;
        const encodedType = encodeURIComponent(type);
        const encodedValue = encodeURIComponent(value);
        const encodedRoot = encodeURIComponent(searchResults.root);

        let path = `/details/${encodedRoot}/${encodedType}/${encodedValue}`;
        if (focusAyahId !== undefined) {
            path += `?focus=${focusAyahId}`;
        }
        setLocation(path);
    };

    return (
        <PageContainer
            isLoading={!searchResults || !statistics}
            loadingMessage="جاري تحليل البيانات القرآنية..."
            contain={false} // Disable default container to handle sticky header correctly
            className="p-0 pt-0 pb-0" // Reset paddings for full control
        >
            {/* Navigation Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/50 border-b border-white/5">
                <div className="container flex h-16 items-center justify-between">
                    <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary" onClick={() => setLocation('/')}>
                        <ArrowRight className="w-4 h-4" />
                        <span>العودة للبحث</span>
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.print()} title="طباعة" aria-label="طباعة السجلات">
                            <Printer className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container pt-8 animate-in fade-in duration-700 space-y-12 pb-20">

                {/* HERO SECTION */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-primary/5 p-8 md:p-12 text-center shadow-2xl shadow-primary/5">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,theme(colors.primary.DEFAULT)_0%,transparent_40%)] opacity-5 blur-3xl" />

                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur rounded-full border border-primary/10 text-xs font-medium text-muted-foreground mb-4">
                            <Activity className="w-3 h-3 text-primary" />
                            تحليل شامل للجذر
                        </div>
                        <h1 className="text-6xl md:text-8xl font-bold text-primary font-serif mb-4 drop-shadow-sm tracking-tighter">
                            {searchResults!.root}
                        </h1>
                        <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                            استكشاف الرحلة القرآنية لهذا الجذر عبر {statistics!.totalOccurrences} موضعاً في {statistics!.uniqueSurahs} سورة
                        </p>
                    </motion.div>
                </section>

                {/* SECTION 1: Crystal KPI Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {[
                        { label: "إجمالي المواضع", value: statistics!.totalOccurrences, icon: Layers, bg: "bg-blue-500/5", text: "text-blue-500" },
                        { label: "عدد الآيات", value: statistics!.totalAyahs, icon: BookOpen, bg: "bg-emerald-500/5", text: "text-emerald-500" },
                        { label: "عدد السور", value: statistics!.uniqueSurahs, icon: Fingerprint, bg: "bg-amber-500/5", text: "text-amber-500" },
                        { label: "المتوسط / آية", value: statistics!.averageOccurrencesPerAyah, icon: TrendingUp, bg: "bg-purple-500/5", text: "text-purple-500" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="group relative overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 p-6 rounded-2xl hover:bg-card hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className={`absolute top-0 end-0 p-3 rounded-bs-2xl ${stat.bg} ${stat.text} opacity-20 group-hover:opacity-100 transition-opacity`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div className="mt-2">
                                <div className="text-4xl font-bold text-foreground mb-1 group-hover:scale-105 transition-transform origin-right">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* VISUALIZATION: Center of Gravity (New Premium Feature) */}
                {currentCgAyah && centerOfGravityData.maxFrequency > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-background to-background p-6 md:p-8 shadow-[0_0_30px_-10px_rgba(245,158,11,0.2)] mb-8"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>

                        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start relative z-10">
                            <div className="flex-shrink-0 p-4 rounded-full bg-amber-500/10 text-amber-500 shadow-inner ring-1 ring-amber-500/20">
                                <Activity className="w-8 h-8 md:w-10 md:h-10" />
                            </div>

                            <div className="flex-1 text-center md:text-right space-y-4 w-full">
                                <div>
                                    <div className="text-amber-500 font-bold text-sm tracking-wider uppercase mb-1 flex items-center justify-center md:justify-start gap-2">
                                        <Star className="w-4 h-4 fill-amber-500" />
                                        مركز ثقل الجذر
                                        {centerOfGravityData.candidates.length > 1 && (
                                            <span className="text-xs bg-amber-500/20 px-2 py-0.5 rounded-full text-amber-600">
                                                {cgIndex + 1} من {centerOfGravityData.candidates.length}
                                            </span>
                                        )}
                                    </div>

                                    {isUniform && (
                                        <div className="text-muted-foreground text-sm italic mb-2 border-r-2 border-amber-500/50 pr-3 mr-1 bg-amber-500/5 p-2 rounded">
                                            ملاحظة: يتوزع هذا الجذر بشكل متساوٍ (أو نادر) في القرآن. نعرض هنا أول موضع كنموذج.
                                        </div>
                                    )}

                                    <div className="relative min-h-[100px] flex items-center justify-center md:justify-start">
                                        {/* Navigation Arrows */}
                                        {centerOfGravityData.candidates.length > 1 && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -right-8 md:-right-12 z-20 hover:bg-amber-500/10 hover:text-amber-600"
                                                    onClick={() => setCgIndex(prev => (prev === 0 ? centerOfGravityData.candidates.length - 1 : prev - 1))}
                                                >
                                                    <ArrowRight className="w-6 h-6 rotate-180 text-amber-500/50 hover:text-amber-500" />
                                                </Button>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute -left-8 md:-left-12 z-20 hover:bg-amber-500/10 hover:text-amber-600"
                                                    onClick={() => setCgIndex(prev => (prev === centerOfGravityData.candidates.length - 1 ? 0 : prev + 1))}
                                                >
                                                    <ArrowRight className="w-6 h-6 text-amber-500/50 hover:text-amber-500" />
                                                </Button>
                                            </>
                                        )}

                                        <motion.h3
                                            key={currentCgAyah.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.3 }}
                                            className="text-xl md:text-2xl font-bold font-quran leading-loose md:leading-loose text-foreground w-full px-4 md:px-0"
                                        >
                                            "{currentCgAyah.text}"
                                        </motion.h3>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mt-4">
                                    <span className="px-3 py-1 rounded-full bg-secondary/30 border border-primary/5 shadow-sm">
                                        سورة {currentCgAyah.surahName}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-secondary/30 border border-primary/5 shadow-sm">
                                        الآية {currentCgAyah.ayahNo}
                                    </span>
                                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold shadow-sm">
                                        {currentCgAyah.rootCount} تكرارات للجذر هنا
                                    </span>
                                </div>
                            </div>

                            <div className="flex-shrink-0 self-center md:self-end mt-4 md:mt-0">
                                <Button
                                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 gap-2"
                                    onClick={() => handleNavigation('surah', currentCgAyah.surahName, parseInt(currentCgAyah.id))}
                                >
                                    عرض السياق
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* NEW: Chronology & Evolution Section */}
                {statistics!.timeline && statistics!.era && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 border-primary/10 bg-card/40 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-primary" />
                                        تطور المفهوم عبر نزول الوحي
                                    </CardTitle>
                                    <CardDescription>تتبع استخدام الجذر حسب ترتيب نزول السور</CardDescription>
                                </div>
                                <Select
                                    value={timelineSort}
                                    onValueChange={(v: 'quran' | 'revelation') => setTimelineSort(v)}
                                >
                                    <SelectTrigger className="w-[180px] h-8 text-xs bg-secondary/50 border-primary/20">
                                        <SelectValue placeholder="ترتيب العرض" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="quran">ترتيب المصحف (1-114)</SelectItem>
                                        <SelectItem value="revelation">ترتيب النزول (تاريخي)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <RevelationTimeline
                                    data={[...(statistics!.timeline || [])].sort((a, b) => {
                                        if (timelineSort === 'quran') {
                                            return (a.surahNo || 0) - (b.surahNo || 0);
                                        }
                                        return a.order - b.order;
                                    })}
                                    onClick={(surah) => handleNavigation('surah', surah)}
                                />
                            </CardContent>
                        </Card>

                        <Card className="border-primary/10 bg-card/40 backdrop-blur">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    التوزيع المكي والمدني
                                </CardTitle>
                                <CardDescription>استخدام الجذر في العهود المختلفة</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <EraDistribution
                                    data={statistics!.era}
                                    onClick={(era) => handleNavigation('era', era)}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* NEW: Linguistic Analysis & Network */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Word Forms */}
                    <Card className="border-primary/10 bg-card/40 backdrop-blur h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListFilter className="w-5 h-5 text-primary" />
                                المشتقات اللفظية ({statistics!.forms ? statistics!.forms.length : 0})
                            </CardTitle>
                            <CardDescription>أشكال الكلمات الأكثر استخداماً لهذا الجذر</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statistics!.forms ? (
                                <WordFormsList
                                    forms={statistics!.forms}
                                    onClick={(form) => handleNavigation('form', form)}
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm">جاري التحميل...</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Network Graph */}
                    <Card className="border-primary/10 bg-card/40 backdrop-blur h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                الشبكة المفاهيمية
                            </CardTitle>
                            <CardDescription>الجذور الأخرى التي تظهر بكثرة في نفس الآيات</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {statistics!.network ? (
                                <NetworkGraph
                                    nodes={statistics!.network.nodes}
                                    links={statistics!.network.links}
                                    onClick={(root) => {
                                        if (root !== statistics!.network.nodes[0].id) {
                                            handleNavigation('compare', root);
                                        }
                                    }}
                                />
                            ) : (
                                <div className="text-muted-foreground text-sm">جاري التحميل...</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* VISUALIZATION: Relationship Matrix */}
                {statistics!.matrix && statistics!.matrix.length > 0 && (
                    <Card className="border-primary/10 bg-card/40 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-primary" />
                                مصفوفة العلاقات الرقمية
                            </CardTitle>
                            <CardDescription>
                                تمثيل حراري لعدد الآيات المشتركة بين أهم الجذور المصاحبة. (اضغط على التقاطع لعرض الآيات المشتركة)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RelationshipMatrix
                                data={statistics!.matrix}
                                onClick={(rootA, rootB) => {
                                    if (rootA === searchResults!.root) handleNavigation('compare', rootB);
                                    else if (rootB === searchResults!.root) handleNavigation('compare', rootA);
                                    else {
                                        handleNavigation('compare', rootB);
                                    }
                                }}
                            />
                        </CardContent>
                    </Card>
                )}

                {/* VISUALIZATION: Existing Heatmap Enhanced */}
                <div className="grid grid-cols-1 gap-8">
                    <Card className="border-0 shadow-none bg-transparent">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Activity className="w-5 h-5 text-primary" />
                                البصمة التوزيعية (كثافة السور)
                            </CardTitle>
                            <CardDescription>تمثيل بصري لكثافة ذكر الجذر في السور المختلفة</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <SurahHeatmap
                                surahData={statistics!.surahDistribution}
                                onClick={(surah) => handleNavigation('surah', surah)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Extra Stats & Examples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-6">
                        <Card className="bg-card/40 border-primary/10 backdrop-blur overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg"> اكثر السور ذكراً للجذر</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CustomBarChart
                                    data={topSurahs}
                                    onClick={(surah) => handleNavigation('surah', surah.replace('سورة ', ''))}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {longestAyah && shortestAyah && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-secondary/20 rounded-2xl p-6 border border-primary/5">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
                                    <Star className="w-4 h-4" /> أطول آية ذكراً للجذر
                                </div>
                                <div className="text-muted-foreground text-sm line-clamp-4 leading-relaxed font-quran dir-rtl">
                                    "{longestAyah.text}"
                                </div>
                                <div className="mt-3 text-xs text-primary/60 font-medium">
                                    سورة {longestAyah.surahName} : آية {longestAyah.ayahNo}
                                </div>
                            </div>
                            <div className="bg-secondary/20 rounded-2xl p-6 border border-primary/5">
                                <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
                                    <Star className="w-4 h-4" /> أقصر آية ذكراً للجذر
                                </div>
                                <div className="text-muted-foreground text-sm line-clamp-4 leading-relaxed font-quran dir-rtl">
                                    "{shortestAyah.text}"
                                </div>
                                <div className="mt-3 text-xs text-primary/60 font-medium">
                                    سورة {shortestAyah.surahName} : آية {shortestAyah.ayahNo}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ScrollToTop />
        </PageContainer>
    );
};

export default Dashboard;