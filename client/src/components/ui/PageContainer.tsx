import React from 'react';
import { motion } from 'framer-motion';
import { QuranLoader } from '@/components/ui/QuranLoader';
import { ErrorLayout } from '@/components/errors/ErrorLayout';
import { NetworkError } from '@/components/errors/NetworkError';
import { ServerError } from '@/components/errors/ServerError';
import { AccessDenied } from '@/components/errors/AccessDenied';
import { AppError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface PageContainerProps {
    children: React.ReactNode;
    /** حالة التحميل */
    isLoading?: boolean;
    /** رسالة التحميل المخصصة */
    loadingMessage?: string;
    /** كائن الخطأ إن وجد */
    error?: AppError | Error | null;
    /** دالة إعادة المحاولة عند حدوث خطأ */
    onRetry?: () => void;
    /** تخصيص تنسيق الحاوية */
    className?: string;
    /** هل الصفحة تتطلب حاوية ضيقة أم عرض كامل؟ افتراضي: true (container) */
    contain?: boolean;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    isLoading,
    loadingMessage = "جاري التحميل...",
    error,
    onRetry,
    className,
    contain = true,
}) => {
    // 1. معالجة حالة التحميل
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <QuranLoader message={loadingMessage} />
            </div>
        );
    }

    // 2. معالجة حالات الخطأ المختلفة
    if (error) {
        // التحقق من نوع الخطأ لعرض المكون المناسب
        const errName = (error as any).name;

        if (errName === 'NetworkError') {
            return <NetworkError onRetry={onRetry} />;
        }
        if (errName === 'ServerError') {
            return <ServerError error={error as AppError} onRetry={onRetry} />;
        }
        if (errName === 'AuthenticationError' || errName === 'AccessDenied') {
            return <AccessDenied />;
        }

        // خطأ عام افتراضي
        return (
            <ErrorLayout
                title="حدث خطأ غير متوقع"
                description={error.message || "لا يمكن عرض محتوى الصفحة في الوقت الحالي."}
                icon={<AlertCircle className="w-10 h-10 text-destructive" />}
                action="retry"
                onRetry={onRetry}
            />
        );
    }

    // 3. عرض المحتوى الطبيعي
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={cn(
                "min-h-screen bg-background pb-20 pt-6", // هوامش افتراضية
                contain && "container mx-auto px-4 md:px-6", // تفعيل الحاوية المركزية
                className
            )}
        >
            {children}
        </motion.div>
    );
};