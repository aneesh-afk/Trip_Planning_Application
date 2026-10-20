import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getCategoryStyles } from '../../utils/categoryColors';

export default function BudgetOverviewTab({ expenses }) {
  // 1. Group by Category
  const categoryMap = {};
  expenses.forEach(exp => {
    const cat = exp.category || 'other';
    categoryMap[cat] = (categoryMap[cat] || 0) + exp.cost;
  });

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Use matching hex colors based on UI_SCHEMA
  const getHexForCategory = (cat) => {
    const style = getCategoryStyles(cat);
    if (style.text.includes('route')) return '#C4622D';
    if (style.text.includes('horizon')) return '#2B5D6B';
    if (style.text.includes('ink')) return '#1F2A24';
    return '#6B7268'; // muted
  };

  // 2. Group by Day
  const dayMap = {};
  expenses.forEach(exp => {
    const d = exp.day || 1;
    dayMap[d] = (dayMap[d] || 0) + exp.cost;
  });

  const dailyData = Object.entries(dayMap).map(([day, cost]) => ({
    day: `Day ${day}`,
    cost
  })).sort((a, b) => parseInt(a.day.replace('Day ', '')) - parseInt(b.day.replace('Day ', '')));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-[12px] rounded-[8px] shadow-sm">
          <p className="font-['IBM_Plex_Mono'] font-medium text-[13px] text-ink capitalize mb-[4px]">{payload[0].name || payload[0].payload.day}</p>
          <p className="font-['Fraunces'] font-semibold text-[16px] text-ink">₹{payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
      
      {/* Category Breakdown (Pie) */}
      <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm">
        <div className="mb-[20px]">
          <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Cost by Category</h3>
        </div>
        <div className="h-[300px]">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getHexForCategory(entry.name)} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(value) => <span className="capitalize text-[12px] text-ink font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-[14px]">No expenses yet</div>
          )}
        </div>
      </div>

      {/* Daily Breakdown (Bar) */}
      <div className="bg-surface border border-border rounded-[12px] p-[24px] shadow-sm">
        <div className="mb-[20px]">
          <h3 className="font-['Fraunces'] text-[18px] font-semibold text-ink">Daily Spend</h3>
        </div>
        <div className="h-[300px]">
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7268' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7268', fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#FBF7F0' }} />
                <Bar dataKey="cost" fill="#C4622D" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex items-center justify-center h-full text-muted text-[14px]">No expenses yet</div>
          )}
        </div>
      </div>

    </div>
  );
}
