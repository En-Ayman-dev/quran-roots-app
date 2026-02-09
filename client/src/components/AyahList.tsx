import React from 'react';
import { motion } from 'framer-motion';
import { AyahCard } from './ui/AyahCard';

interface AyahListProps {
    ayahs: any[];
    highlightQuery?: string;
    focusAyahId?: number;
    title?: string;
    onRootClick?: (root: string) => void;
}

export const AyahList: React.FC<AyahListProps> = ({
    ayahs,
    highlightQuery,
    title,
    focusAyahId,
    onRootClick
}) => {
    if (!ayahs || ayahs.length === 0) {
        return (
            <div className="text-center p-8 text-muted-foreground bg-secondary/5 rounded-xl border border-dashed border-primary/20">
                لا توجد آيات مطابقة لهذا التصنيف
            </div>
        );
    }

    // معالج افتراضي للنقر على الجذر في حال عدم تمريره
    const handleRootClick = onRootClick || ((root: string) => {
        console.log("Root clicked:", root);
    });

    return (
        <div className="space-y-4">
            {title && <h3 className="text-lg font-bold text-primary mb-4">{title} ({ayahs.length})</h3>}
            <div className="grid gap-4">
                {ayahs.map((ayah, i) => {
                    // تحديد ما إذا كانت الآية هي "مركز الثقل"
                    const isFocused = focusAyahId !== undefined && focusAyahId === parseInt(ayah.id);

                    return (
                        <motion.div
                            key={ayah.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            // تطبيق ستايل "مركز الثقل" على الحاوية الخارجية للحفاظ على ميزات AyahCard
                            className={`relative rounded-2xl transition-all duration-300 ${isFocused
                                    ? 'ring-2 ring-amber-500 bg-amber-500/5 shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]'
                                    : ''
                                }`}
                        >
                            {/* شارة "مركز ثقل الجذر" - تراكب مطلق فوق البطاقة */}
                            {isFocused && (
                                <div className="absolute top-0 right-0 z-20 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-br-none rounded-tl-none rounded-tr-2xl rounded-bl-lg shadow-sm font-sans">
                                    مركز ثقل الجذر
                                </div>
                            )}

                            <AyahCard
                                ayah={ayah}
                                index={i}
                                // نمرر استعلام البحث كـ subSearch ليتم تمييز النص (Highlighting)
                                mainRoot={highlightQuery || ''}
                                subSearch={highlightQuery || ''}
                                onRootClick={handleRootClick}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};