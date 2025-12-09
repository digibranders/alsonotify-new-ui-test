import { ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label, Tooltip } from 'recharts';

export function ProgressWidget({ onNavigate }: { onNavigate?: (page: string) => void }) {
  // Requirements data
  const requirementsData = {
    completed: 18,
    total: 32,
    percentage: 56,
    inProgress: 10,
    delayed: 4
  };
  
  // Task data
  const taskData = {
    completed: 24,
    total: 41,
    percentage: 59,
    inProgress: 12,
    delayed: 5
  };
  
  return (
    <div className="bg-white rounded-[24px] p-6 w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-['Manrope:SemiBold',sans-serif] text-[20px] text-[#111111]">Progress</h3>
      </div>

      {/* Sub-cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-1 mt-3">
        <ProgressCard
          title="Requirements"
          data={requirementsData}
          onClick={() => onNavigate && onNavigate('requirements')}
        />
        
        <ProgressCard
          title="Tasks"
          data={taskData}
          onClick={() => onNavigate && onNavigate('tasks')}
        />
      </div>
    </div>
  );
}

interface ProgressCardProps {
  title: string;
  data: {
    completed: number;
    total: number;
    percentage: number;
    inProgress: number;
    delayed: number;
  };
  onClick?: () => void;
}

function ProgressCard({ title, data, onClick }: ProgressCardProps) {
  const chartData = [
    { name: 'Completed', value: data.completed, color: '#ff3b3b' },   // Primary Red
    { name: 'In Progress', value: data.inProgress, color: '#ff8080' }, // Lighter Red
    { name: 'Delayed', value: data.delayed, color: '#ffcccc' },       // Very Light Red
  ];

  // Filter out zero values for the chart only
  const activeData = chartData.filter(d => d.value > 0);

  return (
    <div 
      className="group relative flex flex-col bg-white rounded-[20px] border border-gray-100 p-5 hover:shadow-lg hover:border-[#ff3b3b]/10 transition-all duration-300 cursor-pointer h-full overflow-hidden"
      onClick={onClick}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 z-10 shrink-0">
        <h4 className="font-['Manrope',sans-serif] font-semibold text-[16px] text-[#111111]">{title}</h4>
        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#ff3b3b] transition-colors duration-300">
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300" />
        </div>
      </div>

      {/* Content Container - Side by Side Layout */}
      <div className="flex-1 flex items-center gap-6 min-h-[160px] px-2">
        {/* Chart Section */}
        <div className="relative w-[150px] h-[150px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={activeData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={70}
                paddingAngle={4}
                cornerRadius={4}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {activeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-[#111111] text-3xl font-extrabold font-['Manrope',sans-serif] tracking-tight"
                          >
                            {data.total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-[#999999] text-[11px] font-semibold font-['Inter',sans-serif] uppercase tracking-wider"
                          >
                            Total
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Stats Section */}
        <div className="flex-1 flex flex-col justify-center">
          {chartData.map((item) => (
            <div 
              key={item.name} 
              className="flex items-center justify-between w-full py-3 border-b border-gray-50 last:border-0 group/item transition-colors hover:bg-gray-50/50 rounded-lg px-2 -mx-2"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full shrink-0 ring-2 ring-white shadow-sm`} style={{ backgroundColor: item.color }} />
                <span className="text-[13px] text-[#666666] font-medium font-['Inter',sans-serif] whitespace-nowrap group-hover/item:text-[#111111] transition-colors">
                  {item.name === 'In Progress' ? 'In Progress' : item.name}
                </span>
              </div>
              <span className="text-[16px] font-bold text-[#111111] font-['Manrope',sans-serif]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}