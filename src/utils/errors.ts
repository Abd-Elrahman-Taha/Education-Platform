/**
 * Centralized User-Friendly Error Formatting Utility.
 * Ensures all user-facing error messages are simple, polite, clear, and actionable in Arabic.
 * Eliminates technical jargon, backend blaming, and unreadable stack traces.
 */

export function getFriendlyErrorMessage(error: any, fallback?: string): string {
  if (!error && !fallback) {
    return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
  }

  const status = error?.status || error?.response?.status;
  const rawMsg =
    (typeof error === 'string' ? error : null) ||
    error?.message ||
    error?.raw?.message ||
    error?.response?.data?.message ||
    '';

  const lowerMsg = String(rawMsg).toLowerCase();

  // 1. HTTP Status Code Mappings
  if (status === 401 || lowerMsg.includes('unauthorized') || lowerMsg.includes('jwt expired') || lowerMsg.includes('invalid token')) {
    return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً للمتابعة.';
  }

  if (status === 403 || lowerMsg.includes('forbidden') || lowerMsg.includes('device lock') || lowerMsg.includes('access denied')) {
    return 'تم تسجيل الدخول من جهاز آخر أو ليس لديك صلاحية للوصول.';
  }

  if (status === 404 || lowerMsg.includes('not found') || lowerMsg.includes('not exist')) {
    if (fallback && !isTechnicalText(fallback)) return fallback;
    return 'المحتوى أو العنصر المطلوب غير متوفر حالياً.';
  }

  if (status === 429 || lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) {
    return 'تم إرسال عدة طلبات في وقت قصير، يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
  }

  if (status >= 500) {
    if (fallback && !isTechnicalText(fallback)) return fallback;
    return 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقاً.';
  }

  // 2. Network / Connectivity Errors
  if (
    lowerMsg.includes('network error') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('econnaborted') ||
    lowerMsg.includes('err_network') ||
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('offline')
  ) {
    return 'يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.';
  }

  // 3. Domain Specific Rules
  // Duplicate Phone or National ID
  if (
    (lowerMsg.includes('phone') || lowerMsg.includes('mobile') || lowerMsg.includes('هاتف')) &&
    (lowerMsg.includes('exist') || lowerMsg.includes('duplicate') || lowerMsg.includes('already') || status === 409)
  ) {
    return 'رقم الهاتف مسجل مسبقاً، يرجى تسجيل الدخول أو استخدام رقم آخر.';
  }

  if (lowerMsg.includes('e11000') || lowerMsg.includes('duplicate key')) {
    return 'البيانات المدخلة مسجلة مسبقاً (مثل رقم الهاتف أو الرقم القومي).';
  }

  if (lowerMsg.includes('nationalid') || lowerMsg.includes('national_id') || lowerMsg.includes('رقم قومي')) {
    return 'يرجى التأكد من كتابة الرقم القومي صحيحاً (14 رقماً).';
  }

  // Password / Credentials
  if (lowerMsg.includes('invalid credentials') || (lowerMsg.includes('password') && lowerMsg.includes('incorrect'))) {
    return 'بيانات الدخول غير صحيحة، يرجى التأكد من رقم الهاتف وكلمة المرور.';
  }

  // Scratch Card
  if (lowerMsg.includes('scratch') || lowerMsg.includes('voucher') || lowerMsg.includes('card code')) {
    return 'كود كارت الشحن غير صالح أو تم استخدامه مسبقاً.';
  }

  // 4. Reject Technical / Cryptic text
  if (isTechnicalText(rawMsg)) {
    if (fallback && !isTechnicalText(fallback)) {
      return fallback;
    }
    return 'يرجى التأكد من صحة البيانات المدخلة والمحاولة مرة أخرى.';
  }

  // 5. If message is already clean Arabic, return it
  if (rawMsg && /[\u0600-\u06FF]/.test(rawMsg)) {
    // Clean any lingering technical words inside Arabic text
    let sanitized = rawMsg
      .replace(/الـ\s*backend/gi, 'النظام')
      .replace(/backend/gi, 'النظام')
      .replace(/سيرفر/gi, 'النظام')
      .replace(/الخادم/gi, 'الخدمة')
      .replace(/contract mismatch/gi, '')
      .replace(/\(device lock\)/gi, '')
      .trim();
    return sanitized;
  }

  // 6. Default Fallback
  return fallback && !isTechnicalText(fallback)
    ? fallback
    : 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.';
}

/**
 * Checks if a string contains backend jargon or technical errors
 */
function isTechnicalText(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  const t = text.toLowerCase();
  const technicalTerms = [
    'internal server error',
    'status code',
    'request failed',
    'failed with status',
    'axios',
    'objectid',
    'cast to',
    'validation failed',
    'mongo',
    'mongoose',
    'database',
    'backend',
    'خادم',
    'سيرفر',
    'عقد',
    'contract',
    'schema',
    'jwt',
    'unhandled',
    '[object object]',
    'undefined',
    'null pointer',
    'syntaxerror',
    'referenceerror',
    'typeerror',
    'exception',
    'stack trace',
    'cors',
  ];

  return technicalTerms.some((term) => t.includes(term));
}
