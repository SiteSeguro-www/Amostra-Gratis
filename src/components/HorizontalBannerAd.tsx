import { useEffect, useRef, useState } from 'react';

export default function HorizontalBannerAd() {
  const adRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchVast = async () => {
      try {
        const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=5920268');
        const xml = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        const mediaFile = doc.querySelector('MediaFile')?.textContent;
        const impressions = Array.from(doc.querySelectorAll('Impression')).map(imp => imp.textContent);

        if (mediaFile && isMounted) {
          setVideoUrl(mediaFile.trim());
          impressions.forEach(url => {
            if (url) {
              const img = new Image();
              img.src = url.trim();
            }
          });
        } else if (isMounted) {
           setFallbackMode(true);
        }
      } catch (err) {
        if (isMounted) setFallbackMode(true);
      }
    };

    fetchVast();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (fallbackMode && adRef.current) {
      adRef.current.innerHTML = '';
      const script1 = document.createElement('script');
      script1.type = 'text/javascript';
      script1.innerHTML = `
        window.atOptions = {
          'key' : '522b21a4c1dd8d4dc41ce8d9ad4e4976',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      const script2 = document.createElement('script');
      script2.type = 'text/javascript';
      script2.src = 'https://www.highperformanceformat.com/522b21a4c1dd8d4dc41ce8d9ad4e4976/invoke.js';
      
      adRef.current.appendChild(script1);
      adRef.current.appendChild(script2);
    }
  }, [fallbackMode]);

  return (
    <div className="hidden md:flex justify-center w-full my-8 pointer-events-auto">
      <div 
        className="bg-[#141414]/95 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl"
        style={!fallbackMode && videoUrl ? { width: '728px', height: 'auto' } : { width: '728px', minHeight: '90px' }}
      >
        {!fallbackMode && videoUrl ? (
          <video 
            src={videoUrl} 
            autoPlay 
            muted 
            controls
            className="w-full h-auto object-contain max-h-[410px]"
            playsInline
            webkit-playsinline="true"
          />
        ) : fallbackMode ? (
          <div ref={adRef} className="w-[728px] h-[90px] flex items-center justify-center" />
        ) : (
          <span className="text-[10px] text-white/10 uppercase tracking-[0.5em] font-black h-[90px] flex items-center">Carregando Publicidade...</span>
        )}
      </div>
    </div>
  );
}
