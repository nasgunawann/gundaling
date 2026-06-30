import React from 'react';

export default function NextImage({ src, width, quality = 75, alt, className }) {
  // Determine backend base URL dynamically (standard IP binding)
  const backendHost = window.location.hostname;
  const backendPort = '8000';
  const apiBase = `http://${backendHost}:${backendPort}`;

  // If the src is a web link, output directly; otherwise optimize through backend /image endpoint
  const isExternal = src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'));
  
  const optimizedSrc = isExternal 
    ? src 
    : `${apiBase}/api/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;

  return (
    <img 
      src={optimizedSrc || '/images/gundaling_milk.png'} 
      alt={alt || 'Food item'} 
      className={className} 
      loading="lazy" 
    />
  );
}
