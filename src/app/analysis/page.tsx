
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DailyWorkTrendChart from './components/DailyWorkTrendChart';
import GreenhouseComparisonChart from './components/GreenhouseComparisonChart';

interface AnalysisData {
    trend: any[];
    workNames: string[];
    greenhouseComparison: any[];
    totalRecords: number;
    filterOptions: {
        years: string[];
        greenhouses: string[];
    };
}

export default function AnalysisPage() {
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedYear, setSelectedYear] = useState<string>('ALL');
    const [selectedGh, setSelectedGh] = useState<string>('ALL');
    const [selectedBatch, setSelectedBatch] = useState<string>('ALL');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (selectedYear !== 'ALL') params.append('year', selectedYear);
                if (selectedGh !== 'ALL') params.append('gh', selectedGh);
                if (selectedBatch !== 'ALL') params.append('batch', selectedBatch);

                const res = await fetch(`/api/analysis?${params.toString()}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const jsonData = await res.json();
                setData(jsonData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear, selectedGh, selectedBatch]);

    const copyToClipboard = async () => {
        try {
            const res = await fetch('/api/analysis/export');
            const jsonData = await res.json();
            await navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
            alert('AI用データをクリップボードにコピーしました。\nChatGPTに貼り付けて分析を依頼してください。');
        } catch (error) {
            console.error(error);
            alert('データのコピーに失敗しました。');
        }
    };

    if (loading) return <div className="p-8">読み込み中...</div>;
    if (!data) return <div className="p-8">データの取得に失敗しました。</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">作業分析ダッシュボード</h1>
                <div className="space-x-4">
                    <button
                        onClick={copyToClipboard}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition"
                    >
                        ✨ AI分析用データをコピー
                    </button>
                    <Link href="/api/analysis/export" target="_blank" className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition box-border inline-block">
                        JSONをダウンロード
                    </Link>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow mb-8 flex flex-col md:flex-row gap-4 items-center">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">収穫年 (Harvest Year)</label>
                    <select
                        className="border border-gray-300 rounded p-2 focus:ring focus:ring-green-200"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                    >
                        <option value="ALL">すべて (All)</option>
                        {data.filterOptions?.years.map((y: string) => (
                            <option key={y} value={y}>{y}年</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">ハウス (Greenhouse)</label>
                    <select
                        className="border border-gray-300 rounded p-2 focus:ring focus:ring-green-200"
                        value={selectedGh}
                        onChange={(e) => setSelectedGh(e.target.value)}
                    >
                        <option value="ALL">すべて (All)</option>
                        {data.filterOptions?.greenhouses.map((g: string) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-600 mb-1">作目 (Batch)</label>
                    <select
                        className="border border-gray-300 rounded p-2 focus:ring focus:ring-green-200"
                        value={selectedBatch}
                        onChange={(e) => setSelectedBatch(e.target.value)}
                    >
                        <option value="ALL">すべて (All)</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(b => (
                            <option key={b} value={b}>{b}作目</option>
                        ))}
                    </select>
                </div>
                <div className="mt-4 md:mt-0 md:ml-auto text-sm text-gray-500">
                    <p>※指定条件に一致する作（CropCycle）の作業履歴を抽出します。</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">日次作業時間の推移</h2>
                    <p className="text-sm text-gray-500 mb-4">日ごとの合計作業時間を項目別に色分けして表示します。</p>
                    <DailyWorkTrendChart data={data.trend} workNames={data.workNames} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
                    <h2 className="text-xl font-semibold mb-4">ハウス別 作業時間比較</h2>
                    <p className="text-sm text-gray-500 mb-4">ハウスごとの累計作業時間を比較します。</p>
                    <GreenhouseComparisonChart data={data.greenhouseComparison} />
                </div>
            </div>

            <div className="text-right text-gray-400 text-sm">
                総レコード数: {data.totalRecords}
            </div>
        </div>
    );
}
