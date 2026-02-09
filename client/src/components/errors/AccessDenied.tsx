import React from 'react';
import { ErrorLayout } from './ErrorLayout';
import { ShieldAlert, Lock, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

export const AccessDenied = () => {
    const Icon = (
        <div className="relative w-full h-full flex items-center justify-center">
            {/* Rotating Shield Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-2 border-dashed border-destructive/20 rounded-full"
            />

            <div className="relative z-10">
                <ShieldAlert className="w-16 h-16 text-destructive" />
            </div>

            {/* Floating Lock */}
            <motion.div
                className="absolute -top-2 -right-2 bg-background p-1.5 rounded-full shadow-lg border border-border"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
                <Lock className="w-5 h-5 text-amber-500" />
            </motion.div>
            {/* Floating Fingerprint */}
            <motion.div
                className="absolute -bottom-2 -left-2 bg-background p-1.5 rounded-full shadow-lg border border-border"
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                <Fingerprint className="w-5 h-5 text-destructive/70" />
            </motion.div>
        </div>
    );

    return (
        <ErrorLayout
            title="وصول مقيد"
            description="نعتذر، ولكن ليس لديك الصلاحية للوصول إلى هذه المنطقة. يرجى التحقق من أذوناتك أو تسجيل الدخول."
            icon={Icon}
            action="home"
            verse={{
                text: "وَمَا كَانَ لِبَشَرٍ أَن يُكَلِّمَهُ اللَّهُ إِلَّا وَحْياً أَوْ مِن وَرَاءِ حِجَابٍ",
                source: "سورة الشورى - ٥١"
            }}
        />
    );
};
