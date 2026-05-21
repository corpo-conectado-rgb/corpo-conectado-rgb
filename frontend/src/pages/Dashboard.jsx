import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Dumbbell, FileText, BarChart2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const barData = [
  { name: 'Jan', volume: 80000 },
  { name: 'Fev', volume: 75000 },
  { name: 'Mar', volume: 76000 },
  { name: 'Abr', volume: 17500 },
];

const pieData = [
  { name: 'Pernas', value: 46.74, fill: '#000000' },
  { name: 'Peito/Tríceps', value: 44.10, fill: '#0F172A' },
  { name: 'Costas/Bíceps', value: 5.00, fill: '#A1A1AA' },
  { name: 'Abdômen', value: 3.16, fill: '#E4E4E7' },
];

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      
      {/* Cabeçalho */}
      <header className="flex justify-between items-center mb-4 px-1">
        <h1 className="text-2xl md:text-3xl font-black text-[#000000] tracking-tight">Análise Executiva</h1>
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#000000] font-bold bg-[#F4F4F5] py-1.5 px-4 rounded-full cursor-pointer hover:bg-gray-200 transition">
          <span>Semana Atual: 2026</span>
          <ChevronDown size={14} className="ml-1" />
        </div>
      </header>

      {/* Faixa Noir (Sash) */}
      <div className="bg-[#000000] rounded-xl text-white py-3.5 px-6 flex flex-col md:flex-row items-center justify-between mb-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 w-full items-center justify-between">
          <div className="flex flex-col w-full md:w-auto">
            <span className="text-[9px] uppercase text-zinc-400 font-extrabold tracking-widest mb-1">Foco de Treino</span>
            <div className="bg-[#18181B] rounded-md px-3 py-1.5 text-xs font-bold flex items-center justify-between min-w-[180px] cursor-pointer border border-zinc-800 hover:bg-zinc-800 transition">
              <span>Hipertrofia</span>
              <ChevronDown size={12} className="ml-2" />
            </div>
          </div>
          
          <div className="flex flex-col text-center flex-1 justify-center w-full md:border-l md:border-[rgba(255,255,255,0.1)] px-4">
            <span className="text-[9px] uppercase text-zinc-400 font-extrabold tracking-widest mb-1">Escopo</span>
            <span className="font-extrabold text-xs tracking-wide text-zinc-200">Todos os Dados</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end w-full md:w-auto md:border-l md:border-[rgba(255,255,255,0.1)] md:pl-8">
            <span className="text-[9px] uppercase text-zinc-400 font-extrabold tracking-widest mb-1">Carga Exportada (Mensal)</span>
            <span className="text-xl md:text-2xl font-black text-white tracking-widest">17.500 <span className="text-xs font-medium text-zinc-400 ml-0.5">Kg</span></span>
          </div>
        </div>
      </div>

      {/* Cards de Acesso Rápido - Clean Design */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 px-1">
        <button onClick={() => navigate('/treinos')} className="bg-white border border-zinc-100 rounded-xl shadow-sm py-3 px-5 flex items-center gap-4 cursor-pointer group hover:shadow-md transition-all duration-200">
          <div className="p-2.5 bg-[#F4F4F5] rounded-full group-hover:bg-[#000000] group-hover:text-white transition-colors duration-300">
            <Dumbbell size={18} className="text-[#000000] group-hover:text-white" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="font-extrabold text-[#000000] text-sm">Treino Ativo</h3>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Ficha de exercícios</p>
          </div>
        </button>

        <button onClick={() => navigate('/anamnese')} className="bg-white border border-zinc-100 rounded-xl shadow-sm py-3 px-5 flex items-center gap-4 cursor-pointer group hover:shadow-md transition-all duration-200">
          <div className="p-2.5 bg-[#F4F4F5] rounded-full group-hover:bg-[#000000] group-hover:text-white transition-colors duration-300">
            <FileText size={18} className="text-[#000000] group-hover:text-white" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="font-extrabold text-[#000000] text-sm">Anamnese</h3>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Perfil morfológico</p>
          </div>
        </button>

        <button onClick={() => navigate('/progresso')} className="bg-white border border-zinc-100 rounded-xl shadow-sm py-3 px-5 flex items-center gap-4 cursor-pointer group hover:shadow-md transition-all duration-200">
          <div className="p-2.5 bg-[#F4F4F5] rounded-full group-hover:bg-[#000000] group-hover:text-white transition-colors duration-300">
            <BarChart2 size={18} className="text-[#000000] group-hover:text-white" />
          </div>
          <div className="flex flex-col text-left">
            <h3 className="font-extrabold text-[#000000] text-sm">Data Logs</h3>
            <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Histórico do sistema</p>
          </div>
        </button>
      </div>

      {/* Gráficos */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[220px] px-1 pb-2 overflow-hidden">
        <div className="flex-[3] bg-white border border-zinc-100 shadow-sm flex flex-col p-5 rounded-2xl overflow-hidden">
          <h2 className="text-[10px] font-black text-zinc-400 mb-4 uppercase tracking-widest">Volume (Kg)</h2>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F4F4F5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#A1A1AA', fontSize: 11, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#A1A1AA', fontSize: 11, fontWeight: 700}} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#FAFAFA'}}
                  contentStyle={{ backgroundColor: '#000000', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 700, padding: '8px 12px', fontSize: 12 }}
                  itemStyle={{color: 'white'}}
                  formatter={(value) => [`${value} Kg`, 'Carga']}
                />
                <Bar dataKey="volume" fill="#000000" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex-[2] bg-white border border-zinc-100 shadow-sm flex flex-col p-5 rounded-2xl overflow-hidden">
          <h2 className="text-[10px] font-black text-zinc-400 mb-3 uppercase tracking-widest">Grupamentos</h2>
          <div className="flex-1 w-full flex flex-col justify-between overflow-hidden">
            <div className="flex-1 min-h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    dataKey="value"
                    stroke="none"
                    paddingAngle={2}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000000', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 600, fontSize: 12 }}
                    itemStyle={{color: '#FFFFFF'}}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex gap-2.5 mt-2.5 flex-wrap justify-center">
              {pieData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm" style={{backgroundColor: item.fill}}></div>
                  <span className="text-[10px] text-zinc-500 font-bold tracking-wide">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
