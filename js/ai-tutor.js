/* ==========================================================================
   Syntax EdTech - Syntax AI Floating Assistant Widget & Avatar JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initAITutor();
});

function initAITutor() {
  const triggerBtn = document.getElementById('ai-trigger-btn');
  const chatWindow = document.getElementById('ai-chat-window');
  const sendBtn = document.getElementById('ai-send-btn');
  const inputField = document.getElementById('ai-input-field');
  const chatMessages = document.getElementById('ai-chat-messages');

  if (triggerBtn && chatWindow) {
    triggerBtn.addEventListener('click', () => {
      chatWindow.classList.toggle('active');
    });
  }

  if (sendBtn && inputField) {
    sendBtn.addEventListener('click', () => {
      handleUserMessage();
    });

    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleUserMessage();
    });
  }

  function handleUserMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    // Append user bubble
    appendMessage(text, 'user');
    inputField.value = '';

    // Simulate AI response stream
    setTimeout(() => {
      const botResponse = generateAIResponse(text);
      appendMessage(botResponse, 'bot');
    }, 600);
  }

  function appendMessage(text, sender) {
    if (!chatMessages) return;
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    bubble.innerText = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function generateAIResponse(userText) {
    const responses = [
      "أهلاً بك! بناءً على محتوى المحاضرة الثانية في الفيزياء الحديثة، فإن معادلة أينشتاين للظاهرة الكهرودوئية تعتمد على تردد الضوء الساقط ودالة الشغل للمعدن.",
      "سؤال ممتاز! يمكنك مراجعة قانون أوم للدائرة المغلقة في الصفحة 14 من كتاب الفيزياء، أو يمكنني توليد 3 أسئلة سريعة لك للتدريب عليها الآن.",
      "تم تحليل سؤالك بواسطة نموذج Syntax AI RAG. الإجابة هي: التغير في الفيض المغناطيسي يولد قوة دافعة كهربية مستحثة حسب قانون فاراداي.",
      "أهلاً يا بطل! تم تحديث تقريرك وإخطار ولي الأمر بنجاحك في امتحان الدرس السابق بنسبة 95%."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
}
