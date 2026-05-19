import React, { useEffect, useRef } from 'react';
import { useAds } from '../contexts/AdsContext';
import { CustomAd } from './AdsAdmin';

interface AdPlacementProps {
  placementKey: string;
  className?: string;
  device?: 'all' | 'desktop' | 'mobile'; 
}

export default function AdPlacement({ placementKey, className = '', device = 'all' }: AdPlacementProps) {
  const { ads, loading } = useAds();

  if (loading) return null;

  const placementAds = ads.filter(ad => 
    ad.placement === placementKey && 
    (device === 'all' || ad.targetDevice === 'all' || ad.targetDevice === device)
  );

  if (placementAds.length === 0) return null;

  return (
    <>
      {placementAds.map(ad => (
        <AdRenderer key={ad.id} ad={ad} className={className} />
      ))}
    </>
  );
}

const AdRenderer = ({ ad, className }: { ad: CustomAd; className: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Do not attempt to render raw HTML for VAST tags or URLs directly
    if (ad.format === 'in-stream' && ad.code.startsWith('http')) {
      return;
    }

    container.innerHTML = '';
    
    // Inject via recreating script elements to ensure they execute
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = ad.code;
    
    Array.from(tempDiv.childNodes).forEach(node => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from((node as HTMLScriptElement).attributes).forEach(attr => {
          script.setAttribute(attr.name, attr.value);
        });
        if ((node as HTMLScriptElement).text) {
          script.text = (node as HTMLScriptElement).text;
        }
        container.appendChild(script);
      } else {
        container.appendChild(node.cloneNode(true));
      }
    });

  }, [ad.code, ad.format]);

  // If it's pure VAST URL, component shouldn't render visual blocks here 
  if (ad.format === 'in-stream' && ad.code.startsWith('http')) {
    return null;
  }

  return <div ref={containerRef} className={className} />;
};
