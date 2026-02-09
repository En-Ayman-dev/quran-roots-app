import React, { useState } from 'react';
import { ErrorLayout } from './ErrorLayout';
import { ServerCrash, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ServerErrorProps {
    error?: Error;
    onRetry?: () => void;
}

export const ServerError: React.FC<ServerErrorProps> = ({ error, onRetry }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (error) {
            const text = `${error.name}: ${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const Icon = (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
                <ServerCrash className="w-16 h-16 text-amber-600 dark:text-amber-500" />
            </motion.div>
            <motion.div
                className="absolute -top-2 -right-2 text-destructive font-bold text-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: [0, 1, 0], y: -20 }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                !
            </motion.div>
        </div>
    );

    return (
        <ErrorLayout
            title="خلل فني مؤقت"
            description="حدث خطأ غير متوقع في الخوادم. هذا الأمر نادر الحدوث، وقد تم تسجيله للمراجعة."
            icon={Icon}
            action="retry"
            onRetry={onRetry}
            verse={{
                text: "رَبَّنَا لَا تُؤَاخِذْنَا إِن نَّسِينَا أَوْ أَخْطَأْنَا",
                source: "سورة البقرة - ٢٨٦"
            }}
        >
            {error && (
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary gap-2 text-xs"
                        onClick={handleCopy}
                        title="Copy error details for debugging"
                    >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? 'تم النسخ' : 'نسخ تفاصيل الخطأ'}
                    </Button>
                </div>
            )}
        </ErrorLayout>
    );
};
