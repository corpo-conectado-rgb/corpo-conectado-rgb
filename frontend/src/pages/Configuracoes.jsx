import { useState } from 'react';
import { 
  Lock, 
  Smartphone, 
  Info, 
  Phone, 
  Lightbulb, 
  Star, 
  FileText, 
  ShieldCheck, 
  ChevronRight,
  X,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { apiFetch } from '../services/api';
import Toast from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';

export default function Configuracoes() {
  const { user } = useAuth();
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
  const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toLocaleDateString('pt-BR');

  // Modals state
  const [modalSenha, setModalSenha] = useState(false);
  const [modalSobre, setModalSobre] = useState(false);
  const [modalSugestao, setModalSugestao] = useState(false);
  const [modalAvaliar, setModalAvaliar] = useState(false);
  const [modalLegal, setModalLegal] = useState(null); // 'privacidade' | 'termos'

  // Form state
  const [senhaForm, setSenhaForm] = useState({ atual: '', nova: '', confirmar: '' });
  const [showSenhas, setShowSenhas] = useState({ atual: false, nova: false, confirmar: false });
  const [sugestaoForm, setSugestaoForm] = useState({ tipo: 'sugestao', texto: '' });
  
  // Loading & Toast
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const handleMudarSenha = async (e) => {
    e.preventDefault();
    if (senhaForm.nova !== senhaForm.confirmar) {
      return showToast('A nova senha e a confirmação não coincidem.', 'error');
    }
    if (senhaForm.nova.length < 6) {
      return showToast('A nova senha deve ter pelo menos 6 caracteres.', 'error');
    }

    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          senhaAtual: senhaForm.atual,
          novaSenha: senhaForm.nova
        })
      });
      showToast('Senha alterada com sucesso!');
      setModalSenha(false);
      setSenhaForm({ atual: '', nova: '', confirmar: '' });
    } catch (err) {
      showToast(err.message || 'Erro ao alterar senha.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarSugestao = async (e) => {
    e.preventDefault();
    if (!sugestaoForm.texto.trim()) return;

    setLoading(true);
    try {
      await apiFetch('/solicitacoes', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'AJUSTE', // Usando tipo genérico para enviar para a caixa do admin
          mensagem: `[${sugestaoForm.tipo.toUpperCase()}] ${sugestaoForm.texto}`
        })
      });
      showToast('Enviado com sucesso! Muito obrigado pelo feedback.');
      setModalSugestao(false);
      setSugestaoForm({ tipo: 'sugestao', texto: '' });
    } catch (err) {
      showToast(err.message || 'Erro ao enviar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppSupport = () => {
    // Basic OS detection
    const ua = navigator.userAgent;
    let os = "Desconhecido";
    if (/android/i.test(ua)) os = "Android";
    else if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) os = "iOS";
    else if (/Windows/.test(ua)) os = "Windows";
    else if (/Mac/.test(ua)) os = "Mac OS";

    // Build the message
    const message = `Olá! Preciso de suporte no aplicativo Corpo Conectado.

Nome: ${user?.nome || 'Não identificado'}
E-mail: ${user?.email || 'Não identificado'}
Versão do App: ${appVersion}
Dispositivo: ${navigator.platform || 'N/A'}
Sistema: ${os}

Descrição do problema: `;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5531988798642?text=${encodedMessage}`, '_blank');
  };

  const SectionLabel = ({ text }) => (
    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-2 mt-6 first:mt-0">
      {text}
    </h3>
  );

  const SettingsRow = ({ icon: Icon, iconColorClass, title, subtitle, onClick, border = true }) => (
    <div 
      onClick={onClick}
      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/70 transition-colors ${border ? 'border-b border-gray-100' : ''}`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColorClass}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-black text-gray-900">{title}</p>
          {subtitle && <p className="text-[11px] font-semibold text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto w-full animate-fade-in relative pb-10">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Configurações</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">Personalize sua experiência e conta</p>
      </div>

      <div className="space-y-6">
        
        {/* SEÇÃO 1: CONTA & SEGURANÇA */}
        <div>
          <SectionLabel text="Conta & Segurança" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SettingsRow 
              icon={Lock} 
              iconColorClass="bg-purple-50 text-purple-600" 
              title="Alterar Senha" 
              subtitle="Mantenha sua conta segura"
              border={false}
              onClick={() => setModalSenha(true)}
            />
          </div>
        </div>

        {/* SEÇÃO 2: SOBRE O APP */}
        <div>
          <SectionLabel text="Sobre o App" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                  <Smartphone size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Versão do Aplicativo</p>
                  <p className="text-[11px] font-semibold text-gray-400 mt-0.5">Atualizado em {buildDate}</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                v{appVersion}
              </span>
            </div>
            <SettingsRow 
              icon={Info} 
              iconColorClass="bg-blue-50 text-blue-600" 
              title="Sobre o Corpo Conectado" 
              border={false}
              onClick={() => setModalSobre(true)}
            />
          </div>
        </div>

        {/* SEÇÃO 3: SUPORTE & FEEDBACK */}
        <div>
          <SectionLabel text="Suporte & Feedback" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SettingsRow 
              icon={Phone} 
              iconColorClass="bg-emerald-50 text-emerald-600" 
              title="Central de Ajuda" 
              subtitle="(31) 98879-8642 / WhatsApp"
              onClick={handleWhatsAppSupport}
            />
            <SettingsRow 
              icon={Lightbulb} 
              iconColorClass="bg-amber-50 text-amber-500" 
              title="Enviar Sugestão ou Problema" 
              onClick={() => setModalSugestao(true)}
            />
            <SettingsRow 
              icon={Star} 
              iconColorClass="bg-yellow-50 text-yellow-500" 
              title="Avaliar o Aplicativo" 
              border={false}
              onClick={() => setModalAvaliar(true)}
            />
          </div>
        </div>

        {/* SEÇÃO 4: TERMOS & PRIVACIDADE */}
        <div>
          <SectionLabel text="Termos & Privacidade" />
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <SettingsRow 
              icon={ShieldCheck} 
              iconColorClass="bg-gray-50 text-gray-600" 
              title="Política de Privacidade" 
              onClick={() => setModalLegal('privacidade')}
            />
            <SettingsRow 
              icon={FileText} 
              iconColorClass="bg-gray-50 text-gray-600" 
              title="Termos de Uso" 
              border={false}
              onClick={() => setModalLegal('termos')}
            />
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="mt-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">
          Corpo Conectado © {new Date().getFullYear()}
        </p>
      </div>

      {/* ===================== MODAIS ===================== */}

      {/* MODAL: MUDAR SENHA */}
      {modalSenha && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !loading && setModalSenha(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-scale-in flex flex-col overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Lock size={18} className="text-purple-600" /> Alterar Senha
              </h2>
              <button onClick={() => !loading && setModalSenha(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleMudarSenha} className="p-5 space-y-4">
              
              {/* Field Senha Atual */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showSenhas.atual ? "text" : "password"}
                    required
                    value={senhaForm.atual}
                    onChange={(e) => setSenhaForm({...senhaForm, atual: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 pr-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Sua senha atual"
                  />
                  <button type="button" onClick={() => setShowSenhas({...showSenhas, atual: !showSenhas.atual})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenhas.atual ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field Nova Senha */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showSenhas.nova ? "text" : "password"}
                    required
                    minLength={6}
                    value={senhaForm.nova}
                    onChange={(e) => setSenhaForm({...senhaForm, nova: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 pr-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="No mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setShowSenhas({...showSenhas, nova: !showSenhas.nova})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenhas.nova ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Field Confirmar Senha */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5 block">Confirmar Nova Senha</label>
                <div className="relative">
                  <input
                    type={showSenhas.confirmar ? "text" : "password"}
                    required
                    minLength={6}
                    value={senhaForm.confirmar}
                    onChange={(e) => setSenhaForm({...senhaForm, confirmar: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 pr-10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                    placeholder="Repita a nova senha"
                  />
                  <button type="button" onClick={() => setShowSenhas({...showSenhas, confirmar: !showSenhas.confirmar})} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showSenhas.confirmar ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-black text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition flex items-center justify-center disabled:opacity-70 shadow-md shadow-black/10 active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SOBRE O APP */}
      {modalSobre && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalSobre(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-scale-in p-6 text-center">
            <button onClick={() => setModalSobre(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
              <X size={16} />
            </button>
            <div className="w-16 h-16 mx-auto mb-4">
              <img src="/icon-192.png" alt="Corpo Conectado" className="w-full h-full rounded-2xl shadow-lg border border-gray-100 object-cover" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Corpo Conectado</h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mt-1 mb-4">Plataforma Premium</p>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              Nossa missão é transformar sua relação com o treinamento através de ciência, acompanhamento próximo e tecnologia intuitiva.<br/><br/>
              Criado por <strong className="text-gray-800">Kevin Oliveira</strong>.
            </p>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Versão</p>
              <p className="text-xs font-bold text-gray-900">{appVersion}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1 mt-3">Última atualização</p>
              <p className="text-xs font-bold text-gray-900">{buildDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR SUGESTÃO */}
      {modalSugestao && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => !loading && setModalSugestao(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative animate-scale-in flex flex-col overflow-hidden">
            <div className="p-5 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500" /> Feedback
              </h2>
              <button onClick={() => !loading && setModalSugestao(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleEnviarSugestao} className="p-5 space-y-4">
              <p className="text-sm text-gray-500 font-medium mb-4">
                Sua opinião é fundamental para evoluirmos o app. Encontrou um bug ou tem uma ideia? Conta pra gente!
              </p>
              
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button 
                  type="button" 
                  onClick={() => setSugestaoForm({...sugestaoForm, tipo: 'sugestao'})}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${sugestaoForm.tipo === 'sugestao' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Sugestão
                </button>
                <button 
                  type="button" 
                  onClick={() => setSugestaoForm({...sugestaoForm, tipo: 'problema'})}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-colors ${sugestaoForm.tipo === 'problema' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Problema
                </button>
              </div>

              <div>
                <textarea
                  required
                  rows={4}
                  value={sugestaoForm.texto}
                  onChange={(e) => setSugestaoForm({...sugestaoForm, texto: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium text-gray-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none resize-none"
                  placeholder={sugestaoForm.tipo === 'sugestao' ? "Como podemos melhorar o app?" : "Descreva o problema que você encontrou..."}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || !sugestaoForm.texto.trim()}
                  className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition flex items-center justify-center disabled:opacity-50 shadow-md shadow-amber-500/20 active:scale-95"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Enviar Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AVALIAR */}
      {modalAvaliar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalAvaliar(false)} />
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative animate-scale-in p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center mx-auto mb-4">
              <Star size={32} fill="currentColor" />
            </div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Curtindo o App?</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
              No momento, somos um Web App (PWA). Sua maior avaliação é nos indicar para amigos e continuar treinando firme!
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={28} className="text-yellow-400" fill="currentColor" />
              ))}
            </div>
            <button 
              onClick={() => setModalAvaliar(false)}
              className="w-full bg-black text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition active:scale-95"
            >
              Valeu!
            </button>
          </div>
        </div>
      )}

      {/* MODAL LEGAL (TERMOS / PRIVACIDADE) */}
      {modalLegal && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setModalLegal(null)} />
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-lg font-black text-gray-900">
                {modalLegal === 'privacidade' ? 'Política de Privacidade' : 'Termos de Uso'}
              </h2>
              <button onClick={() => setModalLegal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-sm text-gray-600 font-medium space-y-4">
              {modalLegal === 'privacidade' ? (
                <>
                  <p><strong>1. Coleta de Dados:</strong> Coletamos informações como nome, email, medidas físicas e hábitos para personalizar seus treinos.</p>
                  <p><strong>2. Uso das Informações:</strong> Seus dados são usados exclusivamente para a prestação do serviço de consultoria fitness.</p>
                  <p><strong>3. Armazenamento Seguro:</strong> Utilizamos provedores em nuvem seguros. Senhas são armazenadas com criptografia irreversível.</p>
                  <p><strong>4. Compartilhamento:</strong> Não vendemos nem compartilhamos seus dados com terceiros sem sua autorização.</p>
                  <p><strong>5. Seus Direitos:</strong> Você pode solicitar a exclusão da sua conta e de todos os dados associados contatando o suporte.</p>
                </>
              ) : (
                <>
                  <p><strong>1. Aceitação:</strong> Ao utilizar o app Corpo Conectado, você concorda com estes termos.</p>
                  <p><strong>2. O Serviço:</strong> O app fornece acesso à prescrição de treinos elaborada pelo seu treinador.</p>
                  <p><strong>3. Responsabilidade Física:</strong> A execução dos exercícios é de sua responsabilidade. Consulte um médico antes de iniciar atividades físicas intensas.</p>
                  <p><strong>4. Assinatura:</strong> O acesso é concedido mediante assinatura ativa. O não pagamento bloqueia o acesso à plataforma.</p>
                  <p><strong>5. Propriedade Intelectual:</strong> O conteúdo, treinos e marca são de propriedade do Corpo Conectado.</p>
                </>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 shrink-0">
              <button 
                onClick={() => setModalLegal(null)}
                className="w-full bg-black text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition active:scale-95"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.show && <Toast message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: '' })} />}
    </div>
  );
}
