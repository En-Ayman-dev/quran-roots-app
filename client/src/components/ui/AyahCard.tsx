import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Copy } from 'lucide-react';

// --- Utility: Normalize Arabic ---
const normalizeArabic = (text: string) => {
    if (!text) return "";
    return text.replace(/[\u064B-\u065F\u0670\u0640]/g, "");
};

// --- Sub-component: HighlightableText (Moved here for encapsulation) ---
const HighlightableText: React.FC<{
    text: string;
    mainWords: string[];
    secondaryWords: string[];
    subSearch: string;
}> = ({ text, mainWords, secondaryWords, subSearch }) => {
    if (!text) return null;

    // COLOR PALETTE (High Contrast Text Only - No Backgrounds)
    const STYLE_MAIN = "text-blue-600 dark:text-blue-400 font-extrabold";
    const STYLE_SECONDARY = "text-fuchsia-600 dark:text-fuchsia-400 font-extrabold";
    const STYLE_GENERAL = "text-emerald-600 dark:text-emerald-400 font-bold";

    const normalize = (t: string) => t.replace(/[\u064B-\u065F\u0670\u0640]/g, "");

    const mainSet = new Set(mainWords.map(w => normalize(w)));
    const secondarySet = new Set(secondaryWords.map(w => normalize(w)));

    const cleanSub = subSearch ? normalize(subSearch.trim()) : "";
    const subIsRoot = mainSet.has(cleanSub) || secondarySet.has(cleanSub);

    const words = text.split(' ');

    return (
        <>
            {words.map((word, i) => {
                const normWord = normalize(word);
                const suffix = i < words.length - 1 ? " " : "";

                if (mainSet.has(normWord)) {
                    return <span key={i} className={STYLE_MAIN}>{word}{suffix}</span>;
                }

                if (secondarySet.has(normWord)) {
                    return <span key={i} className={STYLE_SECONDARY}>{word}{suffix}</span>;
                }

                if (cleanSub && cleanSub.length > 1 && !subIsRoot && normWord.includes(cleanSub)) {
                    return <span key={i} className={STYLE_GENERAL}>{word}{suffix}</span>;
                }

                return <span key={i}>{word}{suffix}</span>;
            })}
        </>
    );
};

// --- Main Component: AyahCard ---
interface AyahCardProps {
    ayah: any;
    index?: number;
    onRootClick: (root: string) => void;
    mainRoot: string;
    subSearch: string;
}

