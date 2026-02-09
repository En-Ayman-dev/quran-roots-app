import React from 'react';
import { ErrorLayout } from './ErrorLayout';
import { WifiOff, SignalHigh, CloudOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkErrorProps {
    onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
    const Icon = (
        <div className="relative w-full h-full flex items-center justify-center">
            <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <WifiOff className="w-16 h-16 text-destructive" />
            </motion.div>
            {/* Radar Waves */}
            {[1, 2].map(i => (
                <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-destructive/30 rounded-full"
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                />
            ))}
        </div>
    );

    return (
        <ErrorLayout
            title="انقطع الاتصال"
            description="يبدو أن خيط الاتصال قد انقطع. لا بأس، فبعض الهدوء قد يكون مفيداً. تحقق من اتصالك وحاول مرة أخرى."
            icon={Icon}
            action="retry"
            onRetry={onRetry}
            verse={{
                text: "فَاصْبِرْ إِنَّ وَعْدَ اللَّهِ حَقٌّ",
                source: "سورة الروم - ٦٠"
            }}
        />
    );
};
