import React from 'react';
import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';

// ─── Cores do Tema (Azul Marinho Premium) ────────────────────────────────────
const COLORS = {
  navy: '#0F1B3D',
  navyLight: '#1A2B5A',
  navyAccent: '#243B73',
  white: '#FFFFFF',
  offWhite: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray700: '#334155',
  gray900: '#0F172A',
  accent: '#3B82F6',
};

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    backgroundColor: COLORS.white,
    color: COLORS.gray900,
  },

  // ─── Header / Cabeçalho ─────────────────────────────
  headerBar: {
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'column',
    gap: 2,
  },
  brandName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    color: COLORS.white,
    letterSpacing: 1.5,
  },
  brandTagline: {
    fontSize: 7,
    color: COLORS.gray400,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  headerDate: {
    fontSize: 8,
    color: COLORS.gray400,
    fontFamily: 'Helvetica',
  },
  headerDateValue: {
    fontSize: 10,
    color: COLORS.white,
    fontFamily: 'Helvetica-Bold',
  },

  // ─── Info Cards ──────────────────────────────────────
  infoRow: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: COLORS.gray100,
    borderRadius: 6,
    padding: 12,
    borderLeft: `3px solid ${COLORS.navyAccent}`,
  },
  infoGrid: {
    flexDirection: 'row',
  },
  infoGridCol: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 7,
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
  },
  infoField: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 8,
    color: COLORS.gray500,
    width: 75,
    fontFamily: 'Helvetica',
  },
  infoValue: {
    fontSize: 8,
    color: COLORS.gray900,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
  },

  // ─── Seção de Treino ─────────────────────────────────
  treinoSection: {
    marginBottom: 16,
  },
  treinoHeader: {
    backgroundColor: COLORS.navy,
    borderRadius: 6,
    padding: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  treinoHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  treinoLetra: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: COLORS.white,
  },
  treinoNome: {
    fontSize: 9,
    color: COLORS.gray400,
    fontFamily: 'Helvetica',
  },
  treinoExCount: {
    fontSize: 7,
    color: COLORS.gray400,
    backgroundColor: COLORS.navyLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontFamily: 'Helvetica-Bold',
  },

  // ─── Tabela ──────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray100,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.gray200,
  },
  tableRowAlt: {
    backgroundColor: COLORS.offWhite,
  },
  colNum: { width: 24, textAlign: 'center' },
  colExercicio: { flex: 3.5, paddingRight: 4 },
  colSeries: { width: 40, textAlign: 'center' },
  colReps: { width: 50, textAlign: 'center' },
  colCarga: { width: 40, textAlign: 'center' },
  colDescanso: { width: 45, textAlign: 'center' },
  colObs: { flex: 2.5 },
  thText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tdText: {
    fontSize: 8,
    color: COLORS.gray900,
    fontFamily: 'Helvetica',
  },
  tdBold: {
    fontSize: 8,
    color: COLORS.gray900,
    fontFamily: 'Helvetica-Bold',
  },
  tdLight: {
    fontSize: 7.5,
    color: COLORS.gray500,
    fontFamily: 'Helvetica',
  },

  // ─── Rodapé ──────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.gray200,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.gray400,
    fontFamily: 'Helvetica',
  },
  footerBold: {
    fontSize: 7,
    color: COLORS.gray500,
    fontFamily: 'Helvetica-Bold',
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDescanso(seg) {
  if (!seg || seg <= 0) return '--';
  if (seg >= 60) {
    const min = Math.floor(seg / 60);
    const rest = seg % 60;
    return rest > 0 ? `${min}m${rest}s` : `${min} min`;
  }
  return `${seg}s`;
}

function formatDataEmissao() {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function FichaTreinoPDF({ aluno, profissional, treinos, dataEmissao }) {
  const data = dataEmissao || formatDataEmissao();

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>

        {/* ═══ Cabeçalho ═══ */}
        <View style={styles.headerBar} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>CORPO CONECTADO</Text>
            <Text style={styles.brandTagline}>Treinamento Inteligente</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>DATA DE EMISSÃO</Text>
            <Text style={styles.headerDateValue}>{data}</Text>
          </View>
        </View>

        {/* ═══ Informações do Treinamento ═══ */}
        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Dados do Aluno e Ficha</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoGridCol}>
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Aluno:</Text>
                  <Text style={styles.infoValue}>{aluno?.nome || '--'}</Text>
                </View>
                {aluno?.idade && (
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Idade:</Text>
                    <Text style={styles.infoValue}>{aluno.idade} anos</Text>
                  </View>
                )}
                {aluno?.peso && (
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Peso:</Text>
                    <Text style={styles.infoValue}>{aluno.peso} kg</Text>
                  </View>
                )}
              </View>
              <View style={styles.infoGridCol}>
                {aluno?.altura && (
                  <View style={styles.infoField}>
                    <Text style={styles.infoLabel}>Altura:</Text>
                    <Text style={styles.infoValue}>{aluno.altura} m</Text>
                  </View>
                )}
                <View style={styles.infoField}>
                  <Text style={styles.infoLabel}>Foco Macro:</Text>
                  <Text style={styles.infoValue}>{treinos?.[0]?.objetivo || aluno?.objetivo || '--'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ Treinos ═══ */}
        {treinos?.map((treino, tIdx) => (
          <View key={tIdx} style={styles.treinoSection} wrap={false}>
            {/* Título do Treino */}
            <View style={styles.treinoHeader}>
              <View style={styles.treinoHeaderLeft}>
                <Text style={styles.treinoLetra}>Treino {treino.letra || String.fromCharCode(65 + tIdx)}</Text>
                <Text style={styles.treinoNome}>{treino.nome || treino.foco_muscular || ''}</Text>
              </View>
              <Text style={styles.treinoExCount}>
                {treino.exercicios?.length || 0} exercício{(treino.exercicios?.length || 0) !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Header da Tabela */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colNum]}>#</Text>
              <Text style={[styles.thText, styles.colExercicio]}>Exercício</Text>
              <Text style={[styles.thText, styles.colSeries]}>Séries</Text>
              <Text style={[styles.thText, styles.colReps]}>Reps</Text>
              <Text style={[styles.thText, styles.colCarga]}>Carga</Text>
              <Text style={[styles.thText, styles.colDescanso]}>Desc.</Text>
              <Text style={[styles.thText, styles.colObs]}>Observações</Text>
            </View>

            {/* Linhas */}
            {treino.exercicios?.map((ex, exIdx) => (
              <View key={exIdx} style={[styles.tableRow, exIdx % 2 !== 0 && styles.tableRowAlt]}>
                <Text style={[styles.tdLight, styles.colNum]}>{exIdx + 1}</Text>
                <Text style={[styles.tdBold, styles.colExercicio]}>{ex.nome || '--'}</Text>
                <Text style={[styles.tdText, styles.colSeries]}>{ex.series || '--'}</Text>
                <Text style={[styles.tdText, styles.colReps]}>{ex.reps || ex.repeticoes || '--'}</Text>
                <Text style={[styles.tdText, styles.colCarga]}>{ex.carga || '--'}</Text>
                <Text style={[styles.tdText, styles.colDescanso]}>{formatDescanso(ex.descanso)}</Text>
                <Text style={[styles.tdLight, styles.colObs]}>{ex.observacoes || ''}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* ═══ Rodapé ═══ */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Corpo Conectado — Treinamento Inteligente
            {profissional?.email ? `  •  ${profissional.email}` : ''}
          </Text>
          <Text style={styles.footerBold} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
