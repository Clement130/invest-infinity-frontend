import { useEffect, useRef } from 'react';

export function LeadboosterLoader() {
  const configRef = useRef<HTMLScriptElement | null>(null);
  const loaderRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    // 1) Injecter la config Leadbooster dans le <head>
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.innerHTML = `
      window.pipedriveLeadboosterConfig = {
        base: 'leadbooster-chat.pipedrive.com',
        companyId: 14970452,
        playbookUuid: '6f39c25a-0282-489d-8547-3b7749d72876',
        version: 2
      };
      (function () {
        var w = window;
        if (w.LeadBooster) {
          console.warn('LeadBooster already exists');
        } else {
          w.LeadBooster = {
            q: [],
            on: function (n, h) { this.q.push({ t: 'o', n: n, h: h }); },
            trigger: function (n) { this.q.push({ t: 't', n: n }); }
          };
        }
      })();
    `;
    document.head.appendChild(configScript);
    configRef.current = configScript;

    // 2) Injecter le loader Leadbooster
    const loaderScript = document.createElement('script');
    loaderScript.src = 'https://leadbooster-chat.pipedrive.com/assets/loader.js';
    loaderScript.async = true;
    document.head.appendChild(loaderScript);
    loaderRef.current = loaderScript;

    return () => {
      // 3) Cleanup : on retire la config + le loader
      if (loaderRef.current) {
        document.head.removeChild(loaderRef.current);
      }
      if (configRef.current) {
        document.head.removeChild(configRef.current);
      }
      // 4) Si l'iframe existe déjà, on la supprime
      const iframe = document.getElementById('LeadboosterContainer');
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
  }, []);

  return null; // Ce composant n'affiche rien visuellement
}
