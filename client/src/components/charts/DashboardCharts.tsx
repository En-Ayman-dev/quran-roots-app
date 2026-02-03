import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';

// --- Types ---
interface TimelineItem {
    order: number;
    surahNo?: number;
    surah: string;
    count: number;
}

interface EraData {
    meccan: number;
    medinan: number;
}

interface Node {
    id: string;
    group: number;
    radius: number;
}

interface Link {
    source: string;
    target: string;
    value: number;
}

// --- colors ---
const COLORS = {
    meccan: '#10b981', // Emerald 500
    medinan: '#f59e0b', // Amber 500
    primary: 'var(--primary)',
    secondary: 'var(--secondary)',
    muted: 'var(--muted)'
};

// --- Components ---

export const RevelationTimeline = ({ data, onClick }: { data: TimelineItem[]; onClick?: (surah: string) => void }) => {
    if (!data || data.length === 0) return <div>لا توجد بيانات</div>;

    return (
        <div className="w-full h-[300px] dir-ltr text-xs">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(state) => {
                        if (state && state.activePayload && state.activePayload[0]) {
                            onClick && onClick(state.activePayload[0].payload.surah);
                        }
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                    <XAxis
                        dataKey="order"
                        label={{ value: 'ترتيب النزول', position: 'insideBottom', offset: -5 }}
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--popover-foreground)' }}
                        labelFormatter={(label) => `الترتيب: ${label}`}
                        formatter={(value: number, name: string, props: any) => [value, `سورة ${props.payload.surah}`]}
                        cursor={{ fill: 'var(--primary)', opacity: 0.1 }}
                    />
                    <Bar
                        dataKey="count"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        className="cursor-pointer hover:opacity-80"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export const EraDistribution = ({ data, onClick }: { data: EraData; onClick?: (era: string) => void }) => {
    const chartData = [
        { name: 'مكية', value: data.meccan, type: 'meccan' },
        { name: 'مدنية', value: data.medinan, type: 'medinan' },
    ].filter(d => d.value > 0);

    const eraColors = [COLORS.meccan, COLORS.medinan];

    return (
        <div className="w-full h-[250px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => onClick && onClick(data.type)}
                        cursor="pointer"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={eraColors[index % eraColors.length]} className="cursor-pointer hover:opacity-80 stroke-background stroke-2" />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px' }}
                        itemStyle={{ color: 'var(--popover-foreground)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
            <div className="text-center text-sm text-muted-foreground mt-2">
                <span className="text-emerald-500 font-bold">{data.meccan}</span> مكية مقابل <span className="text-amber-500 font-bold">{data.medinan}</span> مدنية
            </div>
        </div>
    );
};

export const NetworkGraph = ({ nodes, links, onClick }: { nodes: Node[]; links: Link[]; onClick?: (root: string) => void }) => {
    // Simple Radial Layout since it's a star topology
    // Center is the first node
    const centerX = 200;
    const centerY = 200;
    const radius = 120;

    // Filter nodes: strictly exclude roots with < 3 letters (ignoring diacritics)
    // Always keep the center node (group 1) usually, but for consistency let's filter all 
    // OR: Assume center node is the target and might be small? 
    // Actually, user wants "other roots" filtered. The center is the target.
    // Let's filter the SATELLITE nodes (group 2).

    // Safety check
    if (!nodes || nodes.length === 0) return null;

    const centerNode = nodes[0];
    const rawSatellites = nodes.slice(1);
    const satelliteNodes = rawSatellites.filter(n => n.id.replace(/[\u064B-\u065F\u0670]/g, "").length >= 3);

    if (satelliteNodes.length === 0 && !centerNode) return null;
    const angleStep = (2 * Math.PI) / satelliteNodes.length;

    return (
        <div className="w-full h-[400px] flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-background to-secondary/10 rounded-xl border border-primary/5">
            <svg viewBox="0 0 400 400" className="w-full h-full">
                {/* Links */}
                {satelliteNodes.map((node, i) => {
                    const angle = i * angleStep;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    const link = links.find(l => l.target === node.id);
                    const strokeWidth = link ? Math.max(1, Math.min(4, link.value / 3)) : 1;
                    const count = link ? link.value : 0;

                    const midX = (centerX + x) / 2;
                    const midY = (centerY + y) / 2;

                    return (
                        <g key={`link-group-${i}`}>
                            <motion.line
                                x1={centerX}
                                y1={centerY}
                                x2={x}
                                y2={y}
                                stroke="var(--primary)"
                                strokeOpacity="0.3"
                                strokeWidth={strokeWidth}
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 1, delay: 0.5 }}
                            />

                            {/* Link Badge (Circle instead of Rect) */}
                            <motion.circle
                                cx={midX}
                                cy={midY}
                                r="10"
                                fill="white"
                                stroke="var(--primary)"
                                strokeWidth="1"
                                strokeOpacity="0.5"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 1.5 }}
                            />
                            <motion.text
                                x={midX}
                                y={midY}
                                dy=".35em"
                                textAnchor="middle"
                                fontSize="10"
                                fill="var(--primary)"
                                fontWeight="bold"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1.6 }}
                            >
                                {count}
                            </motion.text>
                        </g>
                    );
                })}

                {/* Satellite Nodes */}
                {satelliteNodes.map((node, i) => {
                    const angle = i * angleStep;
                    const x = centerX + radius * Math.cos(angle);
                    const y = centerY + radius * Math.sin(angle);

                    return (
                        <g key={`node-${i}`} onClick={() => onClick && onClick(node.id)} className="cursor-pointer group">
                            <motion.circle
                                cx={x}
                                cy={y}
                                r={Math.min(24, Math.max(18, node.radius))}
                                fill="white"
                                stroke="var(--primary)"
                                strokeWidth="2"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.05 }}
                                className="group-hover:fill-primary/10 transition-colors shadow-lg"
                            />
                            <motion.text
                                x={x}
                                y={y + Math.min(24, Math.max(18, node.radius)) + 16}
                                textAnchor="middle"
                                fill="var(--foreground)"
                                fontSize="12"
                                fontWeight="bold"
                                className="pointer-events-none group-hover:scale-110 transition-transform font-quran"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 1 + i * 0.05 }}
                            >
                                {node.id}
                            </motion.text>
                        </g>
                    );
                })}

                {/* Center Node */}
                <g>
                    <motion.circle
                        cx={centerX}
                        cy={centerY}
                        r={Math.min(45, Math.max(30, centerNode.radius))}
                        fill="var(--primary)"
                        stroke="white"
                        strokeWidth="4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="cursor-default drop-shadow-md"
                    />
                    <text
                        x={centerX}
                        y={centerY}
                        dy=".35em"
                        textAnchor="middle"
                        fill="white"
                        fontSize="16"
                        fontWeight="bold"
                        className="pointer-events-none font-quran"
                    >
                        {centerNode.id}
                    </text>
                </g>
            </svg>
            <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/60">
                شبكة الجذور المصاحبة (اضغط للتفاصيل) <Share2 className="w-3 h-3 inline ml-1" />
            </div>
        </div>
    );
};

