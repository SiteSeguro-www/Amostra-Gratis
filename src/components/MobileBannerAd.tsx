import { useEffect, useRef, useState } from 'react';

export default function MobileBannerAd() {
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
          'key' : '127a5cb8bbc9df2492b630fca9793ab2',
          'format' : 'iframe',
          'height' : 250,
          'width' : 300,
          'params' : {}
        };
      `;
      const script2 = document.createElement('script');
      script2.type = 'text/javascript';
      script2.src = 'https://www.highperformanceformat.com/127a5cb8bbc9df2492b630fca9793ab2/invoke.js';
      
      adRef.current.appendChild(script1);
      adRef.current.appendChild(script2);
    }
  }, [fallbackMode]);

  return (
    <div className="flex md:hidden justify-center w-full my-8 pointer-events-auto">
      <div 
        className="bg-[#141414]/95 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl"
        style={!fallbackMode && videoUrl ? { width: '300px', height: 'auto' } : { width: '300px', minHeight: '250px' }}
      >
        {!fallbackMode && videoUrl ? (
          <video 
            src={videoUrl} 
            autoPlay 
            muted 
            controls
            className="w-full h-auto object-contain max-h-[300px]"
            playsInline
            webkit-playsinline="true"
          />
        ) : fallbackMode ? (
          <div ref={adRef} className="w-[300px] h-[250px] flex items-center justify-center" />
        ) : (
          <span className="text-[10px] text-white/10 uppercase tracking-[0.5em] font-black h-[250px] flex items-center">Carregando Publicidade...</span>
        )}
      </div>
    </div>
  );
}
