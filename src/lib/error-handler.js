/**
 * Advanced Error Handling System
 */

class ErrorHandler {
  constructor(logger) {
    this.logger = logger;
    this.errorCounts = new Map();
    this.maxErrorsPerMinute = 10;
  }

  /**
   * Handle and log error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @param {Object} metadata - Additional metadata
   */
  handleError(error, context = 'unknown', metadata = {}) {
    const errorKey = `${context}:${error.message}`;
    const now = Date.now();
    
    // Track error frequency
    if (!this.errorCounts.has(errorKey)) {
      this.errorCounts.set(errorKey, []);
    }
    
    const timestamps = this.errorCounts.get(errorKey);
    timestamps.push(now);
    
    // Remove old timestamps (older than 1 minute)
    const oneMinuteAgo = now - 60000;
    const recentErrors = timestamps.filter(timestamp => timestamp > oneMinuteAgo);
    this.errorCounts.set(errorKey, recentErrors);
    
    // Check if too many errors
    const isHighFrequency = recentErrors.length > this.maxErrorsPerMinute;
    
    // Enhanced error logging
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      metadata,
      timestamp: new Date().toISOString(),
      frequency: recentErrors.length,
      isHighFrequency,
      errorType: error.constructor.name
    };
    
    if (isHighFrequency) {
      this.logger.error('HIGH FREQUENCY ERROR:', errorInfo);
    } else {
      this.logger.error('Error occurred:', errorInfo);
    }
    
