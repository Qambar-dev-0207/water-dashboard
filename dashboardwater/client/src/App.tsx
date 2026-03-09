import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Droplet, 
  Activity, 
  Gauge, 
  History, 
  AlertTriangle, 
  RefreshCcw, 
  ChevronRight,
  Monitor,
  ArrowLeft,
  Settings,
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  X,
  Database,
  ChevronDown
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8003/api";
  axios.defaults.baseURL = API_URL;
axios.defaults.headers.common["Content-Type"] = "application/json";

// --- Types ---
interface Reading {
  pressure: number;
  height: number;
  volume: number;
  fillPercent: number;
  status: string;
  timestamp: string;
  forecast?: string;
}

interface TankConfig {
  tankHeight: number;
  tankRadius: number;
}

// --- Components ---

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative blurred shapes */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 translate-x-1/3 translate-y-1/3" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="skeuo-flat p-12 max-w-2xl w-full text-center space-y-10 relative z-10"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="inline-block skeuo-icon p-6 mb-4"
        >
          <Droplet className="w-12 h-12 text-[#4a90e2]" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-slate-800 tracking-tighter leading-none">
            Pure<span className="text-[#4a90e2]">Monitor</span> v2
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-md mx-auto">
            Industrial-grade water telemetry with real-time analytics and predictive forecasting for multiple tanks.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center pt-6">
          <button 
            onClick={() => navigate('/dashboard/1')}
            className="skeuo-button px-10 py-5 text-[#4a90e2] font-black text-lg flex items-center gap-3 hover:text-[#357abd] transition-all group active:scale-95"
          >
            Launch Console <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => navigate('/overview')}
            className="skeuo-button px-10 py-5 text-slate-500 font-black text-lg flex items-center gap-3 hover:text-slate-800 transition-all group active:scale-95"
          >
            Fleet Overview <Database className="w-5 h-5" />
          </button>
        </div>

        <div className="pt-10 flex justify-center gap-12 border-t border-slate-200/50">
          {[
            { label: "16 Tanks", icon: Database },
            { label: "Real-time", icon: Activity },
            { label: "IoT Ready", icon: Monitor }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
              <item.icon className="w-4 h-4" />
              {item.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { tankId } = useParams<{ tankId: string }>();
  const [currentStatus, setCurrentStatus] = useState<Reading | null>(null);
  const [history, setHistory] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [tempConfig, setTempConfig] = useState<TankConfig>({ tankHeight: 200, tankRadius: 50 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTankSelector, setShowTankSelector] = useState(false);
  
  const navigate = useNavigate();

  const fetchData = async () => {
    if (!tankId) return;
    setIsSyncing(true);
    try {
      const [statusRes, historyRes, configRes] = await Promise.all([
        axios.get(`status/${tankId}`),
        axios.get(`history/${tankId}`),
        axios.get(`config/${tankId}`)
      ]);
      setCurrentStatus(statusRes.data);
      setHistory(historyRes.data);
      setTempConfig(configRes.data);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const updateConfig = async () => {
    try {
      await axios.post(`config/${tankId}`, tempConfig);
      setShowSettings(false);
      fetchData();
    } catch (error) {
      console.error("Config update failed:", error);
    }
  };

  const exportCSV = () => {
    const headers = "Timestamp,Pressure,Height,Volume,FillPercent,Status\n";
    const rows = history.map(r => 
      `${r.timestamp},${r.pressure},${r.height},${r.volume},${r.fillPercent},${r.status}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tank-${tankId}-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [tankId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#4a90e2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 lg:p-10 max-w-7xl mx-auto space-y-10 font-sans">
      
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')}
            className="skeuo-button p-4 text-slate-400 hover:text-slate-600 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <div className="relative">
              <button 
                onClick={() => setShowTankSelector(!showTankSelector)}
                className="flex items-center gap-3 text-2xl font-black text-slate-800 tracking-tighter hover:text-blue-600 transition-colors"
              >
                Tank Node {tankId?.padStart(2, '0')} <ChevronDown className={`w-6 h-6 transition-transform ${showTankSelector ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showTankSelector && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-4 z-50 skeuo-flat p-4 grid grid-cols-4 gap-2 w-72"
                  >
                    {Array.from({ length: 16 }, (_, i) => i + 1).map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          navigate(`/dashboard/${id}`);
                          setShowTankSelector(false);
                        }}
                        className={`p-3 text-[10px] font-black rounded-xl transition-all ${
                          tankId === String(id) 
                            ? 'skeuo-pressed text-blue-600' 
                            : 'skeuo-button text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {String(id).padStart(2, '0')}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-500 animate-pulse' : 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]'}`} />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {isSyncing ? 'Synchronizing Data...' : `Terminal Node ${tankId}: Nominal`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/overview')} className="skeuo-button p-4 text-slate-500 hover:text-blue-600 flex items-center gap-2 px-6">
            <Database className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Fleet Overview</span>
          </button>
          <button onClick={exportCSV} className="skeuo-button p-4 text-slate-500 hover:text-blue-600 group relative">
            <Download className="w-5 h-5" />
            <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Export CSV</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="skeuo-button p-4 text-slate-500 hover:text-blue-600">
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={fetchData} className="skeuo-button p-4 text-slate-500 hover:text-[#4a90e2]">
            <RefreshCcw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left Section - Visualizer & Quick Stats */}
        <div className="lg:col-span-5 space-y-8">
          <Tilt tiltMaxAngleX={2} tiltMaxAngleY={2} perspective={1500}>
            <section className="skeuo-flat p-12 flex flex-col items-center relative overflow-hidden group">
              <div className="absolute top-4 left-4 p-3 skeuo-icon opacity-40 group-hover:opacity-100 transition-opacity">
                <Database className="w-4 h-4 text-slate-500" />
              </div>
              
              <div className="skeuo-pressed w-40 h-72 p-3 relative rounded-[40px] mb-10">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${currentStatus?.fillPercent}%` }}
                  transition={{ type: 'spring', damping: 20, stiffness: 40 }}
                  className="absolute bottom-3 left-3 right-3 skeuo-fill flex items-center justify-center overflow-hidden"
                  style={{ maxHeight: 'calc(100% - 24px)' }}
                >
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="w-full h-8 bg-white/10 blur-md absolute top-0"
                  />
                </motion.div>
              </div>

              <div className="text-center space-y-1">
                <motion.p 
                  key={currentStatus?.fillPercent}
                  initial={{ scale: 1.1, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-black text-slate-800 tracking-tighter"
                >
                  {currentStatus?.fillPercent}%
                </motion.p>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Node {tankId} Capacity</p>
              </div>

              {/* Status & Forecast Pill */}
              <div className="mt-8 flex gap-3">
                <div className={`px-4 py-2 skeuo-flat flex items-center gap-2 ${
                  currentStatus?.status === 'Disconnected' ? 'text-slate-400' : 
                  currentStatus?.status === 'Critical' ? 'text-red-500' : 'text-blue-600'
                }`}>
                   <span className={`w-1.5 h-1.5 rounded-full bg-current ${currentStatus?.status !== 'Disconnected' ? 'shadow-lg' : ''}`} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{currentStatus?.status}</span>
                </div>
                <div className="px-4 py-2 skeuo-flat flex items-center gap-2 text-slate-500">
                   {currentStatus?.forecast === 'Decreasing' ? <TrendingDown className="w-3 h-3 text-orange-500" /> : 
                    currentStatus?.forecast === 'Filling' ? <TrendingUp className="w-3 h-3 text-green-500" /> : 
                    <Minus className="w-3 h-3" />}
                   <span className="text-[10px] font-black uppercase tracking-widest">
                     {currentStatus?.status === 'Disconnected' ? 'N/A' : (currentStatus?.forecast || 'Stable')}
                   </span>
                </div>
              </div>
            </section>
          </Tilt>

          <div className="grid grid-cols-2 gap-6">
            <div className="skeuo-flat p-8 flex flex-col items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-3xl font-black text-slate-800 leading-none">{currentStatus?.pressure}</p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pressure (kPa)</p>
            </div>
            <div className="skeuo-flat p-8 flex flex-col items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-3xl font-black text-slate-800 leading-none">{currentStatus?.volume}</p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Est. Volume (L)</p>
            </div>
          </div>
        </div>

        {/* Right Section - Charts & Logs */}
        <div className="lg:col-span-7 space-y-10">
          
          {/* Main Trend Section */}
          <section className="skeuo-flat p-10 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-500" /> Hydro-Trend 24H (Node {tankId})
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">Capacity %</span>
                 </div>
              </div>
            </div>
            
            <div className="flex-1 w-full skeuo-pressed p-6 overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4a90e2" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4a90e2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '20px', 
                      border: 'none', 
                      boxShadow: '10px 10px 20px #d1d9e6, -10px -10px 20px #ffffff',
                      backgroundColor: '#f0f2f5',
                      fontSize: '10px',
                      fontFamily: 'Inter',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="fillPercent" 
                    stroke="#4a90e2" 
                    strokeWidth={4}
                    fill="url(#colorFill)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Pressure Graph */}
            <section className="skeuo-flat p-8 h-[300px] flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <Gauge className="w-4 h-4 text-blue-500" /> Pressure Analysis
              </h3>
              <div className="flex-1 w-full skeuo-pressed p-4 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '15px', border: 'none', backgroundColor: '#f0f2f5', fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <Area type="stepAfter" dataKey="pressure" stroke="#8b5cf6" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Volume Graph */}
            <section className="skeuo-flat p-8 h-[300px] flex flex-col">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-green-500" /> Volume Volatility
              </h3>
              <div className="flex-1 w-full skeuo-pressed p-4 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '15px', border: 'none', backgroundColor: '#f0f2f5', fontSize: '9px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {/* Event Stream */}
          <section className="skeuo-flat p-10 flex flex-col h-[350px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <History className="w-4 h-4 text-blue-500" /> Node {tankId} Events
              </h3>
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{history.length} Signals Captured</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-2 custom-scroll">
              <AnimatePresence initial={false}>
                {history.slice().reverse().map((entry) => (
                  <motion.div 
                    key={entry.timestamp}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 skeuo-pressed text-[11px] font-bold text-slate-500 group hover:text-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300 tabular-nums">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="w-px h-3 bg-slate-200" />
                      <span className="text-slate-700">{entry.fillPercent}% Fill</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-400 font-medium">{entry.pressure} kPa</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        entry.status === 'Critical' ? 'bg-red-400 animate-pulse shadow-[0_0_5px_red]' : 'bg-blue-400'
                      }`} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-500/20 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="skeuo-flat p-10 w-full max-md space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">Node {tankId} Config</h3>
                <button onClick={() => setShowSettings(false)} className="skeuo-button p-2 text-slate-400 hover:text-red-500"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tank Height (cm)</label>
                  <input 
                    type="number" 
                    value={tempConfig.tankHeight}
                    onChange={(e) => setTempConfig({...tempConfig, tankHeight: parseFloat(e.target.value)})}
                    className="w-full p-4 skeuo-pressed outline-none font-bold text-slate-700"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tank Radius (cm)</label>
                  <input 
                    type="number" 
                    value={tempConfig.tankRadius}
                    onChange={(e) => setTempConfig({...tempConfig, tankRadius: parseFloat(e.target.value)})}
                    className="w-full p-4 skeuo-pressed outline-none font-bold text-slate-700"
                  />
                </div>
              </div>

              <button 
                onClick={updateConfig}
                className="w-full skeuo-button py-5 text-blue-600 font-black uppercase tracking-[0.2em] text-sm"
              >
                Update Node {tankId}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="text-center pb-10">
        <div className="skeuo-flat inline-flex items-center gap-8 px-10 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-blue-500" /> Active Nodes: 16</span>
          <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-green-500" /> Status: Encrypted</span>
          <span>© 2026 PureMonitor Industrial</span>
        </div>
      </footer>

      <AnimatePresence>
        {currentStatus?.status === 'Critical' && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 100 }} 
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[60]"
          >
            <div className="skeuo-flat px-10 py-5 bg-red-50 border border-red-100 flex items-center gap-5 shadow-2xl">
              <div className="p-3 skeuo-icon text-red-500">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <p className="font-black text-red-700 text-sm uppercase tracking-tight">Node {tankId} Critical</p>
                <p className="text-[10px] text-red-500/60 font-bold uppercase tracking-widest">Immediate Refill Required</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FleetOverview = () => {
  const [fleetStatus, setFleetStatus] = useState<Record<string, Reading>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFleet = async () => {
    try {
      const res = await axios.get(`fleet/status`);
      console.log("Fleet Update Received:", res.data);
      setFleetStatus(res.data);
    } catch (err) {
      console.error("Fleet fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#4a90e2] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-6 lg:p-10 max-w-7xl mx-auto space-y-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="skeuo-button p-4 text-slate-400 hover:text-slate-600 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Fleet Overview</h2>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Global Monitoring System</p>
          </div>
        </div>
        <div className="skeuo-flat px-6 py-4 flex items-center gap-3">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">16 Active Nodes</span>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
        {Array.from({ length: 16 }, (_, i) => i + 1).map((id) => {
          // Robust check for both string and number keys
          const status = fleetStatus[id] || fleetStatus[String(id)];
          return (
            <motion.div 
              key={id}
              whileHover={{ y: -5 }}
              onClick={() => navigate(`/dashboard/${id}`)}
              className="skeuo-flat p-6 flex flex-col items-center gap-6 cursor-pointer group"
            >
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Tank {String(id).padStart(2, '0')}</div>
              
              <div className="skeuo-pressed w-16 h-28 p-1.5 relative rounded-[20px] overflow-hidden">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${status?.fillPercent || 0}%` }}
                  className="absolute bottom-1.5 left-1.5 right-1.5 skeuo-fill"
                  style={{ maxHeight: 'calc(100% - 12px)' }}
                />
              </div>

              <div className="text-center">
                <p className="text-xl font-black text-slate-800 tracking-tight">{status?.fillPercent?.toFixed(0) || 0}%</p>
                <div className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${
                  status?.status === 'Critical' ? 'text-red-500' : 
                  status?.status === 'Disconnected' ? 'text-slate-300' : 'text-blue-500'
                }`}>
                  {status?.status || 'Offline'}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/overview" element={<FleetOverview />} />
        <Route path="/dashboard/:tankId" element={<Dashboard />} />
        {/* Redirect old dashboard to dashboard/1 */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

const DashboardRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard/1');
  }, []);
  return null;
};

export default App;
