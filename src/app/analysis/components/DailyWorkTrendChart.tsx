
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DailyWorkTrendChartProps {
    data: any[];
    workNames: string[];
}

const COLORS = ['#8884d8', '#8dd1e1', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658', '#FF8042', '#FFBB28', '#00C49F', '#0088FE'];

const DailyWorkTrendChart = ({ data, workNames }: DailyWorkTrendChartProps) => {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="h" />
                    <Tooltip
                        formatter={(value: any, name: any) => [`${(value || 0).toFixed(1)} hours`, name]}
                        labelStyle={{ color: '#333' }}
                    />
                    <Legend />
                    {workNames.map((name, index) => (
                        <Bar
                            key={name}
                            dataKey={name}
                            stackId="a"
                            fill={COLORS[index % COLORS.length]}
                            name={name}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default DailyWorkTrendChart;
