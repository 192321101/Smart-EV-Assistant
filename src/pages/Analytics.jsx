import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { 
  Leaf, 
  Coins, 
  Zap, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Clock, 
  FileText, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import api from '../services/api';
import { useTelemetry } from '../context/TelemetryContext';

export default function Analytics() {
  const { telemetry, activeSession, socket } = useTelemetry() || {};
  
  // Weekly energy telemetry
  const [chartData, setChartData] = React.useState([
    { name: 'Mon', energy: 12, cost: 180, co2: 8 },
    { name: 'Tue', energy: 24, cost: 360, co2: 15 },
    { name: 'Wed', energy: 18, cost: 270, co2: 12 },
    { name: 'Thu', energy: 35, cost: 525, co2: 22 },
    { name: 'Fri', energy: 15, cost: 225, co2: 10 },
    { name: 'Sat', energy: 42, cost: 650, co2: 28 },
    { name: 'Sun', energy: 20, cost: 300, co2: 14 }
  ]);
  const [totalKwh, setTotalKwh] = React.useState(166);
  const [totalCost, setTotalCost] = React.useState(2785);
  const [totalCo2, setTotalCo2] = React.useState(109);
  const [fuelSavingsIce, setFuelSavingsIce] = React.useState(5847);
  const [history, setHistory] = React.useState([]);
  const [efficiencyData, setEfficiencyData] = React.useState([]);
  const [avgEfficiency, setAvgEfficiency] = React.useState(165);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchAnalytics = async () => {
    try {
      const [energyRes, spendingRes, co2Res, historyRes, efficiencyRes] = await Promise.all([
        api.get('/analytics/energy'),
        api.get('/analytics/spending'),
        api.get('/analytics/co2'),
        api.get('/analytics/history'),
        api.get('/analytics/efficiency')
      ]);

      const energyData = energyRes.data;
      const spendingData = spendingRes.data;
      const co2Data = co2Res.data;
      const historyData = historyRes.data.history || [];
      const efficiencyResult = efficiencyRes.data || { data: [], average_wh_km: 165 };

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const merged = days.map((day, idx) => {
        const energyVal = energyData.data[idx] || 0;
        const spendingObj = spendingData.history.find(h => h.label === day) || { cost: 0 };
        const costVal = spendingObj.cost;
        const co2Val = Math.round(energyVal * 0.8 * 10) / 10;
        return {
          name: day,
          energy: energyVal,
          cost: costVal,
          co2: co2Val
        };
      });

      setChartData(merged);
      setTotalKwh(energyData.total_kwh);
      setTotalCost(spendingData.total_spent);
      setTotalCo2(co2Data.co2_saved_kg);
      setFuelSavingsIce(Math.round(energyData.total_kwh * 6.5 * 8) - spendingData.total_spent);
      setHistory(historyData);
      setAvgEfficiency(efficiencyResult.average_wh_km);

      const efficiencyList = days.map((day, idx) => ({
        name: day,
        efficiency: efficiencyResult.data[idx] || 165
      }));
      setEfficiencyData(efficiencyList);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err.message);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  // Recalculate stats dynamically in real-time if a charging session is actively running
  const displayKwh = React.useMemo(() => totalKwh + (telemetry?.kwhCharged || 0), [totalKwh, telemetry]);
  const displayCost = React.useMemo(() => totalCost + Math.round(telemetry?.totalCost || 0), [totalCost, telemetry]);
  const displayCo2 = React.useMemo(() => Math.round((totalCo2 + (telemetry?.kwhCharged || 0) * 0.8) * 10) / 10, [totalCo2, telemetry]);
  const displaySavings = React.useMemo(() => Math.round(displayKwh * 6.5 * 8) - displayCost, [displayKwh, displayCost]);

  const displayChartData = React.useMemo(() => {
    if (!activeSession) return chartData;
    const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    return chartData.map(d => {
      if (d.name === currentDay) {
        return {
          ...d,
          energy: Math.round((d.energy + (telemetry?.kwhCharged || 0)) * 10) / 10,
          cost: d.cost + Math.round(telemetry?.totalCost || 0),
          co2: Math.round((d.co2 + (telemetry?.kwhCharged || 0) * 0.8) * 10) / 10
        };
      }
      return d;
    });
  }, [chartData, activeSession, telemetry]);

  const triggerRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-extrabold text-indigo-600 animate-pulse uppercase tracking-wider">Compiling Performance logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none">Analytics</h1>
          <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Energy telemetry tracking and environmental index meters
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSession && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] font-black text-emerald-600 animate-pulse uppercase">
              <Zap className="w-3 h-3 fill-emerald-600" />
              <span>Live Synced Charging</span>
            </span>
          )}
          <button
            onClick={triggerRefresh}
            disabled={refreshing}
            className={`p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total energy */}
        <div className="p-4 bg-white border border-slate-200/50 rounded-2xl text-left flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Zap className={`w-6 h-6 ${activeSession ? 'animate-bounce' : 'animate-pulse'}`} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Energy Drank</span>
            <span className="text-lg font-black text-slate-800">{displayKwh} kWh</span>
            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5"><TrendingUp className="w-3 h-3" /> +12% wk</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 bg-white border border-slate-200/50 rounded-2xl text-left flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Expenses</span>
            <span className="text-lg font-black text-slate-800">₹ {displayCost}</span>
            <span className="text-[9px] font-bold text-rose-500 flex items-center gap-0.5 mt-0.5"><TrendingDown className="w-3 h-3" /> -4% wk</span>
          </div>
        </div>

        {/* Carbon savings */}
        <div className="p-4 bg-white border border-slate-200/50 rounded-2xl text-left flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CO2 Offset</span>
            <span className="text-lg font-black text-slate-800">{displayCo2} kg</span>
            <span className="text-[9px] font-bold text-emerald-600 mt-0.5 block font-sans">
              Equiv. {Math.round(displayCo2 / 22)} Trees
            </span>
          </div>
        </div>

        {/* ICE fuel offset */}
        <div className="p-4 bg-white border border-slate-200/50 rounded-2xl text-left flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">ICE Fuel Savings</span>
            <span className="text-lg font-black text-slate-800">₹ {displaySavings}</span>
            <span className="text-[9px] font-bold text-indigo-600 mt-0.5 block font-sans">Compared to Petrol</span>
          </div>
        </div>
      </div>

      {/* Recharts Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel A: Energy Consumption curve */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Energy Consumed per Day (kWh)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '11px' }} />
                <Area type="monotone" dataKey="energy" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEnergy)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel B: Charging Expenses Bar Chart */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
            <Activity className="w-5 h-5 text-purple-600" />
            <span>Charging Costs (INR)</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '11px' }} />
                <Bar dataKey="cost" fill="#d946ef" radius={[8, 8, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel C: Vehicle Driving Efficiency */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 lg:col-span-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
              <Cpu className="w-5 h-5 text-emerald-500" />
              <span>Vehicle Efficiency</span>
            </h3>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-black text-emerald-600">
              Avg: {avgEfficiency} Wh/km
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={efficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', fontSize: '11px' }} />
                <Line type="monotone" dataKey="efficiency" stroke="#10b981" strokeWidth={3} dot={{ stroke: '#10b981', strokeWidth: 2, r: 3 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panel D: Charging Runs History Log */}
        <div className="glass-panel p-5 md:p-6 rounded-3xl border border-slate-200/50 text-left space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 leading-none">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <span>Completed Charging Runs Ledger</span>
          </h3>

          <div className="overflow-y-auto max-h-56 space-y-2.5 pr-1 font-sans">
            {history.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">No completed charging runs logged in telemetry database.</p>
              </div>
            ) : (
              history.map((h) => (
                <div key={h._id} className="p-3.5 bg-slate-50 border border-slate-200/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-100/50 transition-colors">
                  <div className="space-y-1">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-none">{h.stationName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold leading-tight">{h.stationAddress}</p>
                    <div className="flex items-center gap-3 text-[9px] font-extrabold text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {h.durationMins} mins
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-150/40 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Delivered</span>
                      <span className="text-xs font-black text-slate-800">{h.energyDelivered} kWh</span>
                    </div>
                    <div className="text-left sm:text-right border-l border-slate-205 border-slate-200 pl-4">
                      <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Cost</span>
                      <span className="text-xs font-black text-indigo-600">₹ {h.cost}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
