import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, ArrowLeft, ArrowRight, Dumbbell, Target, User, Activity, Flame, ShieldAlert, Timer, MapPin, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';

function calcularIdade(dataNascimento) {
  if (!dataNascimento) return null;
  const partes = dataNascimento.split('-');
  if (partes.length !== 3) return null;

  const anoNasc = parseInt(partes[0], 10);
  const mesNasc = parseInt(partes[1], 10) - 1;
  const diaNasc = parseInt(partes[2], 10);

  const hoje = new Date();
  const dataNascObj = new Date(anoNasc, mesNasc, diaNasc);

  let idade = hoje.getFullYear() - dataNascObj.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();

  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--;
  }

  return idade >= 0 ? idade : 0;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { registerFull } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false); // Flag da microinteração de finalização
  
  // UX: Loading Phrase Array e Animators
  const loadingPhrases = [
    "Criando sua conta...",
    "Montando seu perfil para entregar recomendações precisas...",
    "Preparando seu ambiente de treino...",
    "Personalizando sua experiência...",
    "Quase tudo pronto para começar sua evolução..."
  ];
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    let phraseInterval;
    let progressTimer;
    if (loading && !success) {
      setFakeProgress(10);
      phraseInterval = setInterval(() => {
        setLoadingPhraseIndex(prev => (prev + 1) % loadingPhrases.length);
      }, 2500);

      progressTimer = setInterval(() => {
        setFakeProgress(prev => {
          if (prev >= 95) return 95;
          return prev + Math.random() * 8;
        });
      }, 300);
    }
    return () => {
      clearInterval(phraseInterval);
      clearInterval(progressTimer);
    };
  }, [loading, success]);
  
  // States para visibilidade visual de senha
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mega-State de Formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    data_nascimento: '',
    altura: '',
    peso: '',
    sexo: '',
    objetivo: '',
    nivel: '',
    lesoes: '',
    habitos_freq: '',
    habitos_tempo: '',
    habitos_local: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelect = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const adjustNumberField = (field, amount, min = 0) => {
    const currentVal = parseFloat(String(formData[field]).replace(',', '.')) || 0;
    let newVal = currentVal + amount;
    if (newVal < min) newVal = min;
    
    // Reduz o arredondamento pra 2 casas
    // Remove os zeros desnecessários no final, ex: 75.50 -> 75.5
    setFormData({ ...formData, [field]: Number(newVal.toFixed(2)).toString() });
  };

  // Conversor Universal Ponto/Vírgula pro FrontEnd
  const handleMaskChange = (e, field) => {
    let val = e.target.value;
    
    // Peso e Altura: aceitam ponto e virgula. Converte virgulas em pontos transparentemente.
    val = val.replace(/,/g, '.');
    const parts = val.split('.');
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('');
    }
    val = val.replace(/[^0-9.]/g, ''); 
    
    setFormData({ ...formData, [field]: val });
  };

  // Auto-Formatação ao sair do campo (Blur)
  const handleBlurFix = (field) => {
    let raw = formData[field];
    if (!raw) return;

    let val = parseFloat(String(raw).replace(',', '.'));
    if (isNaN(val)) return;

    if (field === 'altura') {
      // Se digitou em centímetros (ex: 168, 175, 180), converte para metros (1.68)
      if (val >= 10) val = val / 100;
    } else if (field === 'peso') {
      // Se digitou algo absurdo sem virgula como "705", interpreta-se "70.5"
      // Maioria dos adultos pesa menos de 300kg, se for mais, provavelmente esqueceu a vírgula de 1 casa decimal.
      if (val >= 300) val = val / 10;
    }

    // Salva o numeral em String com ponto como manda a nossa arquitetura
    setFormData(prev => ({ ...prev, [field]: Number(val.toFixed(2)).toString() }));
  };

  // Validações por Etapa
  const nextStep = () => {
    setError('');
    
    if (step === 1) {
      if (!formData.nome || !formData.email || !formData.senha || !formData.confirmarSenha) {
        return setError('Preencha as credenciais primárias para avançar.');
      }
      if (formData.senha !== formData.confirmarSenha) {
        return setError('As senhas não coincidem.');
      }
      if (formData.senha.length < 6) {
        return setError('Sua senha deve ter no mínimo 6 caracteres.');
      }
    }

    if (step === 2) {
      if (!formData.data_nascimento || !formData.altura || !formData.peso) {
        return setError('Preencha os dados biométricos básicos.');
      }
      const idadeCalc = calcularIdade(formData.data_nascimento);
      if (idadeCalc === null || idadeCalc < 10 || idadeCalc > 100) {
        return setError('Data de nascimento inválida (idade deve ser entre 10 e 100 anos).');
      }
    }

    if (step === 3 && !formData.objetivo) return setError('Selecione um objetivo primário.');
    if (step === 4 && !formData.nivel) return setError('Selecione seu nível fisiológico atual.');

    // Rola a tela para o topo maciamente e avança
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(s => s - 1);
  };

  const submitForm = async () => {
    setLoading(true);
    setLoadingPhraseIndex(0);
    setFakeProgress(0);
    setError('');
    const startTime = Date.now();

    try {
      const result = await registerFull(formData);
      
      const elapsedTime = Date.now() - startTime;
      const minimumLoadingTime = 3500;
      
      if (elapsedTime < minimumLoadingTime) {
        await new Promise(r => setTimeout(r, minimumLoadingTime - elapsedTime));
      }

      setFakeProgress(100);
      await new Promise(r => setTimeout(r, 400));

      if (result && result.requiresActivation) {
        // Redireciona para o login para mostrar a tela de ativação
        navigate('/login', { state: { email: formData.email, requiresActivation: true, activationCode: result.activationCode } });
        return;
      }

      // Engatilha Sucesso UI + Disparo de Confete Dark
      setSuccess(true);
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#000000', '#111827', '#E5E7EB', '#FFFFFF'],
        disableForReducedMotion: true
      });

      // Aguarda 4200ms para leitura
      setTimeout(() => {
        navigate('/');
      }, 4200);

    } catch (err) {
      setError(err.message || 'Falha ao processar o Onboarding. Tente novamente.');
      setStep(1); // Retorna em caso de falha severa
    } finally {
      setLoading(false);
    }
  };

  /* Renderizadores de Etapa (Renderers) */
  const renderStepProgressBar = () => {
    const totalSteps = 6;
    const progress = (step / totalSteps) * 100;
    
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
          <span>{step === 6 ? 'Finalizando...' : `Fase ${step}`}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStep1_Account = () => (
    <div className="animate-fade-in space-y-3">
      <div className="mb-4 text-center">
        <User className="mx-auto text-white mb-2" size={24} />
        <h2 className="text-lg font-black text-white leading-tight">Crie sua Conta</h2>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
        <input name="nome" value={formData.nome} onChange={handleChange} className="input-glass w-full" placeholder="Ex: João Silva" />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail</label>
        <input name="email" value={formData.email} onChange={handleChange} type="email" className="input-glass w-full" placeholder="seuemail@exemplo.com" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Senha</label>
          <div className="relative">
            <input 
              name="senha" 
              value={formData.senha} 
              onChange={handleChange} 
              type={showPassword ? "text" : "password"} 
              className="input-glass w-full pr-10" 
              placeholder="••••••••" 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Confirmar</label>
          <div className="relative">
            <input 
              name="confirmarSenha" 
              value={formData.confirmarSenha} 
              onChange={handleChange} 
              type={showConfirmPassword ? "text" : "password"} 
              className="input-glass w-full pr-10" 
              placeholder="••••••••" 
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white transition"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2_Bio = () => (
    <div className="animate-fade-in space-y-5">
      <div className="mb-4 text-center">
        <Activity className="mx-auto text-white mb-2" size={24} />
        <h2 className="text-lg font-black text-white leading-tight">Biometria</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Data Nasc.</label>
          <div className="relative flex flex-col justify-center border border-white/5 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors bg-black/20 px-3 h-[46px]">
            <input 
              name="data_nascimento" 
              value={formData.data_nascimento} 
              onChange={handleChange} 
              type="date" 
              className="w-full bg-transparent border-0 text-center font-bold text-[13px] text-white focus:ring-0 p-0 outline-none [color-scheme:dark]" 
            />
          </div>
          {formData.data_nascimento && (
            <p className="text-[10px] text-gray-400 font-bold mt-1.5 text-center">
              Idade: <span className="text-white">{calcularIdade(formData.data_nascimento)} anos</span>
            </p>
          )}
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Gênero</label>
          <div className="flex bg-black/30 border border-white/5 p-1 rounded-xl h-[46px]">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleSelect('sexo', 'Masculino'); }}
              className={`flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-lg transition-all
                ${formData.sexo === 'Masculino' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Masc
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); handleSelect('sexo', 'Feminino'); }}
              className={`flex-1 flex items-center justify-center text-[11px] font-black uppercase tracking-wider rounded-lg transition-all
                ${formData.sexo === 'Feminino' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              Fem
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 w-full overflow-hidden text-ellipsis whitespace-nowrap">Altura <span className="text-gray-500 lowercase text-[9px]">(m)</span></label>
          <div className="relative flex items-center border border-white/5 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors bg-black/20">
            <button type="button" onClick={(e) => { e.preventDefault(); adjustNumberField('altura', -0.01, 0.5); }} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center font-black transition-colors w-10 active:bg-white/10">−</button>
            <input name="altura" value={String(formData.altura).replace('.', ',')} onChange={(e) => handleMaskChange(e, 'altura')} onBlur={() => handleBlurFix('altura')} type="text" inputMode="decimal" className="flex-1 w-full bg-transparent border-0 text-center font-black text-white focus:ring-0 p-0 h-[42px] outline-none" placeholder="1,75" />
            <button type="button" onClick={(e) => { e.preventDefault(); adjustNumberField('altura', 0.01, 0.5); }} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center font-black transition-colors w-10 active:bg-white/10">+</button>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1 w-full overflow-hidden text-ellipsis whitespace-nowrap">Peso <span className="text-gray-500 lowercase text-[9px]">(kg)</span></label>
          <div className="relative flex items-center border border-white/5 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors bg-black/20">
            <button type="button" onClick={(e) => { e.preventDefault(); adjustNumberField('peso', -0.5, 20); }} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center font-black transition-colors w-10 active:bg-white/10">−</button>
            <input name="peso" value={String(formData.peso).replace('.', ',')} onChange={(e) => handleMaskChange(e, 'peso')} onBlur={() => handleBlurFix('peso')} type="text" inputMode="decimal" className="flex-1 w-full bg-transparent border-0 text-center font-black text-white focus:ring-0 p-0 h-[42px] outline-none" placeholder="70,5" />
            <button type="button" onClick={(e) => { e.preventDefault(); adjustNumberField('peso', 0.5, 20); }} className="px-3 py-2 text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center font-black transition-colors w-10 active:bg-white/10">+</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3_Target = () => {
    const targets = [
      { id: 'Emagrecimento', title: 'Emagrecimento', icon: Flame, desc: 'Perda de gordura corporal' },
      { id: 'Hipertrofia', title: 'Hipertrofia', icon: Dumbbell, desc: 'Construção de massa muscular' },
      { id: 'Saúde Geral', title: 'Condicionamento & Saúde', icon: Target, desc: 'Mobilidade e melhoria de vida' }
    ];

    return (
      <div className="animate-fade-in space-y-3">
        <div className="mb-4 text-center">
          <Target className="mx-auto text-white mb-1.5" size={28} />
          <h2 className="text-lg font-black text-white leading-tight">Seu Foco Principal</h2>
          <p className="text-[13px] text-gray-400 font-medium">Onde vamos mirar os esforços?</p>
        </div>

        <div className="space-y-2">
          {targets.map(t => {
            const Icon = t.icon;
            const isSelected = formData.objetivo === t.id;
            return (
              <div 
                key={t.id}
                onClick={() => handleSelect('objetivo', t.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3
                  ${isSelected ? 'border-white bg-white/10' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-white text-black' : 'bg-black/30 text-gray-400'}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className={`font-black text-[14px] leading-none mb-0.5 ${isSelected ? 'text-white' : 'text-gray-300'}`}>{t.title}</h3>
                  <p className="text-[11px] font-medium text-gray-500 leading-tight">{t.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const renderStep4_Level = () => {
    const levels = [
      { id: 'Iniciante', title: 'Iniciante', desc: 'Pouco ou nenhum contato com pesos.' },
      { id: 'Intermediário', title: 'Intermediário', desc: 'Já domina a execução básica dos treinos.' },
      { id: 'Avançado', title: 'Avançado', desc: 'Treina pesado, consistente e com técnicas.' }
    ];

    return (
      <div className="animate-fade-in space-y-3">
        <div className="mb-4 text-center">
          <Activity className="mx-auto text-white mb-1.5" size={28} />
          <h2 className="text-lg font-black text-white leading-tight">Experiência</h2>
          <p className="text-[13px] text-gray-400 font-medium">Seu contato prévio com a musculação.</p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {levels.map(l => (
            <div
              key={l.id}
              onClick={() => handleSelect('nivel', l.id)}
              className={`w-full py-3 px-4 rounded-xl border cursor-pointer transition-all text-left flex flex-col justify-center
                ${formData.nivel === l.id ? 'border-white bg-white text-black shadow-xl' : 'border-white/5 hover:border-white/20 hover:bg-white/5'}`}
            >
              <span className={`font-black text-[13px] uppercase tracking-wide leading-none ${formData.nivel === l.id ? 'text-black' : 'text-white'}`}>
                Nível {l.title}
              </span>
              <span className={`text-[11px] font-medium mt-0.5 inline-block leading-tight ${formData.nivel === l.id ? 'text-gray-600' : 'text-gray-500'}`}>
                {l.desc}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep5_Injuries = () => (
    <div className="animate-fade-in space-y-3">
      <div className="mb-4 text-center">
        <ShieldAlert className="mx-auto text-white mb-1.5" size={28} />
        <h2 className="text-lg font-black text-white leading-tight">Atenção Médica</h2>
        <p className="text-[13px] text-gray-400 font-medium leading-tight px-4">Você possui histórico de lesões ou restrições de movimento no joelho, coluna ou ombros?</p>
      </div>

      <textarea 
        name="lesoes"
        value={formData.lesoes}
        onChange={handleChange}
        placeholder={`Ex: Dor no joelho, hérnia, etc.\nSe não possuir restrições, deixe em branco.`}
        className="input-glass w-full h-28 resize-none overflow-hidden placeholder-gray-600 py-3 text-sm leading-relaxed"
      />
    </div>
  );

  const renderStep6_Habits = () => (
    <div className="animate-fade-in space-y-4">
      <div className="mb-6 text-center">
        <Timer className="mx-auto text-white mb-3" size={32} />
        <h2 className="text-xl font-black text-white">Seu Ritmo</h2>
        <p className="text-sm text-gray-400 font-medium">O escopo da sua rotina.</p>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Frequência Semanal</label>
        <select name="habitos_freq" value={formData.habitos_freq} onChange={handleChange} className={`input-glass w-full appearance-none text-center font-bold [color-scheme:dark] ${!formData.habitos_freq ? '!text-gray-500' : 'text-white'}`}>
          <option value="" disabled hidden>Quantos dias?</option>
          {[1, 2, 3, 4, 5, 6, 7].map(num => (
            <option key={num} value={`${num} dia${num > 1 ? 's' : ''}`} className="bg-[#17171A] text-white font-black text-left">
              {num} dia{num > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Tempo Livre</label>
          <select name="habitos_tempo" value={formData.habitos_tempo} onChange={handleChange} className={`input-glass w-full appearance-none text-center font-bold [color-scheme:dark] ${!formData.habitos_tempo ? '!text-gray-500' : 'text-white'}`}>
            <option value="" disabled hidden>Duração?</option>
            <option value="30 a 45 min" className="bg-[#17171A] text-white font-black text-left">30-45 min</option>
            <option value="45 a 60 min" className="bg-[#17171A] text-white font-black text-left">45-60 min</option>
            <option value="Mais de 60 min" className="bg-[#17171A] text-white font-black text-left">+60 min</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Local</label>
          <select name="habitos_local" value={formData.habitos_local} onChange={handleChange} className={`input-glass w-full appearance-none text-center font-bold [color-scheme:dark] ${!formData.habitos_local ? '!text-gray-500' : 'text-white'}`}>
            <option value="" disabled hidden>Aonde treina?</option>
            <option value="Smart Fit" className="bg-[#17171A] text-white font-black text-left">Smart Fit</option>
            <option value="Pratique" className="bg-[#17171A] text-white font-black text-left">Pratique</option>
            <option value="Contorno" className="bg-[#17171A] text-white font-black text-left">Contorno</option>
            <option value="Outro" className="bg-[#17171A] text-white font-black text-left">Outro</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col justify-center py-4 sm:px-6 lg:px-8 bg-[var(--color-noir-navy)] font-sans relative overflow-hidden">
      
      {/* Background Glow Engine */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--color-noir-accent)]/30 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Box da Logo Dinâmica Standalone */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center justify-center relative z-10">
        <div className="w-[74px] h-[74px] flex items-center justify-center mb-1">
          <img src="/Icone_Corpo_Conectado_Premium.png" alt="Corpo Conectado" className="w-full h-full object-contain drop-shadow-xl pointer-events-none" />
        </div>
      </div>

      {/* Main Board */}
      <div className="mt-2 sm:mx-auto sm:w-full max-w-[450px] relative z-10">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] py-5 px-6 sm:px-8 mx-4 sm:mx-0 overflow-hidden relative">
          
          {success ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center animate-fade-up text-center px-4 py-8 relative z-10">
              <div className="w-16 h-16 bg-white rounded-full text-black flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                <User size={32} />
              </div>
              <h2 className="text-[20px] font-black text-white mb-2 leading-tight">Cadastro concluído com sucesso!</h2>
              <p className="text-gray-400 font-medium text-[13px] leading-relaxed max-w-[280px]">Bem-vindo ao Corpo Conectado. Montando seu painel e processando métricas...</p>
              
              <div className="mt-8 flex gap-1.5 opacity-60">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : loading ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center animate-fade-in text-center px-4 py-8 relative z-10">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
                <div className="w-16 h-16 bg-white rounded-full text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] relative z-10">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              </div>
              
              <h2 className="text-[20px] font-black text-white mb-4 tracking-wide">Processando</h2>
              
              <div className="h-6 overflow-hidden relative w-full flex justify-center">
                <p 
                  key={loadingPhraseIndex} 
                  className="text-gray-400 font-medium text-[13px] absolute animate-fade-up text-center max-w-[280px]"
                >
                  {loadingPhrases[loadingPhraseIndex]}
                </p>
              </div>

              {/* Barra de Progresso Simulada */}
              <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden mt-8">
                <div 
                  className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${fakeProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="animate-fade-up">
              {renderStepProgressBar()}

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] font-black p-3 rounded-xl mb-5 text-center animate-shake">
                  {error}
                </div>
              )}

              {/* Dinamic Injector */}
              <div className="min-h-[260px]">
                {step === 1 && renderStep1_Account()}
                {step === 2 && renderStep2_Bio()}
                {step === 3 && renderStep3_Target()}
                {step === 4 && renderStep4_Level()}
                {step === 5 && renderStep5_Injuries()}
                {step === 6 && renderStep6_Habits()}
              </div>

              {/* Stepper Controllers */}
              <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/5">
                {step > 1 ? (
                  <button onClick={prevStep} className="p-3 text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5 flex items-center gap-2 text-sm font-bold active:scale-[0.98]">
                    <ArrowLeft size={16} /> Voltar
                  </button>
                ) : (
                  <Link to="/login" className="p-3 text-gray-500 hover:text-white transition-colors rounded-xl text-[11px] uppercase tracking-wider font-bold">
                    Já tem conta?
                  </Link>
                )}

                {step < 6 ? (
                  <button onClick={nextStep} className="btn-bright">
                    Continuar <ArrowRight size={16} />
                  </button>
                ) : (
                  <button disabled={loading} onClick={submitForm} className="btn-bright">
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Concluir'}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
