import React, { useEffect, useState } from 'react';
import { ErrorLayout } from './ErrorLayout';
import { Search, Map, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export const NotFound = () => {
    // Custom Icon with animated search
    const Icon = (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
                animate={{
                    x: [0, 20, 0, -20, 0],
                    y: [0, -15, 0, 15, 0],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute"
            >
                <Search className="w-16 h-16 text-primary opacity-80" />
            </motion.div>
            <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl"
            />
            <Compass className="w-24 h-24 text-muted-foreground/20 absolute" />
        </div>
    );

    return (
        <ErrorLayout
            title="404 - التيه في الصحراء"
            description="الصحيفة التي تبحث عنها لم تُكتب بعد، أو ربما طوتها رمال النسيان. دعنا نعود إلى الواحة الرئيسية."
            icon={Icon}
            action="home"
            verse={{
                text: "وَعِندَهُ مَفَاتِحُ الْغَيْبِ لَا يَعْلَمُهَا إِلَّا هُوَ",
                source: "سورة الأنعام - ٥٩"
            }}
        />
    );
};
