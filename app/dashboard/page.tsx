'use client';

import React, { useState, useEffect } from 'react';
import {
    CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
    ReferenceLine, AreaChart, Area, Line
} from 'recharts';
import { useMediaQuery } from '../hooks/useMediaQuery';
import Link from 'next/link';

interface InventoryItem {
    PLANT_NAME: string;
    STOCK_SELL_VALUE: number;
    UNRESTRICTED_STOCK: number;
    CURRENCY: string;
}
interface InboundItem {
    PLANT_NAME: string;
    INBOUND_DATE: string;
    NET_QUANTITY_MT: number;
}
interface OutboundItem {
    PLANT_NAME: string;
    OUTBOUND_DATE: string;
    NET_QUANTITY_MT: number;
}

interface NetFlowItem {
    date: string;
    Inbound: number;
    Outbound: number;
    NetFlow: number;
}
interface KpiItem {
    totalValue: number;
    totalItems: number;
    currency: string;
}

const transformSheetData = <T extends object>(values: (string | number)[][]): T[] => {
    if (!values || values.length < 2) return [];
    const headers: string[] = values[0] as string[];
    const dataRows = values.slice(1);
    return dataRows.map((row) => {
        const item: { [key: string]: unknown } = {};
        headers.forEach((header, index) => {
            const value = row[index];
            item[header] = /^\d+(\.\d+)?$/.test(String(value)) ? Number(value) : value;
        });
        return item as T;
    });
};

const Card = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl border border-[#333333] shadow-lg ${className}`}>
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">{title}</h2>
        {children}
    </div>
);

type TimeGroup = 'Daily' | 'Weekly' | 'Monthly';

const TimeGroupToggle = ({ selected, onSelect }: { selected: TimeGroup, onSelect: (group: TimeGroup) => void }) => {
    const options: TimeGroup[] = ['Daily', 'Weekly', 'Monthly'];
    return (
        <div className="flex items-center gap-2 mb-4">
            {options.map(opt => (
                <button key={opt} onClick={() => onSelect(opt)} className={`px-3 py-1 text-xs rounded-md transition-colors ${selected === opt ? 'bg-red-600 text-white' : 'bg-[#333] text-gray-400 hover:bg-[#444]'}`}>
                    {opt}
                </button>
            ))}
        </div>
    );
};