    // Return structured error response
    return {
      success: false,
      error: error.message,
      context,
      timestamp: errorInfo.timestamp,
      isHighFrequency
    };
  }

  /**
   * Handle async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Error context
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, context = 'async') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleError(error, context, { args: args.length });
      }
    };
  }

  /**
   * Create error response for API
   * @param {Error} error - Error object
   * @param {string} context - Error context
   * @returns {Object} API error response
   */
  createApiErrorResponse(error, context = 'api') {
    const errorInfo = this.handleError(error, context);
    
    return {
      success: false,
      error: errorInfo.error,
      message: this.getUserFriendlyMessage(error),
      context: errorInfo.context,
      timestamp: errorInfo.timestamp,
      requestId: this.generateRequestId()
    };
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(error) {
    const errorMessages = {
      'ENOTFOUND': 'Serviço temporariamente indisponível',
      'ECONNREFUSED': 'Erro de conexão com o servidor',
      'ETIMEDOUT': 'Tempo limite de conexão excedido',
      'ENOENT': 'Arquivo ou diretório não encontrado',
      'EACCES': 'Permissão negada',
      'ENOSPC': 'Espaço em disco insuficiente',
      'EMFILE': 'Muitos arquivos abertos',
      'ENOBUFS': 'Buffer insuficiente',
      'ECONNRESET': 'Conexão resetada pelo servidor',
      'EPIPE': 'Conexão quebrada',
      'EADDRINUSE': 'Porta já está em uso',
      'EADDRNOTAVAIL': 'Endereço não disponível',
      'ENETUNREACH': 'Rede inacessível',
      'EHOSTUNREACH': 'Host inacessível',
      'ECONNABORTED': 'Conexão abortada',
      'EFAULT': 'Erro de endereço inválido',
      'EINVAL': 'Argumento inválido',
      'ENOTSUP': 'Operação não suportada',
      'EISDIR': 'É um diretório',
      'ENOTDIR': 'Não é um diretório',
      'EEXIST': 'Arquivo já existe',
      'EXDEV': 'Dispositivo incorreto',
      'ENODEV': 'Dispositivo não existe',
      'EROFS': 'Sistema de arquivos somente leitura',
      'ENOSYS': 'Função não implementada',
      'EAGAIN': 'Tente novamente',
      'EWOULDBLOCK': 'Operação bloquearia',
      'EINPROGRESS': 'Operação em andamento',
      'EALREADY': 'Operação já em andamento',
      'ENOTSOCK': 'Socket inválido',
      'EDESTADDRREQ': 'Endereço de destino requerido',
      'EMSGSIZE': 'Mensagem muito longa',
      'EPROTOTYPE': 'Tipo de protocolo incorreto',
      'ENOPROTOOPT': 'Opção de protocolo não disponível',
      'EPROTONOSUPPORT': 'Protocolo não suportado',
      'ESOCKTNOSUPPORT': 'Tipo de socket não suportado',
      'EOPNOTSUPP': 'Operação não suportada',
      'EPFNOSUPPORT': 'Família de protocolo não suportada',
      'EAFNOSUPPORT': 'Família de endereço não suportada',
      'EADDRINUSE': 'Endereço já em uso',
      'EADDRNOTAVAIL': 'Endereço não disponível',
      'ENETDOWN': 'Rede está inativa',
      'ENETUNREACH': 'Rede inacessível',
      'ENETRESET': 'Rede foi resetada',
      'ECONNABORTED': 'Conexão abortada',
      'ECONNRESET': 'Conexão resetada pelo peer',
      'ENOBUFS': 'Sem buffer disponível',
      'EISCONN': 'Socket já está conectado',
      'ENOTCONN': 'Socket não está conectado',
      'ESHUTDOWN': 'Socket foi fechado',
      'ETOOMANYREFS': 'Muitas referências',
      'ETIMEDOUT': 'Tempo limite de conexão',
      'ECONNREFUSED': 'Conexão recusada',
      'ELOOP': 'Muitos níveis de links simbólicos',
      'ENAMETOOLONG': 'Nome de arquivo muito longo',
      'EHOSTDOWN': 'Host está inativo',
      'EHOSTUNREACH': 'Host inacessível',
      'ENOTEMPTY': 'Diretório não está vazio',
      'EPROCLIM': 'Muitos processos',
      'EUSERS': 'Muitos usuários',
      'EDQUOT': 'Cota de disco excedida',
      'ESTALE': 'Referência obsoleta',
      'EREMOTE': 'Objeto é remoto',
      'EBADRPC': 'RPC incorreto',
      'ERPCMISMATCH': 'Versão RPC incorreta',
      'EPROGUNAVAIL': 'Programa RPC indisponível',
      'EPROGMISMATCH': 'Versão do programa RPC incorreta',
      'EPROCUNAVAIL': 'Procedimento RPC indisponível',
      'ENOLCK': 'Sem locks disponíveis',
      'ENOSYS': 'Função não implementada',
      'EFTYPE': 'Tipo de arquivo incorreto',
      'EAUTH': 'Erro de autenticação',
      'ENEEDAUTH': 'Autenticação necessária',
      'EPWROFF': 'Dispositivo está desligado',
      'EDEVERR': 'Erro de dispositivo',
      'EOVERFLOW': 'Valor muito grande para tipo de dados',
      'EBADEXEC': 'Executável incorreto',
      'EBADARCH': 'Arquitetura incorreta',
      'ESHLIBVERS': 'Versão de biblioteca compartilhada incorreta',
      'EBADMACHO': 'Formato Mach-O incorreto',
      'ECANCELED': 'Operação cancelada',
      'EIDRM': 'Identificador removido',
      'ENOMSG': 'Sem mensagem do tipo desejado',
      'EILSEQ': 'Sequência ilegal de bytes',
      'ENOATTR': 'Atributo não encontrado',
      'EBADMSG': 'Mensagem incorreta',
      'EMULTIHOP': 'Múltiplos saltos não permitidos',
      'ENODATA': 'Sem dados disponíveis',
      'ENOLINK': 'Link foi perdido',
      'ENOSR': 'Sem recursos de stream',
      'ENOSTR': 'Não é um stream',
      'EPROTO': 'Erro de protocolo',
      'ETIME': 'Tempo limite de timer',
      'EOPNOTSUPP': 'Operação não suportada',
      'ENOTRECOVERABLE': 'Estado não recuperável',
      'EOWNERDEAD': 'Proprietário anterior morreu',
      'ESTRPIPE': 'Stream pipe'
    };
    
    return errorMessages[error.code] || 'Ocorreu um erro inesperado. Tente novamente.';
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: 0,
      highFrequencyErrors: 0,
      errorTypes: {},
      contexts: {},
      timestamp: new Date().toISOString()
    };
    
    for (const [errorKey, timestamps] of this.errorCounts) {
      const [context, message] = errorKey.split(':');
      const recentErrors = timestamps.filter(timestamp => timestamp > Date.now() - 60000);
      
      stats.totalErrors += recentErrors.length;
      
      if (recentErrors.length > this.maxErrorsPerMinute) {
        stats.highFrequencyErrors++;
      }
      
      stats.contexts[context] = (stats.contexts[context] || 0) + recentErrors.length;
      stats.errorTypes[message] = (stats.errorTypes[message] || 0) + recentErrors.length;
    }
    
    return stats;
  }

  /**
   * Clear old error records
   */
  clearOldErrors() {
    const oneHourAgo = Date.now() - 3600000;
    
    for (const [errorKey, timestamps] of this.errorCounts) {
      const recentErrors = timestamps.filter(timestamp => timestamp > oneHourAgo);
      if (recentErrors.length === 0) {
        this.errorCounts.delete(errorKey);
      } else {
        this.errorCounts.set(errorKey, recentErrors);
      }
    }
  }
}

module.exports = ErrorHandler;
