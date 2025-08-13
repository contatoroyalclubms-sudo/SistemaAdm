/**
 * Data Validation System
 */

class Validator {
  constructor() {
    this.errors = [];
  }

  /**
   * Clear validation errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Get validation errors
   * @returns {Array} Validation errors
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Check if validation passed
   * @returns {boolean} True if no errors
   */
  isValid() {
    return this.errors.length === 0;
  }

  /**
   * Add validation error
   * @param {string} field - Field name
   * @param {string} message - Error message
   */
  addError(field, message) {
    this.errors.push({ field, message });
  }

  /**
   * Validate required field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  required(field, value, message = null) {
    if (value === null || value === undefined || value === '') {
      this.addError(field, message || `${field} é obrigatório`);
      return false;
    }
    return true;
  }

  /**
   * Validate email format
   * @param {string} field - Field name
   * @param {string} value - Email value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  email(field, value, message = null) {
    if (value && !this.isValidEmail(value)) {
      this.addError(field, message || `${field} deve ser um email válido`);
      return false;
    }
    return true;
  }

  /**
   * Validate phone number format
   * @param {string} field - Field name
   * @param {string} value - Phone value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  phone(field, value, message = null) {
    if (value && !this.isValidPhone(value)) {
      this.addError(field, message || `${field} deve ser um telefone válido`);
      return false;
    }
    return true;
  }

  /**
   * Validate CPF format
   * @param {string} field - Field name
   * @param {string} value - CPF value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  cpf(field, value, message = null) {
    if (value && !this.isValidCPF(value)) {
      this.addError(field, message || `${field} deve ser um CPF válido`);
      return false;
    }
    return true;
  }

  /**
   * Validate CNPJ format
   * @param {string} field - Field name
   * @param {string} value - CNPJ value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  cnpj(field, value, message = null) {
    if (value && !this.isValidCNPJ(value)) {
      this.addError(field, message || `${field} deve ser um CNPJ válido`);
      return false;
    }
    return true;
  }

  /**
   * Validate minimum length
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @param {number} minLength - Minimum length
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  minLength(field, value, minLength, message = null) {
    if (value && value.length < minLength) {
      this.addError(field, message || `${field} deve ter pelo menos ${minLength} caracteres`);
      return false;
    }
    return true;
  }

  /**
   * Validate maximum length
   * @param {string} field - Field name
   * @param {string} value - Field value
   * @param {number} maxLength - Maximum length
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  maxLength(field, value, maxLength, message = null) {
    if (value && value.length > maxLength) {
      this.addError(field, message || `${field} deve ter no máximo ${maxLength} caracteres`);
      return false;
    }
    return true;
  }

  /**
   * Validate numeric value
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  numeric(field, value, message = null) {
    if (value && isNaN(Number(value))) {
      this.addError(field, message || `${field} deve ser um número`);
      return false;
    }
    return true;
  }

  /**
   * Validate minimum value
   * @param {string} field - Field name
   * @param {number} value - Field value
   * @param {number} minValue - Minimum value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  minValue(field, value, minValue, message = null) {
    if (value !== null && value !== undefined && Number(value) < minValue) {
      this.addError(field, message || `${field} deve ser maior ou igual a ${minValue}`);
      return false;
    }
    return true;
  }

  /**
   * Validate maximum value
   * @param {string} field - Field name
   * @param {number} value - Field value
   * @param {number} maxValue - Maximum value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  maxValue(field, value, maxValue, message = null) {
    if (value !== null && value !== undefined && Number(value) > maxValue) {
      this.addError(field, message || `${field} deve ser menor ou igual a ${maxValue}`);
      return false;
    }
    return true;
  }

  /**
   * Validate URL format
   * @param {string} field - Field name
   * @param {string} value - URL value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  url(field, value, message = null) {
    if (value && !this.isValidURL(value)) {
      this.addError(field, message || `${field} deve ser uma URL válida`);
      return false;
    }
    return true;
  }

  /**
   * Validate date format
   * @param {string} field - Field name
   * @param {string} value - Date value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  date(field, value, message = null) {
    if (value && !this.isValidDate(value)) {
      this.addError(field, message || `${field} deve ser uma data válida`);
      return false;
    }
    return true;
  }

  /**
   * Validate array
   * @param {string} field - Field name
   * @param {Array} value - Array value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  array(field, value, message = null) {
    if (value && !Array.isArray(value)) {
      this.addError(field, message || `${field} deve ser um array`);
      return false;
    }
    return true;
  }

  /**
   * Validate object
   * @param {string} field - Field name
   * @param {Object} value - Object value
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  object(field, value, message = null) {
    if (value && (typeof value !== 'object' || Array.isArray(value))) {
      this.addError(field, message || `${field} deve ser um objeto`);
      return false;
    }
    return true;
  }

  /**
   * Validate custom function
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @param {Function} validator - Validation function
   * @param {string} message - Custom error message
   * @returns {boolean} True if valid
   */
  custom(field, value, validator, message = null) {
    if (!validator(value)) {
      this.addError(field, message || `${field} é inválido`);
      return false;
    }
    return true;
  }

  // Helper methods

  /**
   * Check if email is valid
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if phone is valid (Brazilian format)
   * @param {string} phone - Phone to validate
   * @returns {boolean} True if valid
   */
  isValidPhone(phone) {
    const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$/;
    return phoneRegex.test(phone);
  }

  /**
   * Check if CPF is valid
   * @param {string} cpf - CPF to validate
   * @returns {boolean} True if valid
   */
  isValidCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    
    // Check for known invalid CPFs
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    // Validate first digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;
    
    // Validate second digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;
    
    return true;
  }

  /**
   * Check if CNPJ is valid
   * @param {string} cnpj - CNPJ to validate
   * @returns {boolean} True if valid
   */
  isValidCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    
    // Check for known invalid CNPJs
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;
    
    // Validate first digit
    let sum = 0;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;
    
    // Validate second digit
    sum = 0;
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;
    
    return true;
  }

  /**
   * Check if URL is valid
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid
   */
  isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if date is valid
   * @param {string} date - Date to validate
   * @returns {boolean} True if valid
   */
  isValidDate(date) {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  }

  /**
   * Sanitize string
   * @param {string} str - String to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
  }

  /**
   * Sanitize phone number
   * @param {string} phone - Phone to sanitize
   * @returns {string} Sanitized phone
   */
  sanitizePhone(phone) {
    if (typeof phone !== 'string') return phone;
    return phone.replace(/\D/g, '');
  }

  /**
   * Sanitize CPF/CNPJ
   * @param {string} document - Document to sanitize
   * @returns {string} Sanitized document
   */
  sanitizeDocument(document) {
    if (typeof document !== 'string') return document;
    return document.replace(/\D/g, '');
  }
}

module.exports = Validator;
