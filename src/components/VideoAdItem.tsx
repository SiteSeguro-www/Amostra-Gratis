import { useState, useEffect, useRef } from 'react';
import AdPlacement from './AdPlacement';

export default function VideoAdItem() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clickUrl, setClickUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    const fetchVast = async () => {
      try {
        const response = await fetch('https://s.magsrv.com/v1/vast.php?idzone=5920268');
        const xml = await response.text();
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "application/xml");
        
        const mediaFile = doc.querySelector('MediaFile')?.textContent;
        const clickThrough = doc.querySelector('ClickThrough')?.textContent;
        const impressions = Array.from(doc.querySelectorAll('Impression')).map(imp => imp.textContent);

        if (mediaFile) {
          setVideoUrl(mediaFile.trim());
          impressions.forEach(url => {
            if (url) {
              const img = new Image();
              img.src = url.trim();
            }
          });
        } else {
          setFallbackMode(true);
        }
        if (clickThrough) setClickUrl(clickThrough.trim());
      } catch (err) {
        console.error("Error loading Video Ad:", err);
        setFallbackMode(true);
      } finally {
        setLoading(false);
      }
    };

    // Timeout logic built-in to prevent infinite loading
    const timer = setTimeout(() => {
      if (loading) {
        setFallbackMode(true);
        setLoading(false);
      }
    }, 15000); // Increased to 15s to respect larger carousel durations

    fetchVast();

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="w-full h-full bg-[#0a0a0f] animate-pulse flex items-center justify-center border border-white/5 rounded-2xl min-h-[300px]">
      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Ad Carregando...</span>
    </div>;
  }

  if (fallbackMode || !videoUrl) {
    return (
      <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col items-center justify-center p-4 border border-white/5 rounded-2xl overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
           <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/20 blur-[120px] rounded-full" />
           <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-600/20 blur-[120px] rounded-full" />
        </div>

        <div className="z-10 flex flex-col items-center gap-4 w-full h-full justify-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="px-3 py-1 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em]">Oferta Exclusiva</span>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center rounded-2xl overflow-hidden shadow-2xl relative min-h-[250px]">
             <AdPlacement placementKey="feed-middle" className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-md" />
          </div>

          <div className="text-center mt-2">
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">Apoie nosso trabalho</h3>
          </div>
        </div>

        <div className="absolute top-4 right-4 z-30 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
             Ad
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full min-h-[300px] overflow-hidden cursor-pointer group bg-black rounded-2xl border border-white/5"
      onClick={() => clickUrl && window.open(clickUrl, '_blank')}
    >
      <video 
        src={videoUrl} 
        autoPlay 
        muted 
        loop 
        className="w-full h-full object-cover transition-transform duration-[10000ms] ease-out group-hover:scale-110"
        playsInline
      />
      
      {/* Ad Overlay */}
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
      
      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 pointer-events-none">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-3 py-1 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg">Patrocinado</span>
        </div>
        
        <h2 className="text-3xl md:text-5xl font-black mb-4 text-white tracking-tighter leading-none uppercase italic drop-shadow-2xl">
          Oferta Exclusiva
        </h2>
        
        <button className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform pointer-events-auto w-max">
           Saiba Mais
        </button>
      </div>

      <div className="absolute top-4 right-4 z-30 pointer-events-none">
         <div className="bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
            Ad
         </div>
      </div>
    </div>
  );
}

