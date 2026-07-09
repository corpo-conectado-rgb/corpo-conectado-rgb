import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Check, ChevronDown, ArrowRight, Shield,
  Dumbbell, BarChart2, ClipboardList, Flame, Timer,
  UserCircle, Bot, Rocket, ChevronRight as ChevronRightIcon,
  Sparkles, Lock, Loader2
} from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';

const PLAN_FEATURES = [
  'Treinos personalizados',
  'Dashboard de evolução',
  'Histórico completo',
  'Cronômetro inteligente',
  'Assistente IA (Alfred)',
  'Atualizações futuras inclusas',
];

const BENEFITS = [
  {
    icon: Dumbbell,
    title: 'Treinos Personalizados',
    description: 'Fichas prescritas sob medida pelo seu professor, com exercícios, séries e cargas ajustadas para o seu nível.',
  },
  {
    icon: BarChart2,
    title: 'Dashboard Inteligente',
    description: 'Acompanhe sua evolução com gráficos detalhados, distribuição de treinos e estatísticas de desempenho.',
  },
  {
    icon: ClipboardList,
    title: 'Histórico Completo',
    description: 'Todos os seus treinos registrados e organizados, disponíveis para consulta a qualquer momento.',
  },
  {
    icon: Flame,
    title: 'Sequência de Treinos',
    description: 'Acompanhe suas semanas consecutivas de treino e mantenha a constância que gera resultados reais.',
  },
  {
    icon: Timer,
    title: 'Cronômetro Integrado',
    description: 'Controle o tempo de descanso entre séries e a duração total do treino com precisão.',
  },
  {
    icon: UserCircle,
    title: 'Perfil Personalizado',
    description: 'Atualize seus dados pessoais, peso, altura e metas a qualquer momento, tudo em um só lugar.',
  },
  {
    icon: Bot,
    title: 'Assistente IA (Alfred)',
    description: 'Um copiloto inteligente do Corpo Conectado que analisa seus dados, acompanha sua evolução e mantém você sempre conectado ao seu progresso e ao seu educador físico.',
  },
  {
    icon: Rocket,
    title: 'Atualizações Contínuas',
    description: 'Novos recursos e melhorias adicionados regularmente, sem nenhum custo extra na sua assinatura.',
  },
];

const DIFFERENTIALS = [
  {
    title: 'Acompanhamento profissional real',
    description: 'Seu professor prescreve treinos sob medida e acompanha sua evolução de perto.',
  },
  {
    title: 'Praticidade no dia a dia',
    description: 'Tudo no seu celular. Sem papéis, sem planilhas, sem complicação.',
  },
  {
    title: 'Constância que gera resultados',
    description: 'O sistema de sequência (streak) te motiva a manter o ritmo todos os dias.',
  },
  {
    title: 'Tecnologia a seu favor',
    description: 'Inteligência artificial, dashboards e cronômetro integrado trabalhando para você.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'Posso cancelar quando quiser?',
    answer: 'Sim! Não existe fidelidade ou multa. Você pode cancelar sua assinatura a qualquer momento, sem burocracia.',
  },
  {
    question: 'Como funciona o pagamento?',
    answer: 'O pagamento é mensal, realizado via PIX. Após assinar, você receberá as instruções de pagamento diretamente na plataforma.',
  },
  {
    question: 'O acesso é liberado imediatamente?',
    answer: 'Sim! Após a confirmação do pagamento, você terá acesso completo e imediato a todos os recursos da plataforma.',
  },
  {
    question: 'Meus treinos continuam salvos?',
    answer: 'Claro! Todo o seu histórico de treinos, evolução e dados ficam armazenados com segurança na nuvem.',
  },
  {
    question: 'Haverá novos recursos no futuro?',
    answer: 'Com certeza! O Corpo Conectado está em constante evolução. Todos os novos recursos são inclusos automaticamente na sua assinatura, sem custo adicional.',
  },
];

