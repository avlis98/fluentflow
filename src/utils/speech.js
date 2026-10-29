// Utilitário de Voz (Text-to-Speech e Speech-to-Text via Web Speech API)

export function speakText(text, { rate = 1.0, accent = 'en-US', onEnd, onStart } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.lang = accent;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    // Prioriza vozes naturais/Google/Microsoft no sotaque selecionado
    const preferredVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes(accent.toLowerCase()) &&
          (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Online'))
      ) ||
      voices.find((v) => v.lang.toLowerCase().includes(accent.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function createSpeechRecognition({ lang = 'en-US', onResult, onError, onEnd } = {}) {
  if (typeof window === 'undefined') return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;

  const recognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    let transcript = '';
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        isFinal = true;
      }
    }
    if (onResult) onResult(transcript, isFinal);
  };

  recognition.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognition.onend = () => {
    if (onEnd) onEnd();
  };

  return recognition;
}
