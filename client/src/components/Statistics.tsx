import React, { useState } from 'react';
import { useQuran } from '@/contexts/QuranContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollToTop } from './ui/ScrollToTop';

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden border-border/50 transition-all duration-300">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-secondary/20 transition-colors"
      >
        <CardTitle className="text-lg font-bold text-primary/80">{title}</CardTitle>
        <div className={`p-1 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="p-4 pt-0">
          {children}
        </div>
      </div>
    </Card>
  );
};

export const Statistics: React.FC = () => {
  const { statistics, searchResults } = useQuran();

  if (!statistics || !searchResults) {
    return null;
  }

  const surahData = Object.entries(statistics.surahDistribution).map(([name, count]) => ({
    name: name.length > 8 ? name.substring(0, 8) + '...' : name,
    value: count,
    fullName: name,
  }));

  const rootsData = statistics.topAccompanyingRoots.map(([root, count]) => ({
    name: root,
    count: count,
  }));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-foreground/80 flex items-center gap-2">
          📊 الإحصائيات
        </h2>
      </div>

      {/* Key Statistics */}
      <CollapsibleSection title="نظرة عامة">
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div className="text-center p-3 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">التكرار</p>
            <p className="text-2xl font-bold text-primary">{statistics.totalOccurrences}</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">الآيات</p>
            <p className="text-2xl font-bold text-primary">{statistics.totalAyahs}</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">السور</p>
            <p className="text-2xl font-bold text-primary">{statistics.uniqueSurahs}</p>
          </div>
          <div className="text-center p-3 bg-secondary/30 rounded-xl border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">المتوسط</p>
            <p className="text-2xl font-bold text-primary">{statistics.averageOccurrencesPerAyah}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Top Accompanying Roots */}
      {rootsData.length > 0 && (
        <CollapsibleSection title="أكثر الجذور المصاحبة" defaultOpen={false}>
          <div className="space-y-3 mt-2">
            {rootsData.map((root, idx) => (
              <div key={idx} className="flex items-center justify-between group cursor-default">
                <Badge variant="outline" className="text-sm px-2.5 py-0.5 bg-background group-hover:border-primary/50 transition-colors">
                  {root.name}
                </Badge>
                <div className="flex items-center gap-2 flex-1 mx-3 justify-end">
                  <div className="w-full max-w-[120px] bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary/80 h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(root.count / Math.max(...rootsData.map(r => r.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-6 text-left">
                    {root.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Surah Distribution Chart */}
      {surahData.length > 0 && (
        <CollapsibleSection title="توزيع السور">
          <div className="h-[200px] w-full mt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={surahData}>
                <XAxis dataKey="name" fontSize={10} tick={{ fill: '#888' }} interval={0} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CollapsibleSection>
      )}

      {/* Juz Distribution */}
      {Object.keys(statistics.juzDistribution).length > 0 && (
        <CollapsibleSection title="توزيع الأجزاء">
          <div className="grid grid-cols-4 gap-2 mt-2">
            {Object.entries(statistics.juzDistribution).map(([juz, count]) => (
              <div key={juz} className="text-center p-1.5 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors">
                <p className="text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">{juz}</p>
                <p className="text-sm font-bold text-primary">{count}</p>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <ScrollToTop />
    </div>
  );
};

export default Statistics;
