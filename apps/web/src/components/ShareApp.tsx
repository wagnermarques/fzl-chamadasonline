import { useState } from "react";

export function ShareApp() {
  const [copied, setCopied] = useState(false);

  // Determina a URL base do PWA no GitHub Pages ou localmente
  const appUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/`
      : "https://wagnermarques.github.io/fzl-chamadasonline/";

  const shareTitle = "Chamada Online";
  const shareText =
    "Acesse o Chamada Online para confirmar sua presença na aula/evento:";
  const fullShareText = `${shareText} ${appUrl}`;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        // Usuário cancelou ou navegador rejeitou o share nativo
        if ((err as Error).name !== "AbortError") {
          console.warn("Erro ao compartilhar nativamente:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(appUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <div className="w-full max-w-sm rounded-xl bg-slate-800/80 border border-slate-700/80 p-4 space-y-3 shadow-lg text-center">
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Compartilhar Este App
        </h3>
        <p className="text-xs text-slate-400">
          Envie o link do app para seus colegas de turma marcarem presença
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs transition shadow-sm"
        >
          {/* WhatsApp SVG Icon */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.669-.699c.969.586 1.761.88 2.79.88 3.179 0 5.766-2.587 5.767-5.766.001-3.187-2.575-5.766-5.766-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.802 0-3.486-.481-4.945-1.317l-5.055 1.379 1.399-4.931c-.896-1.503-1.4-3.256-1.4-5.131 0-5.514 4.486-10 10-10 5.514 0 10 4.486 10 10z" />
          </svg>
          WhatsApp
        </a>

        {/* Telegram Button */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-medium text-xs transition shadow-sm"
        >
          {/* Telegram SVG Icon */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.923z" />
          </svg>
          Telegram
        </a>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-semibold">Link Copiado!</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar Link
            </>
          )}
        </button>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="py-1.5 px-3 rounded-lg bg-slate-700/70 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5"
            title="Mais opções de compartilhamento"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Mais
          </button>
        )}
      </div>
    </div>
  );
}
