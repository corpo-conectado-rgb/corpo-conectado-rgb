/**
 * dateUtils.js
 * Utilitários para tratamento de datas e idades
 */

/**
 * Calcula a idade com base na data de nascimento (formato YYYY-MM-DD).
 * @param {string} dataNascimento 
 * @returns {number|null} Idade em anos ou null se inválida.
 */
function calcularIdade(dataNascimento) {
  if (!dataNascimento || typeof dataNascimento !== 'string') return null;

  // Garantir que temos partes válidas mesmo que venha 'YYYY-MM-DD'
  const partes = dataNascimento.split('-');
  if (partes.length !== 3) return null;

  const anoNasc = parseInt(partes[0], 10);
  const mesNasc = parseInt(partes[1], 10) - 1; // Meses em JS começam em 0
  const diaNasc = parseInt(partes[2], 10);

  const hoje = new Date();
  const dataNascObj = new Date(anoNasc, mesNasc, diaNasc);

  let idade = hoje.getFullYear() - dataNascObj.getFullYear();
  const mesAtual = hoje.getMonth();
  const diaAtual = hoje.getDate();

  // Subtrair 1 ano se ainda não fez aniversário neste ano
  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    idade--;
  }

  return idade >= 0 ? idade : 0;
}

module.exports = {
  calcularIdade
};