export const AyahCard: React.FC<AyahCardProps> = ({
    ayah,
    index = 0,
    onRootClick,
    mainRoot,
    subSearch
}) => {
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Derive Highlight Lists
    const mainTokens = React.useMemo(() =>
        ayah.tokens
            ? ayah.tokens
                .filter((t: any) => t.root === mainRoot)
                .map((t: any) => t.token_uthmani || t.token)
            : [],
        [ayah.tokens, mainRoot]);

    const secondaryTokens = React.useMemo(() => {
        if (!subSearch || !ayah.tokens) return [];
        return ayah.tokens
            .filter((t: any) => t.root === subSearch && t.root !== mainRoot)
            .map((t: any) => t.token_uthmani || t.token);
    }, [ayah.tokens, subSearch, mainRoot]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`group overflow-hidden rounded-2xl border transition-all duration-500 relative bg-card ${isExpanded
                    ? 'shadow-2xl shadow-primary/10 border-primary/20 ring-1 ring-primary/5'
                    : 'shadow-sm hover:shadow-md border-border/50 hover:border-primary/20'
                }`}
        >
            {/* Decorative side accent */}
            <div className={`absolute start-0 top-0 bottom-0 w-1 transition-all duration-500 ${isExpanded ? 'bg-primary' : 'bg-primary/0 group-hover:bg-primary/50'}`} />

            {/* CLICKABLE HEADER AREA */}
            <div
                role="button"
                aria-expanded={isExpanded}
                tabIndex={0}
                onClick={() => setIsExpanded(!isExpanded)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsExpanded(!isExpanded); } }}
                className="cursor-pointer p-4 md:p-5 flex flex-wrap items-center justify-between gap-4 relative z-10 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-xl"
            >
                <div className="flex items-center gap-4 flex-1">
                    {/* Number Badge */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors font-serif ${isExpanded ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-primary group-hover:bg-primary/10'}`}>
                        {index + 1}
                    </div>

                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-lg font-bold text-foreground font-serif leading-tight">{ayah.surahName}</h3>
                            <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-background rounded border border-border">آية {ayah.ayahNo}</span>
                        </div>

                        {/* Metadata Preview */}
                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                            <span>الجزء {ayah.juz}</span>
                            <span className="w-px h-2.5 bg-border self-center" />
                            <span>صفحة {ayah.page}</span>
                            {!isExpanded && ayah.tokens && ayah.tokens.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="mr-2 flex gap-1"
                                >
                                    <span className="bg-primary/10 text-primary px-1.5 rounded-[3px] font-bold text-[10px]">
                                        {ayah.tokens.length} تطابق
                                    </span>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Toggle Icon & Copy Button */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(`${ayah.text} \n[${ayah.surahName}: ${ayah.ayahNo}]`);
                            // Simple visual feedback could be added here
                        }}
                        className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground transition-colors z-20"
                        title="نسخ الآية"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <div className={`p-2 rounded-full transition-colors ${isExpanded ? 'bg-primary/10 text-primary' : 'bg-transparent text-muted-foreground group-hover:bg-muted'}`}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>
            </div>

            {/* VISIBLE QURAN TEXT AREA */}
            <div className="px-5 md:px-8 pb-4 pt-0 -mt-1">
                <div className="relative">
                    <div className="max-h-[130px] overflow-y-auto custom-scrollbar pl-2 pr-2 py-1 hover:bg-muted/5 rounded-lg transition-colors">
                        <p className="text-right text-lg md:text-xl leading-[2.4] dir-rtl text-foreground font-quran drop-shadow-sm select-text" dir="rtl">
                            <HighlightableText
                                text={ayah.text}
                                mainWords={mainTokens}
                                secondaryWords={secondaryTokens}
                                subSearch={subSearch}
                            />
                        </p>
                    </div>
                </div>
            </div>

            {/* EXPANDABLE CONTENT */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="px-5 md:px-8 pb-6 pt-4 border-t border-border/40 bg-muted/5">
                            <div className="flex flex-wrap gap-x-8 gap-y-4">

                                {/* Root Matches */}
                                {ayah.tokens && ayah.tokens.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-bold text-primary/90 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            الكلمات المطابقة
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {ayah.tokens.map((token: any, idx: number) => {
                                                const isMain = token.root === mainRoot;
                                                const isSecondary = token.root === subSearch;
                                                return (
                                                    <div key={idx} className={`flex flex-col items-center px-3 py-1.5 rounded-md border shadow-sm relative min-w-[40px] ${isMain ? 'bg-primary/10 border-primary/30' :
                                                            isSecondary ? 'bg-amber-100 border-amber-300 dark:bg-amber-900/30' :
                                                                'bg-background border-border/80'
                                                        }`}>
                                                        <span className={`text-sm font-bold font-quran leading-tight ${isMain ? 'text-primary' :
                                                                isSecondary ? 'text-amber-700 dark:text-amber-400' :
                                                                    'text-foreground'
                                                            }`}>{token.token_uthmani || token.token}</span>
                                                        <span className="text-[9px] text-muted-foreground/90 uppercase tracking-wide">{token.root}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Related Roots */}
                                {ayah.otherRoots && ayah.otherRoots.length > 0 && (
                                    <div className="space-y-2 flex-1 min-w-[180px]">
                                        <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                                            جذور أخرى
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ayah.otherRoots.filter((r: string) => normalizeArabic(r).length >= 3).map((root: string, idx: number) => {
                                                const isSelected = root === subSearch;
                                                return (
                                                    <span
                                                        key={idx}
                                                        onClick={(e) => { e.stopPropagation(); onRootClick(root); }}
                                                        className={`text-xs font-medium px-2 py-1 rounded-md border cursor-pointer transition-all hover:shadow-sm ${isSelected
                                                                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400'
                                                                : 'bg-background text-muted-foreground border-border/50 hover:border-primary/50 hover:text-primary'
                                                            }`}
                                                    >
                                                        {root}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};