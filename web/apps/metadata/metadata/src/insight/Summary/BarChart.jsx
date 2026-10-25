import React from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
} from "recharts";

export const palette = [
  '#294b83',
  '#9f2b23',
  '#a8c4df',
  '#cc703e',
  '#dfc798',
  '#c2c1c0',
  '#517d98',
  '#0b3556',
  '#1d79a8',
  '#ff7f15',
  '#39c0f0',
  '#8e9cef',
  '#667b86',
  '#4bc41e',
  '#ca8312',
  '#00b6d4',
  '#00785a',
  '#1c75bc',
  '#b532a9',
  '#02ad0f',
];

export const ChartView = ({
    xAxisLabel,
    yAxisLabel,
    title="Counts (Bar)",
    label,
    data = []
}) => {

  const Card = ({ title, children }) => (
    <div style={{
      background: "white",
      borderRadius: 12,
      boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      minHeight: 260
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ flex: 1, minHeight: 200 }}>{children}</div>
    </div>
  );

  return (
      <Card title={title} >
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" maxBarSize={30} radius={[6, 6, 0, 0]}>
              <LabelList dataKey="value" position="top" />
              {data.map((_, i) => <Cell key={i} fill={palette[i % palette.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
   )
};

export default ChartView;