export default function DashboardPage() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [chinaKpi, setChinaKpi] = useState<KpiItem>({ totalValue: 0, totalItems: 0, currency: 'CNY' });
    const [chinaDailyNetFlow, setChinaDailyNetFlow] = useState<NetFlowItem[]>([]);
    const [chinaDisplayNetFlow, setChinaDisplayNetFlow] = useState<NetFlowItem[]>([]);
    const [chinaTimeGroup, setChinaTimeGroup] = useState<TimeGroup>('Daily');
    const [singaporeKpi, setSingaporeKpi] = useState<KpiItem>({ totalValue: 0, totalItems: 0, currency: 'SGD' });
    const [singaporeDailyNetFlow, setSingaporeDailyNetFlow] = useState<NetFlowItem[]>([]);
    const [singaporeDisplayNetFlow, setSingaporeDisplayNetFlow] = useState<NetFlowItem[]>([]);
    const [singaporeTimeGroup, setSingaporeTimeGroup] = useState<TimeGroup>('Daily');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDataAndProcess = async () => {
            try {
                setLoading(true);
                const SPREADSHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SPREADSHEET_ID;
                const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY;
                if (!SPREADSHEET_ID || !API_KEY) {
                    throw new Error("API Key or Spreadsheet ID is missing in .env.local");
                }

                const sheetNames = { inventory: 'Inventory', inbound: 'Inbound', outbound: 'Outbound' };
                const buildUrl = (sheetName: string) => `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${sheetName}?key=${API_KEY}`;

                const responses = await Promise.all([
                    fetch(buildUrl(sheetNames.inventory)),
                    fetch(buildUrl(sheetNames.inbound)),
                    fetch(buildUrl(sheetNames.outbound)),
                ]);

                for (const response of responses) {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Failed to fetch from ${response.url}: ${errorData.error.message}`);
                    }
                }

                const [inventoryJson, inboundJson, outboundJson] = await Promise.all(responses.map(res => res.json()));

                const fetchedInventory = transformSheetData<InventoryItem>(inventoryJson.values);
                const fetchedInbound = transformSheetData<InboundItem>(inboundJson.values);
                const fetchedOutbound = transformSheetData<OutboundItem>(outboundJson.values);

                const chinaInventory = fetchedInventory.filter(i => i.PLANT_NAME === 'CHINA-WAREHOUSE');
                const chinaInbound = fetchedInbound.filter(i => i.PLANT_NAME === 'CHINA-WAREHOUSE');
                const chinaOutbound = fetchedOutbound.filter(i => i.PLANT_NAME === 'CHINA-WAREHOUSE');
                
                const singaporeInventory = fetchedInventory.filter(i => i.PLANT_NAME === 'SINGAPORE-WAREHOUSE');
                const singaporeInbound = fetchedInbound.filter(i => i.PLANT_NAME === 'SINGAPORE-WAREHOUSE');
                const singaporeOutbound = fetchedOutbound.filter(i => i.PLANT_NAME === 'SINGAPORE-WAREHOUSE');

                setChinaKpi({
                    totalValue: chinaInventory.reduce((sum, item) => sum + item.STOCK_SELL_VALUE, 0),
                    totalItems: chinaInventory.reduce((sum, item) => sum + item.UNRESTRICTED_STOCK, 0),
                    currency: chinaInventory[0]?.CURRENCY || 'CNY'
                });
                const chinaMovements = new Map<string, { Inbound: number, Outbound: number }>();
                chinaInbound.forEach(item => {
                    const dateKey = new Date(item.INBOUND_DATE).toISOString().split('T')[0];
                    const entry = chinaMovements.get(dateKey) || { Inbound: 0, Outbound: 0 };
                    entry.Inbound += item.NET_QUANTITY_MT;
                    chinaMovements.set(dateKey, entry);
                });
                chinaOutbound.forEach(item => {
                    const dateKey = new Date(item.OUTBOUND_DATE).toISOString().split('T')[0];
                    const entry = chinaMovements.get(dateKey) || { Inbound: 0, Outbound: 0 };
                    entry.Outbound += item.NET_QUANTITY_MT;
                    chinaMovements.set(dateKey, entry);
                });
                setChinaDailyNetFlow(Array.from(chinaMovements.entries())
                    .map(([date, values]) => ({ date, ...values, NetFlow: values.Inbound - values.Outbound }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

                setSingaporeKpi({
                    totalValue: singaporeInventory.reduce((sum, item) => sum + item.STOCK_SELL_VALUE, 0),
                    totalItems: singaporeInventory.reduce((sum, item) => sum + item.UNRESTRICTED_STOCK, 0),
                    currency: singaporeInventory[0]?.CURRENCY || 'SGD'
                });
                const singaporeMovements = new Map<string, { Inbound: number, Outbound: number }>();
                singaporeInbound.forEach(item => {
                    const dateKey = new Date(item.INBOUND_DATE).toISOString().split('T')[0];
                    const entry = singaporeMovements.get(dateKey) || { Inbound: 0, Outbound: 0 };
                    entry.Inbound += item.NET_QUANTITY_MT;
                    singaporeMovements.set(dateKey, entry);
                });
                singaporeOutbound.forEach(item => {
                    const dateKey = new Date(item.OUTBOUND_DATE).toISOString().split('T')[0];
                    const entry = singaporeMovements.get(dateKey) || { Inbound: 0, Outbound: 0 };
                    entry.Outbound += item.NET_QUANTITY_MT;
                    singaporeMovements.set(dateKey, entry);
                });
                setSingaporeDailyNetFlow(Array.from(singaporeMovements.entries())
                    .map(([date, values]) => ({ date, ...values, NetFlow: values.Inbound - values.Outbound }))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

            } catch (err) {
                setError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };
        fetchDataAndProcess();
    }, []);

    useEffect(() => {
        if (!chinaDailyNetFlow.length && !loading) {
            setChinaDisplayNetFlow([]);
            return;
        };
        const groupData = (data: NetFlowItem[], groupBy: TimeGroup): NetFlowItem[] => {
            if (groupBy === 'Daily') return data;
            const getGroupKey = (dateStr: string): string => {
                const date = new Date(dateStr);
                if (groupBy === 'Weekly') {
                    const day = date.getUTCDay();
                    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
                    return new Date(date.setUTCDate(diff)).toISOString().split('T')[0];
                }
                return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
            };
            const grouped = data.reduce((acc, item) => {
                const key = getGroupKey(item.date);
                if (!acc[key]) acc[key] = { date: key, Inbound: 0, Outbound: 0, NetFlow: 0 };
                acc[key].Inbound += item.Inbound;
                acc[key].Outbound += item.Outbound;
                acc[key].NetFlow += item.NetFlow;
                return acc;
            }, {} as { [key: string]: NetFlowItem });
            return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        };
        setChinaDisplayNetFlow(groupData(chinaDailyNetFlow, chinaTimeGroup));
    }, [chinaDailyNetFlow, chinaTimeGroup, loading]);

    useEffect(() => {
        if (!singaporeDailyNetFlow.length && !loading) {
            setSingaporeDisplayNetFlow([]);
            return;
        }
        const groupData = (data: NetFlowItem[], groupBy: TimeGroup): NetFlowItem[] => {
            if (groupBy === 'Daily') return data;
            const getGroupKey = (dateStr: string): string => {
                const date = new Date(dateStr);
                if (groupBy === 'Weekly') {
                    const day = date.getUTCDay();
                    const diff = date.getUTCDate() - day + (day === 0 ? -6 : 1);
                    return new Date(date.setUTCDate(diff)).toISOString().split('T')[0];
                }
                return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
            };
            const grouped = data.reduce((acc, item) => {
                const key = getGroupKey(item.date);
                if (!acc[key]) acc[key] = { date: key, Inbound: 0, Outbound: 0, NetFlow: 0 };
                acc[key].Inbound += item.Inbound;
                acc[key].Outbound += item.Outbound;
                acc[key].NetFlow += item.NetFlow;
                return acc;
            }, {} as { [key: string]: NetFlowItem });
            return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        };
        setSingaporeDisplayNetFlow(groupData(singaporeDailyNetFlow, singaporeTimeGroup));
    }, [singaporeDailyNetFlow, singaporeTimeGroup, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex flex-col items-center justify-center text-white font-['Prompt']">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg tracking-wider">
                    Loading Data...
                </p>
            </div>
        );
    }
    if (error) return <div className="min-h-screen bg-[#121212] text-red-500 flex items-center justify-center p-4 text-center">Error: {error}</div>;

    const NetFlowChart = ({ data, isMobile }: { data: NetFlowItem[], isMobile: boolean }) => (
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorNetFlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.8}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333"/>
                    <XAxis dataKey="date" stroke="#888" fontSize={isMobile ? 10 : 12} />
                    <YAxis stroke="#888" fontSize={isMobile ? 10 : 12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid #333' }}/>
                    <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px', paddingTop: '10px' }} />
                    <ReferenceLine y={0} stroke="#fff" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="NetFlow" stroke="#888" fillOpacity={1} fill="url(#colorNetFlow)" />
                    <Line type="monotone" dataKey="Inbound" stroke="#22c55e" dot={false} />
                    <Line type="monotone" dataKey="Outbound" stroke="#ef4444" dot={false} />
                </AreaChart>
            </ResponsiveContainer>
    );

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#121212] text-white p-4 md:p-8 font-['Prompt']">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Master Dashboard</h1>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-[#1E1E1E] border border-[#333333] rounded-lg text-sm hover:bg-[#2a2a2a] transition-colors"
                    >
                        Back to Home
                    </Link>
        </header>

            <div className="space-y-12">
                <section>
                    <h2 className="text-xl md:text-2xl font-semibold text-white border-b border-gray-700 pb-2 mb-6">🇨🇳 China Warehouse</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <Card title="Total Inventory Value"><p className="text-2xl md:text-3xl font-bold text-green-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: chinaKpi.currency }).format(chinaKpi.totalValue)}</p></Card>
                        <Card title="Total Stock Units"><p className="text-2xl md:text-3xl font-bold">{chinaKpi.totalItems.toLocaleString()}</p></Card>
                        <Card title="Avg. Lead Time"><p className="text-2xl md:text-3xl font-bold">18 Days</p></Card>
                        <Card title="Warehouse Capacity"><p className="text-2xl md:text-3xl font-bold">82%</p></Card>
                        <Card title="Net Inventory Flow (MT)" className="col-span-1 md:col-span-2 lg:col-span-4">
                            <TimeGroupToggle selected={chinaTimeGroup} onSelect={setChinaTimeGroup} />
                            <NetFlowChart data={chinaDisplayNetFlow} isMobile={isMobile} />
                        </Card>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl md:text-2xl font-semibold text-white border-b border-gray-700 pb-2 mb-6">🇸🇬 Singapore Warehouse</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            <Card title="Total Inventory Value"><p className="text-2xl md:text-3xl font-bold text-green-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: singaporeKpi.currency }).format(singaporeKpi.totalValue)}</p></Card>
                            <Card title="Total Stock Units"><p className="text-2xl md:text-3xl font-bold">{singaporeKpi.totalItems.toLocaleString()}</p></Card>
                            <Card title="Avg. Lead Time"><p className="text-2xl md:text-3xl font-bold">12 Days</p></Card>
                            <Card title="Warehouse Capacity"><p className="text-2xl md:text-3xl font-bold">78%</p></Card>
                            <Card title="Net Inventory Flow (MT)" className="col-span-1 md:col-span-2 lg:col-span-4">
                                <TimeGroupToggle selected={singaporeTimeGroup} onSelect={setSingaporeTimeGroup} />
                                <NetFlowChart data={singaporeDisplayNetFlow} isMobile={isMobile} />
                            </Card>
                    </div>
                </section>
            </div>
        </div>
    );
}