export default function Assinatura() {
  const navigate = useNavigate();
  const location = useLocation();
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const planRef = useRef(null);

  // Verifica se já tem assinatura ativa
  useEffect(() => {
    apiFetch('/financeiro/minha-assinatura')
      .then(res => {
        if (res && res.status === 'ATIVA') {
          setHasActivePlan(true);
          // Redireciona apenas se não veio pelo botão "Ver Planos"
          if (!location.state?.fromFinanceiro) {
            navigate('/financeiro', { replace: true });
          } else {
            setInitialLoading(false);
          }
        } else {
          setInitialLoading(false);
        }
      })
      .catch(() => {
        setInitialLoading(false);
      });
  }, [navigate, location.state]);

  const scrollToPlan = () => {
    planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleAssinar = async () => {
    if (hasActivePlan) {
      navigate('/financeiro');
      return;
    }
    try {
      setLoading(true);
      const result = await apiFetch('/financeiro/assinar', { method: 'POST' });
      if (result.success) {
        setToast({ show: true, message: 'Assinatura ativada com sucesso! 🎉', type: 'success' });
        setTimeout(() => navigate('/financeiro'), 1500);
      }
    } catch (err) {
      const msg = err.message || 'Erro ao ativar assinatura.';
      if (msg.includes('já possui')) {
        navigate('/financeiro');
      } else {
        setToast({ show: true, message: msg, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="absolute inset-0 z-10 bg-white rounded-2xl flex items-center justify-center animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Verificando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-white rounded-2xl flex flex-col overflow-hidden animate-fade-in">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-8 md:py-14 space-y-12 md:space-y-20">

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 1 — HERO HEADER                              */}
          {/* ═══════════════════════════════════════════════════ */}
          <section className="text-center space-y-5 pt-2">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
              Corpo Conectado
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Seu treino. Sua evolução.
              <br />
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Tudo em um só lugar.
              </span>
            </h1>
            <p className="text-sm md:text-base text-gray-500 font-medium max-w-md mx-auto leading-relaxed">
              Tenha acesso completo a todos os recursos do Corpo Conectado por um valor que cabe no seu bolso.
            </p>
            <button
              onClick={scrollToPlan}
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-bold text-sm px-7 py-3.5 rounded-xl hover:bg-gray-800 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg shadow-gray-900/20"
            >
              Ver Plano
              <ChevronDown size={16} />
            </button>
          </section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 2 — CARD DO PLANO                            */}
          {/* ═══════════════════════════════════════════════════ */}
          <section ref={planRef} className="flex justify-center">
            <div className="w-full max-w-md bg-white border-2 border-purple-600 rounded-3xl shadow-xl shadow-purple-600/10 overflow-hidden hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-600/15 transition-all duration-300">
              {/* Topo Roxo Decorativo */}
              <div className="bg-purple-600 h-4 w-full"></div>

              <div className="p-6 md:p-8 space-y-6">
                {/* Plan Name */}
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-black text-gray-900 tracking-tight">Plano Básico</h2>
                  {hasActivePlan && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ativo
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="space-y-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-bold text-gray-400">R$</span>
                    <span className="text-5xl font-black text-gray-900 tracking-tighter">19,90</span>
                    <span className="text-sm font-bold text-gray-400">/mês</span>
                  </div>
                  <p className="text-[11px] font-bold text-gray-400">
                    Menos de R$ 0,66 por dia • Cancele quando quiser
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-100"></div>

                {/* Features */}
                <ul className="space-y-3">
                  {PLAN_FEATURES.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-emerald-600" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={handleAssinar}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold text-sm py-4 rounded-xl hover:bg-gray-800 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-gray-900/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <><Loader2 size={16} className="animate-spin" /> Ativando...
                    </>
                  ) : hasActivePlan ? (
                    <>Acessar Financeiro <ArrowRight size={16} /></>
                  ) : (
                    <>Assinar Agora <ArrowRight size={16} /></>
                  )}
                </button>

                {/* Trust */}
                <p className="text-center text-[11px] font-bold text-gray-400 flex items-center justify-center gap-1.5">
                  <Lock size={12} />
                  Pagamento seguro via PIX
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 3 — BENEFÍCIOS                               */}
          {/* ═══════════════════════════════════════════════════ */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">O que está incluso</h2>
              <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Tudo o que você precisa para evoluir
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BENEFITS.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-purple-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                        <Icon size={20} className="text-purple-600" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-sm font-black text-gray-900 group-hover:text-purple-900 transition-colors">{benefit.title}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 4 — DIFERENCIAIS                             */}
          {/* ═══════════════════════════════════════════════════ */}
          <section className="bg-gray-50 -mx-4 md:-mx-8 px-4 md:px-8 py-10 md:py-14 rounded-3xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diferenciais</h2>
              <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Por que escolher o Corpo Conectado?
              </p>
            </div>

            <div className="space-y-3 max-w-lg mx-auto">
              {DIFFERENTIALS.map((diff, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm hover:border-purple-200 hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-100 transition-colors">
                      <ChevronRightIcon size={16} className="text-purple-600" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="text-sm font-black text-gray-900">{diff.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{diff.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 5 — FAQ                                      */}
          {/* ═══════════════════════════════════════════════════ */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dúvidas</h2>
              <p className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                Perguntas Frequentes
              </p>
            </div>

            <div className="space-y-2.5 max-w-lg mx-auto">
              {FAQ_ITEMS.map((item, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer ${
                      isOpen ? 'border-purple-200 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'
                    }`}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                  >
                    <div className="flex items-center justify-between p-4 md:p-5">
                      <span className="text-sm font-bold text-gray-900 pr-4">{item.question}</span>
                      <ChevronDown
                        size={18}
                        className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <p className="px-4 md:px-5 pb-4 md:pb-5 text-xs text-gray-500 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════ */}
          {/* SEÇÃO 6 — CTA FINAL                                */}
          {/* ═══════════════════════════════════════════════════ */}
          <section className="pb-4">
            <div className="bg-gray-900 rounded-2xl p-8 md:p-12 text-center space-y-5">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                Pronto para transformar
                <br />
                seus treinos?
              </h2>
              <p className="text-sm text-gray-400 font-medium">
                Comece agora por apenas <span className="text-white font-black">R$ 19,90/mês</span>.
              </p>
              <button
                onClick={handleAssinar}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-white text-gray-900 font-black text-sm px-8 py-4 rounded-xl hover:bg-gray-100 hover:scale-105 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-white/10 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Ativando...</>
                ) : hasActivePlan ? (
                  <>Acessar Financeiro <ArrowRight size={16} /></>
                ) : (
                  <>Começar Agora <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          </section>

        </div>
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
}
