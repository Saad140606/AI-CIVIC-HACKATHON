import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import type { MinistryTotal } from '../lib/api';
import { formatBillions, truncateMinistry } from '../lib/utils';

interface Props {
  data: MinistryTotal[];
  onSelect?: (ministry: MinistryTotal) => void;
  selectedMinistry?: string;
  height?: number;
  maxItems?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: MinistryTotal }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 shadow-card max-w-xs">
      <p className="font-semibold text-white text-sm mb-1">{d.ministry}</p>
      <p className="text-accent font-bold text-lg">PKR {d.total.toFixed(1)}B</p>
      {d.divisions.length > 0 && (
        <div className="mt-2 space-y-1">
          {d.divisions.slice(0, 3).map(div => (
            <div key={div.division} className="flex justify-between gap-4 text-xs text-text-secondary">
              <span className="truncate">{div.division}</span>
              <span className="font-semibold text-white">{formatBillions(div.total)}</span>
            </div>
          ))}
          {d.divisions.length > 3 && (
            <p className="text-xs text-text-secondary">+{d.divisions.length - 3} more divisions</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function BudgetChart({ data, onSelect, selectedMinistry, height = 500, maxItems = 20 }: Props) {
  const chartData = data.slice(0, maxItems).map(m => ({
    ...m,
    label: truncateMinistry(m.ministry, 28),
  }));

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
          barSize={18}
          onClick={(data: any) => {
            if (data?.activePayload?.[0] && onSelect) {
              onSelect(data.activePayload[0].payload as MinistryTotal);
            }
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1E3A5F"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={v => formatBillions(v)}
            tick={{ fill: '#8892A4', fontSize: 11 }}
            axisLine={{ stroke: '#1E3A5F' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={220}
            tick={{ fill: '#8892A4', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: 'rgba(0, 212, 255, 0.05)' }}
          />
          <Bar
            dataKey="total"
            radius={[0, 6, 6, 0]}
            cursor="pointer"
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.ministry}
                fill={entry.ministry === selectedMinistry ? '#00D4FF' : '#0070A0'}
                opacity={selectedMinistry && entry.ministry !== selectedMinistry ? 0.5 : 1}
              />
            ))}
            <LabelList
              dataKey="total"
              position="right"
              formatter={(v: any) => `PKR ${formatBillions(Number(v))}`}
              style={{ fill: '#8892A4', fontSize: 10 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
