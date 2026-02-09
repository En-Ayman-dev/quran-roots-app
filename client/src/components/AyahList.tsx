import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '../components/ui/card';

interface Ayah {
    id: string;
    surahName: string;
    ayahNo: number;
    text: string;
    tokens?: any[];
}

interface AyahListProps {
    ayahs: any[];
    highlightQuery?: string;
    focusAyahId?: number;
    title?: string;
}

export const AyahList: React.FC<AyahListProps> = ({ ayahs, highlightQuery, title, focusAyahId }) => {
    if (!ayahs || ayahs.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-primary/20">
                لا توجد آيات مطابقة لهذا التصنيف
            </div>
        );
    }

    // Simple highlighter logic
    const highlightText = (text: string, query?: string) => {
        if (!query) return text;
        // Normalize for comparison (basic)
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ?
                <span key={i} className="bg-primary/20 text-primary font-bold px-1 rounded">{part}</span> :
                part
        );
    };

    return (
        <div className="space-y-4">
            {title && <h3 className="text-lg font-bold text-primary mb-4">{title} ({ayahs.length})</h3>}
            <div className="grid gap-4">
                {ayahs.map((ayah, i) => {
                    const isFocused = focusAyahId !== undefined && focusAyahId === parseInt(ayah.id);
                    return (
                        <motion.div
                            key={ayah.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className={`transition-all duration-300 ${isFocused ? 'ring-2 ring-amber-500 bg-amber-500/5 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]' : 'bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30'}`}>
                                {isFocused && (
                                    <div className="bg-amber-500 text-black text-xs font-bold px-3 py-1 inline-block rounded-be-lg">
                                        مركز ثقل الجذر
                                    </div>
                                )}
                                <CardContent className="p-4 md:p-6">
                                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-3 border-b border-border/50 pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-bold">
                                                سورة {ayah.surahName}
                                            </span>
                                            <span className="text-muted-foreground text-xs">
                                                آية {ayah.ayahNo}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-lg md:text-xl font-quran leading-loose text-foreground">
                                        {/* 
                           For a truly robust highlight we'd use the token data, 
                           but for this drill-down plain text matching often suffices 
                           or we highlight the whole root if possible.
                        */}
                                        {ayah.text}
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};
