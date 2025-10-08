/**
 * Helpers e funções utilitárias compartilhadas
 */

/**
 * Normalizar telefone para banco (com +)
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // Remove espaços, parênteses, hífens
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Se não tem +, adiciona +55 (Brasil)
  if (!cleanPhone.startsWith('+')) {
    // Remove zero inicial se tiver
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    cleanPhone = '+55' + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Normalizar telefone para WhatsApp (sem +)
 */
function normalizePhoneForWhatsApp(phone) {
  if (!phone) return null;
  
  let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Se não tem código do país, adiciona 55 (Brasil)
  if (!cleanPhone.startsWith('55')) {
    // Remove zero inicial se tiver
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    cleanPhone = '55' + cleanPhone;
  }
  
  return cleanPhone;
}

module.exports = {
  normalizePhone,
  normalizePhoneForWhatsApp
};