export const WordFormsList = ({ forms, onClick }: { forms: { form: string, count: number }[]; onClick?: (form: string) => void }) => {
    if (!forms || forms.length === 0) return null;
    const max = forms[0].count;

    return (
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-2">
            {forms.map((item, i) => (
                <motion.div
                    key={i}
                    onClick={() => onClick && onClick(item.form)}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/10 border border-border/50 hover:bg-secondary/20 hover:border-primary/30 transition-all cursor-pointer group"
                >
                    <span className="font-quran text-lg text-foreground group-hover:text-primary transition-colors">{item.form}</span>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${(item.count / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground w-6 text-left">{item.count}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};
// ... existing imports ...

export const RelationshipMatrix = ({ data, onClick }: { data: { x: string; y: string; value: number }[], onClick?: (x: string, y: string) => void }) => {
    // Fail-Safe: Filter out any execution that slipped through backend
    // Remove diacritics before checking length!
    const cleanData = data?.filter(d =>
        d.x.replace(/[\u064B-\u065F\u0670]/g, "").length >= 3 &&
        d.y.replace(/[\u064B-\u065F\u0670]/g, "").length >= 3
    ) || [];

    if (!cleanData || cleanData.length === 0) return <div>لا توجد بيانات</div>;

    // 1. Extract unique roots
    const roots = Array.from(new Set(cleanData.map(d => d.x)));

    // 2. Find max value for color scale (excluding self-intersection which is huge)
    const maxVal = Math.max(...cleanData.filter(d => d.x !== d.y).map(d => d.value), 1);

    // 3. Grid CSS
    const gridSize = roots.length;

    return (
        <div className="w-full overflow-x-auto p-4 flex justify-center">
            <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${gridSize}, minmax(40px, 1fr))` }}>
                {/* Header Row */}
                <div className="h-10"></div>
                {roots.map((root, i) => (
                    <div key={`head-${i}`} className="h-10 flex items-end justify-center pb-2">
                        <span className="text-xs font-bold text-muted-foreground -rotate-45 whitespace-nowrap origin-bottom-left translate-x-2">{root}</span>
                    </div>
                ))}

                {/* Rows */}
                {roots.map((rowRoot, i) => (
                    <React.Fragment key={`row-${i}`}>
                        {/* Row Label */}
                        <div className="flex items-center justify-end pr-2">
                            <span className="text-xs font-bold text-muted-foreground">{rowRoot}</span>
                        </div>

                        {/* Cells */}
                        {roots.map((colRoot, j) => {
                            const cell = cleanData.find(d => d.x === rowRoot && d.y === colRoot) || { value: 0 };
                            const isSelf = rowRoot === colRoot;
                            const intensity = isSelf ? 0.1 : Math.min(1, cell.value / maxVal);

                            return (
                                <motion.div
                                    key={`cell-${i}-${j}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: (i * 0.05) + (j * 0.05) }}
                                    onClick={() => !isSelf && onClick && onClick(rowRoot, colRoot)}
                                    className={`
                                        aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all
                                        ${isSelf ? 'bg-secondary/20 text-muted-foreground cursor-default' : 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:z-10'}
                                    `}
                                    style={{
                                        backgroundColor: !isSelf ? `rgba(16, 185, 129, ${0.1 + (intensity * 0.9)})` : undefined, // Using Emerald (primary) base
                                        color: !isSelf && intensity > 0.5 ? 'white' : 'inherit'
                                    }}
                                    title={`${rowRoot} + ${colRoot}: ${cell.value} موضع`}
                                >
                                    {cell.value > 0 ? cell.value : ''}
                                </motion.div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
import { Share2 } from 'lucide-react';
