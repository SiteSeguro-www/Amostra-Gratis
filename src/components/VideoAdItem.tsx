import HorizontalBannerAd from './HorizontalBannerAd';
import MobileBannerAd from './MobileBannerAd';

export default function VideoAdItem() {
  return (
    <div className="relative w-full h-full bg-[#0a0a0f] flex flex-col items-center justify-center p-4 border border-white/5 rounded-2xl overflow-hidden min-h-[300px] cursor-default pointer-events-auto">
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-purple-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="z-10 flex flex-col items-center gap-4 w-full h-full justify-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="px-3 py-1 bg-white text-black text-[10px] font-black rounded-full uppercase tracking-[0.2em]">Sponsor</span>
        </div>

        <div className="w-full flex-1 flex flex-col items-center justify-center rounded-2xl overflow-hidden relative">
           <HorizontalBannerAd />
           <MobileBannerAd />
        </div>

        <div className="text-center mt-2">
           <h3 className="text-xl font-black text-white uppercase tracking-tighter">Publicidade</h3>
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

