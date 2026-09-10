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
    error?.backendMessage ||
    error?.rawMessage ||
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
    return 'المحتوى أو الحساب المطلوب غير موجود في النظام.';
  }

  if (status === 429 || lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) {
    return 'تم إرسال عدة طلبات في وقت قصير، يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
  }

  if (status >= 500) {
    if (fallback && !isTechnicalText(fallback)) return fallback;
    return 'حدث خطأ غير متوقع في الخادم، يرجى المحاولة مرة أخرى لاحقاً.';
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
  if (lowerMsg.includes('target user must be a student') || lowerMsg.includes('not a student') || lowerMsg.includes('cannot modify')) {
    return 'لا يمكن تعديل هذا الحساب لأنه حساب مشرف (مدير) وليس طالب.';
  }

  // Duplicate Phone or National ID
  if (
    (lowerMsg.includes('phone') || lowerMsg.includes('mobile') || lowerMsg.includes('هاتف')) &&
    (lowerMsg.includes('exist') || lowerMsg.includes('duplicate') || lowerMsg.includes('already') || lowerMsg.includes('in use') || status === 409)
  ) {
    return 'رقم الهاتف مسجل مسبقاً لحساب آخر، يرجى استخدام رقم هاتف آخر.';
  }

  if (lowerMsg.includes('parentphone') || lowerMsg.includes('parent phone')) {
    return 'يرجى التأكد من كتابة رقم هاتف ولي الأمر صحيحاً (11 رقماً مصرياً يبدأ بـ 01).';
  }

  if (lowerMsg.includes('e11000') || lowerMsg.includes('duplicate key')) {
    return 'البيانات المدخلة مسجلة مسبقاً في النظام (مثل رقم الهاتف أو الرقم القومي).';
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

  // 4. Bad Request / Validation Errors
  if (status === 400 || lowerMsg.includes('validation')) {
    if (fallback && !isTechnicalText(fallback)) return fallback;
    return 'البيانات المدخلة غير صحيحة أو غير مستوفية للشروط، يرجى مراجعة الحقول.';
  }

  // 5. Reject Technical / Cryptic text
  if (isTechnicalText(rawMsg)) {
    if (fallback && !isTechnicalText(fallback)) {
      return fallback;
    }
    return 'يرجى التأكد من صحة البيانات المدخلة والمحاولة مرة أخرى.';
  }

  // 6. If message is already clean Arabic (and not the generic default string)
  if (
    rawMsg &&
    /[\u0600-\u06FF]/.test(rawMsg) &&
    rawMsg !== 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.' &&
    rawMsg !== 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى لاحقاً.'
  ) {
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

  // 7. Default Fallback
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
