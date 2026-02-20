
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface GreenhouseComparisonChartProps {
    data: {
        name: string;
        value: number; // total hours
    }[]
}

const GreenhouseComparisonChart = ({ data }: GreenhouseComparisonChartProps) => {
    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis unit="h" />
                    <Tooltip formatter={(value: any) => [`${(value || 0).toFixed(1)} hours`, 'Total Time']} />
                    <Legend />
                    <Bar dataKey="value" name="Total Work Hours" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default GreenhouseComparisonChart;
