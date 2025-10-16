/**
 * Helpers e funções utilitárias compartilhadas
 */

/**
 * Normalizar telefone para banco (com +)
 * Suporta múltiplos países e formatos
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove caracteres especiais, mantém apenas dígitos e +
  let clean = phone.replace(/[\s\-\(\)]/g, '');
  
  // Garante que começa com +
  if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  
  return clean;
}

/**
 * Normalizar telefone para WhatsApp (sem +)
 * Remove todos os caracteres especiais, retorna apenas números
 */
function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null;
  
  // Remove tudo exceto dígitos
  let clean = phone.replace(/\D/g, '');
  
  // Retorna apenas números (WhatsApp Business API não usa +)
  return clean;
}

/**
 * Adiciona o 9º dígito para números brasileiros que não o possuem
 * Números brasileiros mudaram de 8 para 9 dígitos em celulares
 * Formato esperado: 5562991708483 (código país + DDD + 9 dígitos)
 */
function addBrazilianNinthDigit(phone) {
  if (!phone) return phone;
  
  // Detecta se é número brasileiro e adiciona 9 se necessário
  let clean = phone.replace(/\D/g, '');
  
  // Verifica se é Brasil (código 55)
  if (clean.startsWith('55')) {
    // Remove código do país
    let withoutCountry = clean.substring(2);
    
    // Pega DDD (2 dígitos) e número
    if (withoutCountry.length === 10) {
      let ddd = withoutCountry.substring(0, 2);
      let numero = withoutCountry.substring(2);
      
      // Se número tem 8 dígitos e não começa com 9, adiciona
      if (numero.length === 8 && !numero.startsWith('9')) {
        return '55' + ddd + '9' + numero;
      }
    }
  }
  
  return clean;
}

/**
 * Busca usuário por telefone com múltiplas variações
 * Tenta diferentes formatos para garantir compatibilidade
 */
function getPhoneVariations(phone) {
  if (!phone) return [];
  
  const normalized = normalizePhoneForWhatsApp(phone);
  const withNinthDigit = addBrazilianNinthDigit(normalized);
  
  const variations = [
    normalized,                    // 556291708483
    `+${normalized}`,              // +556291708483
    withNinthDigit,                // 5562991708483 (com 9º dígito se necessário)
    `+${withNinthDigit}`           // +5562991708483
  ];
  
  // Remove duplicatas
  return [...new Set(variations)];
}

module.exports = {
  normalizePhone,
  normalizePhoneForWhatsApp,
  addBrazilianNinthDigit,
  getPhoneVariations
};






