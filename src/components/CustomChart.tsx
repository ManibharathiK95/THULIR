import React, { useState, useEffect, useRef } from "react";
import { IncomeEntry, ExpenseEntry } from "../types";
import { getFYMonthIndex, FY_MONTH_LABELS } from "../utils/date";
import { formatCurrency } from "../utils/currency";

interface CustomChartProps {
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  financialYear: string;
}

export default function CustomChart({ income, expenses, financialYear }: CustomChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    month: string;
    type: "Income" | "Expense";
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const height = 300;

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setWidth(entry.contentRect.width || 600);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute monthly data
  // Index 0 is April, Index 11 is March
  const monthlyData = Array.from({ length: 12 }, (_, i) => ({
    label: FY_MONTH_LABELS[i],
    income: 0,
    expense: 0
  }));

  income.forEach(item => {
    const idx = getFYMonthIndex(item.date);
    if (idx >= 0 && idx < 12) {
      monthlyData[idx].income += Number(item.amount) || 0;
    }
  });

  expenses.forEach(item => {
    const idx = getFYMonthIndex(item.date);
    if (idx >= 0 && idx < 12) {
      monthlyData[idx].expense += Number(item.amount) || 0;
    }
  });

  // Find max value to scale Y axis
  const maxVal = Math.max(
    ...monthlyData.map(d => Math.max(d.income, d.expense)),
    1000 // default minimum max value
  );

  // Round max value up to a neat number for grid lines
  const scaleMax = Math.ceil(maxVal / 1000) * 1000;
  const gridLines = [0, scaleMax * 0.25, scaleMax * 0.5, scaleMax * 0.75, scaleMax];

  // Chart dimensions and margins
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = Math.max(width - paddingLeft - paddingRight, 200);
  const chartHeight = height - paddingTop - paddingBottom;

  const barGroupWidth = chartWidth / 12;
  const barWidth = Math.max(barGroupWidth * 0.35, 4);

  const getX = (index: number) => paddingLeft + index * barGroupWidth + (barGroupWidth - barWidth * 2 - 4) / 2;
  const getY = (val: number) => paddingTop + chartHeight - (val / scaleMax) * chartHeight;
  const getBarHeight = (val: number) => (val / scaleMax) * chartHeight;

  // Formatter for Y Axis labels
  const formatYLabel = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    }
    if (val >= 1000) {
      return `${(val / 1000).toFixed(0)}K`;
    }
    return val.toString();
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Monthly Cashflow ({financialYear})
        </h3>
        <div className="flex space-x-4 text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-xs bg-[#34a853] mr-1.5"></span>
            <span className="text-gray-500">Income</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 rounded-xs bg-[#ea4335] mr-1.5"></span>
            <span className="text-gray-500">Expense</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.12)] p-4">
        <svg width="100%" height={height} className="overflow-visible select-none">
          {/* Y Axis Grid Lines & Labels */}
          {gridLines.map((lineVal, idx) => {
            const y = getY(lineVal);
            return (
              <g key={idx}>
                {/* Grid Line */}
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#f1f3f4"
                  strokeWidth="1"
                  strokeDasharray={lineVal === 0 ? "none" : "4,4"}
                />
                {/* Y Label */}
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-gray-400"
                >
                  {formatYLabel(lineVal)}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {monthlyData.map((data, idx) => {
            const x = paddingLeft + idx * barGroupWidth + barGroupWidth / 2;
            return (
              <text
                key={idx}
                x={x}
                y={height - paddingBottom + 20}
                textAnchor="middle"
                className="font-sans text-xs font-semibold fill-gray-500"
              >
                {data.label}
              </text>
            );
          })}

          {/* Bars */}
          {monthlyData.map((data, idx) => {
            const groupX = getX(idx);
            
            // Income bar
            const incomeBarHeight = getBarHeight(data.income);
            const incomeY = getY(data.income);
            const incomeX = groupX;

            // Expense bar
            const expenseBarHeight = getBarHeight(data.expense);
            const expenseY = getY(data.expense);
            const expenseX = groupX + barWidth + 4; // 4px spacing between income and expense bars

            return (
              <g key={idx}>
                {/* Income Bar (Green) */}
                <rect
                  x={incomeX}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeBarHeight, 2)} // at least 2px high so visible if non-zero
                  rx={2}
                  className="fill-[#34a853] hover:opacity-85 transition-all cursor-pointer duration-150"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredBar({
                      month: data.label,
                      type: "Income",
                      value: data.income,
                      x: incomeX + barWidth / 2,
                      y: incomeY - 10
                    });
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Expense Bar (Red) */}
                <rect
                  x={expenseX}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseBarHeight, 2)}
                  rx={2}
                  className="fill-[#ea4335] hover:opacity-85 transition-all cursor-pointer duration-150"
                  onMouseEnter={(e) => {
                    setHoveredBar({
                      month: data.label,
                      type: "Expense",
                      value: data.expense,
                      x: expenseX + barWidth / 2,
                      y: expenseY - 10
                    });
                  }}
                  onMouseLeave={() => setHoveredBar(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Custom HTML Tooltip */}
        {hoveredBar && (
          <div
            className="absolute z-10 bg-gray-900 text-white rounded-lg px-3 py-1.5 shadow-md text-xs font-medium border border-gray-800 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: hoveredBar.x,
              top: hoveredBar.y + 16 // offsets inside padding
            }}
          >
            <div className="text-[10px] text-gray-400 font-semibold uppercase">{hoveredBar.month}</div>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hoveredBar.type === "Income" ? "bg-[#34a853]" : "bg-[#ea4335]"}`}></span>
              <span>{hoveredBar.type}:</span>
              <span className="font-semibold">{formatCurrency(hoveredBar.value, "AED")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
