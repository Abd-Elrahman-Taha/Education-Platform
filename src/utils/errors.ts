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
  let backendMsg =
    error?.backendMessage ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.msg ||
    error?.response?.data?.details ||
    error?.raw?.message ||
    (typeof error?.response?.data === 'string' ? error?.response?.data : null) ||
    (typeof error === 'string' ? error : null) ||
    error?.rawMessage;

  if (!backendMsg && error?.response?.data?.errors) {
    const errs = error.response.data.errors;
    if (Array.isArray(errs)) {
      backendMsg = errs.map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join(' • ');
    } else if (typeof errs === 'object') {
      backendMsg = Object.values(errs).map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e))).join(' • ');
    }
  }

  const rawMsg = backendMsg || error?.message || '';
  const lowerMsg = String(rawMsg).toLowerCase().trim();

  // 1. HTTP Status Code: Auth & Session Revocation
  if (
    status === 401 ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('jwt expired') ||
    lowerMsg.includes('invalid token') ||
    lowerMsg.includes('token expired')
  ) {
    return 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً للمتابعة.';
  }

  if (
    status === 403 ||
    lowerMsg.includes('forbidden') ||
    lowerMsg.includes('access denied') ||
    lowerMsg.includes('device lock') ||
    lowerMsg.includes('suspendedmultidevice')
  ) {
    if (lowerMsg.includes('device') || lowerMsg.includes('جهاز') || lowerMsg.includes('multidevice')) {
      return 'تم تسجيل الدخول من جهاز آخر.';
    }
    if (lowerMsg.includes('grade') || lowerMsg.includes('تصحيح')) {
      return 'ليس لديك الصلاحية لتصحيح هذا الاختبار.';
    }
    return 'ليس لديك صلاحية لتنفيذ هذا الإجراء.';
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

  // 3. EXAMS: Publishing & Requirements
  if (
    lowerMsg.includes('cannot publish') ||
    lowerMsg.includes('without questions') ||
    lowerMsg.includes('zero questions') ||
    lowerMsg.includes('no questions') ||
    lowerMsg.includes('at least one question') ||
    lowerMsg.includes('least 1 question')
  ) {
    return 'لا يمكن نشر الاختبار بدون إضافة أسئلة. يرجى إضافة سؤال واحد على الأقل أولاً.';
  }

  if (
    (lowerMsg.includes('passing') && lowerMsg.includes('score')) ||
    lowerMsg.includes('passingscore') ||
    lowerMsg.includes('total points') ||
    lowerMsg.includes('exceed total') ||
    lowerMsg.includes('greater than total') ||
    lowerMsg.includes('less than passing')
  ) {
    if (
      lowerMsg.includes('exceed') ||
      lowerMsg.includes('greater') ||
      lowerMsg.includes('less') ||
      lowerMsg.includes('sum') ||
      lowerMsg.includes('total')
    ) {
      return 'مجموع درجات الأسئلة يجب أن يكون مساوياً لدرجة النجاح أو أكبر منها ليتمكن الطلاب من اجتياز الاختبار.';
    }
    if (
      lowerMsg.includes('required') ||
      lowerMsg.includes('positive') ||
      lowerMsg.includes('zero') ||
      lowerMsg.includes('invalid')
    ) {
      return 'درجة النجاح يجب أن تكون رقماً أكبر من صفر.';
    }
    return 'يرجى التأكد من تحديد درجة نجاح صالحة للاختبار.';
  }

  if (
    lowerMsg.includes('duration') &&
    (lowerMsg.includes('minute') ||
      lowerMsg.includes('zero') ||
      lowerMsg.includes('required') ||
      lowerMsg.includes('positive') ||
      lowerMsg.includes('invalid'))
  ) {
    return 'مدة الاختبار يجب أن تكون دقيقة واحدة على الأقل.';
  }

  // 4. EXAMS: Attempts & Student Status
  if (
    lowerMsg.includes('maximum number of attempts') ||
    lowerMsg.includes('max attempts') ||
    lowerMsg.includes('reached maximum') ||
    lowerMsg.includes('no attempts remaining') ||
    lowerMsg.includes('attempts exceeded')
  ) {
    return 'لقد استنفدت الحد الأقصى للمحاولات المسموح بها لهذا الاختبار.';
  }

  if (
    lowerMsg.includes('is closed') ||
    lowerMsg.includes('has been closed') ||
    lowerMsg.includes('exam closed')
  ) {
    return 'هذا الاختبار مغلق حالياً ولم يعد يستقبل محاولات جديدة.';
  }

  if (
    lowerMsg.includes('not published') ||
    lowerMsg.includes('is draft') ||
    lowerMsg.includes('only published exams') ||
    lowerMsg.includes('in draft')
  ) {
    return 'لا يمكن بدء الاختبار لأنه لا يزال في حالة مسودة وغير منشور للطلاب بعد.';
  }

  if (
    lowerMsg.includes('gated') ||
    lowerMsg.includes('previous lesson') ||
    lowerMsg.includes('complete the previous') ||
    lowerMsg.includes('prerequisite')
  ) {
    return 'هذا الاختبار مشروط، يجب اجتياز اختبار الدرس السابق أولاً لتتمكن من فتحه.';
  }

  if (
    lowerMsg.includes('not enrolled') ||
    lowerMsg.includes('must be enrolled')
  ) {
    return 'يجب أن تكون مشتركاً في هذا الكورس لتتمكن من تقديم هذا الاختبار.';
  }

  if (
    lowerMsg.includes('session expired') ||
    lowerMsg.includes('time expired') ||
    lowerMsg.includes('time is up') ||
    lowerMsg.includes('timer expired')
  ) {
    return 'انتهى الوقت المحدد للاختبار وتم تسليم إجاباتك تلقائياً.';
  }

  if (
    lowerMsg.includes('already submitted') ||
    lowerMsg.includes('attempt already')
  ) {
    return 'تم تسليم هذا الاختبار بالفعل مسبقاً.';
  }

  // 5. EXAMS & QUESTIONS: Protection Against Modifying Active Exams
  if (
    lowerMsg.includes('cannot modify') ||
    lowerMsg.includes('cannot edit') ||
    lowerMsg.includes('cannot delete') ||
    lowerMsg.includes('cannot add') ||
    lowerMsg.includes('has attempts') ||
    lowerMsg.includes('existing attempts') ||
    lowerMsg.includes('attempts exist') ||
    lowerMsg.includes('started attempts')
  ) {
    if (lowerMsg.includes('delete') && lowerMsg.includes('exam')) {
      return 'لا يمكن حذف هذا الاختبار لوجود محاولات طلاب مسجلة عليه. يمكنك إغلاق الاختبار بدلاً من حذفه.';
    }
    if (lowerMsg.includes('question') || lowerMsg.includes('سؤال') || lowerMsg.includes('orderindex')) {
      return 'لا يمكن إضافة، تعديل أو حذف أسئلة لاختبار بدأت عليه محاولات طلاب بالفعل لحماية درجاتهم.';
    }
    return 'لا يمكن تعديل إعدادات هذا الاختبار لوجود محاولات طلاب مسجلة عليه بالفعل حفاظاً على نزاهة الدرجات.';
  }

  if (
    (lowerMsg.includes('published') || lowerMsg.includes('is published')) &&
    (lowerMsg.includes('question') || lowerMsg.includes('modify') || lowerMsg.includes('cannot') || lowerMsg.includes('edit'))
  ) {
    return 'لا يمكن إضافة أو تعديل أسئلة اختبار منشور للطلاب حالياً. يرجى تحويل حالة الاختبار إلى مسودة (Draft) أولاً ثم إضافة الأسئلة.';
  }

  // 6. QUESTIONS: OrderIndex, Options & CorrectAnswer
  if (
    lowerMsg.includes('orderindex') ||
    lowerMsg.includes('order index') ||
    lowerMsg.includes('duplicate key') ||
    lowerMsg.includes('e11000')
  ) {
    return 'رقم ترتيب السؤال مكرر داخل هذا الاختبار، يرجى اختيار رقم ترتيب فريد.';
  }

  if (
    lowerMsg.includes('option') &&
    (lowerMsg.includes('least') ||
      lowerMsg.includes('minimum') ||
      lowerMsg.includes('contain') ||
      lowerMsg.includes('required') ||
      lowerMsg.includes('two'))
  ) {
    return 'يجب توفير خيارين على الأقل لسؤال الاختيار من متعدد.';
  }

  if (
    lowerMsg.includes('correctanswer') ||
    lowerMsg.includes('correct answer') ||
    lowerMsg.includes('match') ||
    lowerMsg.includes('one of the options') ||
    lowerMsg.includes('one of the choices')
  ) {
    return 'يجب أن تتطابق الإجابة الصحيحة تماماً مع أحد الخيارات المتاحة في السؤال.';
  }

  if (
    lowerMsg.includes('questiontext') ||
    (lowerMsg.includes('question') && lowerMsg.includes('text') && lowerMsg.includes('required'))
  ) {
    return 'يرجى كتابة نص السؤال.';
  }

  if (
    lowerMsg.includes('point') &&
    (lowerMsg.includes('positive') ||
      lowerMsg.includes('zero') ||
      lowerMsg.includes('greater') ||
      lowerMsg.includes('required') ||
      lowerMsg.includes('number'))
  ) {
    return 'درجات السؤال يجب أن تكون رقماً أكبر من صفر.';
  }

  // 7. GRADING ESSAYS
  if (
    lowerMsg.includes('score cannot exceed') ||
    lowerMsg.includes('exceed question points') ||
    lowerMsg.includes('exceed max points') ||
    lowerMsg.includes('greater than question points')
  ) {
    return 'الدرجة المعطاة لا يمكن أن تتجاوز الدرجة الكلية المخصصة لهذا السؤال.';
  }

  if (
    lowerMsg.includes('already been graded') ||
    lowerMsg.includes('already graded')
  ) {
    return 'تم تصحيح هذه المحاولة مسبقاً وتحديث درجات الطالب.';
  }

  // 8. NOT FOUND
  if (
    status === 404 ||
    lowerMsg.includes('not found') ||
    lowerMsg.includes('not exist') ||
    lowerMsg.includes('cannot find')
  ) {
    if (lowerMsg.includes('exam') || lowerMsg.includes('اختبار')) {
      return 'الاختبار المطلوب غير موجود في النظام.';
    }
    if (lowerMsg.includes('question') || lowerMsg.includes('سؤال')) {
      return 'السؤال المطلوب غير موجود.';
    }
    if (lowerMsg.includes('attempt') || lowerMsg.includes('محاولة')) {
      return 'محاولة الاختبار غير موجودة.';
    }
    if (lowerMsg.includes('course') || lowerMsg.includes('كورس')) {
      return 'الكورس المطلوب غير موجود.';
    }
    if (lowerMsg.includes('lesson') || lowerMsg.includes('درس')) {
      return 'الدرس المطلوب غير موجود.';
    }
    if (lowerMsg.includes('student') || lowerMsg.includes('user') || lowerMsg.includes('طالب')) {
      return 'حساب المستخدم غير موجود.';
    }
    if (fallback && !isTechnicalText(fallback) && /[\u0600-\u06FF]/.test(fallback)) {
      return fallback;
    }
    return 'العنصر المطلوب غير موجود في النظام.';
  }

  // 9. OTHER COMMON VALIDATION
  if (lowerMsg.includes('target user must be a student') || lowerMsg.includes('not a student')) {
    return 'لا يمكن تعديل هذا الحساب لأنه حساب مشرف وليس طالب.';
  }

  if (
    (lowerMsg.includes('phone') || lowerMsg.includes('mobile') || lowerMsg.includes('هاتف')) &&
    (lowerMsg.includes('exist') ||
      lowerMsg.includes('duplicate') ||
      lowerMsg.includes('already') ||
      lowerMsg.includes('in use') ||
      status === 409)
  ) {
    return 'رقم الهاتف مسجل مسبقاً لحساب آخر، يرجى استخدام رقم هاتف آخر.';
  }

  if (lowerMsg.includes('parentphone') || lowerMsg.includes('parent phone')) {
    return 'يرجى التأكد من كتابة رقم هاتف ولي الأمر صحيحاً (11 رقماً مصرياً يبدأ بـ 01).';
  }

  if (lowerMsg.includes('nationalid') || lowerMsg.includes('national_id') || lowerMsg.includes('رقم قومي')) {
    return 'يرجى التأكد من كتابة الرقم القومي صحيحاً (14 رقماً).';
  }

  if (
    lowerMsg.includes('invalid credentials') ||
    (lowerMsg.includes('password') && lowerMsg.includes('incorrect'))
  ) {
    return 'بيانات الدخول غير صحيحة، يرجى التأكد من رقم الهاتف وكلمة المرور.';
  }

  if (lowerMsg.includes('scratch') || lowerMsg.includes('voucher') || lowerMsg.includes('card code')) {
    return 'كود كارت الشحن غير صالح أو تم استخدامه مسبقاً.';
  }

  // 10. Rate Limiting
  if (status === 429 || lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) {
    return 'تم إرسال عدة طلبات في وقت قصير، يرجى الانتظار قليلاً ثم المحاولة مجدداً.';
  }

  // 11. Server Errors (5xx)
  if (status && status >= 500) {
    if (fallback && !isTechnicalText(fallback) && /[\u0600-\u06FF]/.test(fallback)) {
      return fallback;
    }
    return 'حدث خطأ في الخادم، يرجى المحاولة مرة أخرى لاحقاً.';
  }

  // 12. If message is already clean Arabic
  if (
    rawMsg &&
    /[\u0600-\u06FF]/.test(rawMsg) &&
    !isTechnicalText(rawMsg)
  ) {
    return rawMsg
      .replace(/الـ\s*backend/gi, 'النظام')
      .replace(/backend/gi, 'النظام')
      .replace(/سيرفر/gi, 'النظام')
      .replace(/الخادم/gi, 'الخدمة')
      .replace(/contract mismatch/gi, '')
      .replace(/\(device lock\)/gi, '')
      .trim();
  }

  // 13. Fallback Priority: Ensure 100% Arabic output
  if (fallback && !isTechnicalText(fallback) && /[\u0600-\u06FF]/.test(fallback)) {
    return fallback;
  }

  if (status === 400 || lowerMsg.includes('validation') || lowerMsg.includes('bad request')) {
    return 'البيانات المدخلة غير صحيحة أو غير مستوفية للشروط، يرجى مراجعة الحقول والمحاولة مجدداً.';
  }

  return 'تعذر إتمام العملية، يرجى التأكد من صحة البيانات والمحاولة مرة أخرى.';
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
