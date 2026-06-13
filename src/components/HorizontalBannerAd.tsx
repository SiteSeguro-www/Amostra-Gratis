import { useEffect, useRef } from 'react';

export default function HorizontalBannerAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current) {
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
  }, []);

  return (
    <div className="hidden md:flex justify-center w-full my-8 pointer-events-auto">
      <div 
        className="bg-[#141414]/95 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl w-[728px] min-h-[90px]"
      >
          <div ref={adRef} className="w-[728px] h-[90px] flex items-center justify-center" />
      </div>
    </div>
  );
}
