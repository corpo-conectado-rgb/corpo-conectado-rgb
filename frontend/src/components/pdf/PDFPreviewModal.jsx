import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { X, Download, Share2, Loader2, FileText, Eye } from 'lucide-react';
import FichaTreinoPDF from './FichaTreinoPDF';

/**
 * PDFPreviewModal
 * 
 * Modal elegante para pré-visualização e download de PDF de fichas de treino.
 * Compatível com Desktop (download direto) e Mobile (Web Share API).
 * 
 * Props:
 *  - isOpen: boolean
 *  - onClose: () => void
 *  - aluno: { nome, idade, peso, altura, objetivo }
 *  - profissional: { nome, email }
 *  - treinos: array de fichas com exercícios
 */
export default function PDFPreviewModal({ isOpen, onClose, aluno, profissional, treinos }) {
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');

  // Gera o blob do PDF
  const generatePDF = async () => {
    setGenerating(true);
    setError('');
    try {
      const doc = <FichaTreinoPDF aluno={aluno} profissional={profissional} treinos={treinos} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Não foi possível gerar o PDF. Tente novamente.');
    } finally {
      setGenerating(false);
    }
  };

  // Gera ao abrir
  React.useEffect(() => {
    if (isOpen && !previewUrl && !generating) {
      generatePDF();
    }
    // Limpa URL ao fechar
    if (!isOpen && previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  // Download direto
  const handleDownload = async () => {
    try {
      const doc = <FichaTreinoPDF aluno={aluno} profissional={profissional} treinos={treinos} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ficha_Treino_${(aluno?.nome || 'Aluno').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro no download:', err);
      setError('Falha ao baixar o PDF.');
    }
  };

  // Compartilhar (Web Share API)
  const handleShare = async () => {
    try {
      const doc = <FichaTreinoPDF aluno={aluno} profissional={profissional} treinos={treinos} />;
      const blob = await pdf(doc).toBlob();
      const file = new File(
        [blob], 
        `Ficha_Treino_${(aluno?.nome || 'Aluno').replace(/\s+/g, '_')}.pdf`, 
        { type: 'application/pdf' }
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Ficha de Treino — ${aluno?.nome || 'Aluno'}`,
          text: 'Confira minha ficha de treino do Corpo Conectado!',
          files: [file],
        });
      } else {
        // Fallback: download direto
        handleDownload();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', err);
        handleDownload(); // Fallback
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl mx-4 max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0F1B3D] to-[#1A2B5A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <FileText size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white tracking-wide">Ficha de Treino</h2>
              <p className="text-[10px] text-gray-400 font-medium">{aluno?.nome || 'Aluno'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 min-h-0 bg-gray-100 overflow-auto">
          {generating ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center animate-pulse">
                <Loader2 size={24} className="text-[#0F1B3D] animate-spin" />
              </div>
              <p className="text-sm font-bold text-gray-500">Gerando documento...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
              <p className="text-sm font-bold text-red-500">{error}</p>
              <button onClick={generatePDF} className="text-xs font-bold text-blue-600 underline">
                Tentar novamente
              </button>
            </div>
          ) : previewUrl ? (
            <iframe 
              src={previewUrl} 
              className="w-full h-full min-h-[500px]" 
              title="Preview PDF"
              style={{ border: 'none' }}
            />
          ) : null}
        </div>

        {/* Footer / Actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-100 bg-white">
          <button
            onClick={handleDownload}
            disabled={generating}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-[#0F1B3D] text-white font-black text-sm rounded-xl
                       hover:bg-[#1A2B5A] active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
          >
            <Download size={16} />
            Baixar PDF
          </button>
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center justify-center gap-2 h-11 px-5 bg-gray-100 text-gray-700 font-black text-sm rounded-xl
                       hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Share2 size={16} />
            Compartilhar
          </button>
        </div>
      </div>
    </div>
  );
}
