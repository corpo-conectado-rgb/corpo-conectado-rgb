/**
 * Formata um nome completo para ter a primeira letra de cada palavra maiúscula,
 * mantendo preposições e conjunções comuns em letras minúsculas.
 * 
 * Ex: "jusimar RODRIGUES DE SOUZA" -> "Jusimar Rodrigues de Souza"
 */
export const formatName = (name) => {
  if (!name) return '';

  const lowercaseWords = ['de', 'da', 'do', 'das', 'dos', 'e'];

  return name
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Se a palavra for uma preposição e não for a primeira palavra, mantém minúscula
      if (lowercaseWords.includes(word) && index !== 0) {
        return word;
      }
      // Capitaliza a primeira letra da palavra
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};
