const userHist = [{data:'2026-07-02'}];
const d = new Date(userHist[0].data + 'T12:00:00');
const agora = new Date('2026-07-03T02:35:00Z'); // simulated UTC time for Vercel
agora.setHours(agora.getHours() - 3); // UTC-3 (Brasil)
const dataHojeStr = agora.toISOString().split('T')[0];
const hoje = new Date(dataHojeStr + 'T12:00:00');
console.log({ d, hoje, diff: Math.floor((hoje - d) / 86400000) });
