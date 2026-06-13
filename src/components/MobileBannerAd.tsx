import { useEffect, useRef } from 'react';

export default function MobileBannerAd() {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adRef.current) {
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
  }, []);

  return (
    <div className="flex md:hidden justify-center w-full my-8 pointer-events-auto">
      <div 
        className="bg-[#141414]/95 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-white/5 backdrop-blur-xl w-[300px] min-h-[250px]"
      >
          <div ref={adRef} className="w-[300px] h-[250px] flex items-center justify-center" />
      </div>
    </div>
  );
}
