import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, RotateCcw, X, 
  Sparkles, Leaf, ShieldCheck, HeartPulse, Truck
} from 'lucide-react';

interface ProductImageZoomShowcaseProps {
  activeImageSrc?: string;
  allGalleryImages: string[];
  activeImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  apiUrl: string;
  productName: string;
  category?: string;
  discountPercent?: number;
  verifiedImagesMap?: Record<string, string>;
}

export const ProductImageZoomShowcase: React.FC<ProductImageZoomShowcaseProps> = ({
  activeImageSrc,
  allGalleryImages,
  activeImageIndex,
  onSelectImageIndex,
  apiUrl,
  productName,
  category = '',
  discountPercent = 0,
  verifiedImagesMap = {}
}) => {
  // Smooth Inner Zoom & Hover State
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ xPercent: 50, yPercent: 50 });
  const [imageError, setImageError] = useState(false);

  // Fullscreen Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1.6);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset error when switching images
  useEffect(() => {
    setImageError(false);
  }, [activeImageSrc, activeImageIndex]);

  // Resolve true image URL
  const resolveUrl = useCallback((src?: string): string => {
    const raw = (src && src.trim() !== '') ? src : (productName ? verifiedImagesMap[productName] : undefined);
    if (!raw) return '';
    if (!raw.startsWith('/') && !raw.startsWith('http') && raw.length <= 4) return ''; // Emoji
    const baseUrl = apiUrl.endsWith('/api') ? apiUrl.slice(0, -4) : apiUrl;
    return raw.startsWith('http') ? raw : `${baseUrl}${raw}`;
  }, [productName, verifiedImagesMap, apiUrl]);

  const resolvedUrl = resolveUrl(activeImageSrc);
  const isEmoji = activeImageSrc && !activeImageSrc.startsWith('/') && !activeImageSrc.startsWith('http') && activeImageSrc.length <= 4;

  // Handle Mouse Movement over Image for smooth inner focal zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setMousePos({
      xPercent: Math.max(0, Math.min(100, (x / rect.width) * 100)),
      yPercent: Math.max(0, Math.min(100, (y / rect.height) * 100))
    });
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === '+' || e.key === '=') {
        setLightboxScale(s => Math.min(5, +(s + 0.5).toFixed(1)));
      } else if (e.key === '-') {
        setLightboxScale(s => Math.max(1, +(s - 0.5).toFixed(1)));
      } else if (e.key === 'ArrowRight' && allGalleryImages.length > 1) {
        onSelectImageIndex((activeImageIndex + 1) % allGalleryImages.length);
      } else if (e.key === 'ArrowLeft' && allGalleryImages.length > 1) {
        onSelectImageIndex((activeImageIndex - 1 + allGalleryImages.length) % allGalleryImages.length);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, allGalleryImages, activeImageIndex, onSelectImageIndex]);

  // Lightbox Mouse Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - lightboxOffset.x, y: e.clientY - lightboxOffset.y });
  };

  const handleMouseMoveLightbox = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setLightboxOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.25 : 0.25;
    setLightboxScale(s => Math.max(1, Math.min(5, +(s + delta).toFixed(2))));
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Clean Studio Product Canvas */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onClick={() => {
          if (resolvedUrl && !imageError) {
            setLightboxScale(1.6);
            setLightboxOffset({ x: 0, y: 0 });
            setIsLightboxOpen(true);
          }
        }}
        className={`w-full aspect-square max-h-[380px] sm:max-h-[440px] bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 rounded-3xl flex items-center justify-center overflow-hidden mb-3.5 relative select-none transition-all duration-300 group shadow-xs hover:shadow-md ${
          resolvedUrl && !imageError ? 'cursor-zoom-in' : ''
        }`}
      >
        {/* Render Product Image with Fluid Smooth Hover Zoom */}
        {resolvedUrl && !imageError ? (
          <img
            src={resolvedUrl}
            alt={productName}
            onError={() => setImageError(true)}
            className="h-full w-full object-contain p-4 sm:p-6 select-none transition-transform duration-300 ease-out will-change-transform"
            style={
              isHovered ? {
                transform: 'scale(1.35)',
                transformOrigin: `${mousePos.xPercent}% ${mousePos.yPercent}%`
              } : {
                transform: 'scale(1)',
                transformOrigin: '50% 50%'
              }
            }
          />
        ) : isEmoji ? (
          <span className="text-8xl select-none">{activeImageSrc}</span>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center mb-3">
              <Sparkles className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {category || 'Clinical Nutrition'}
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-3.5 left-3.5 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm tracking-wider pointer-events-none z-10">
            {discountPercent}% OFF
          </span>
        )}

        {/* Clean Discreet Fullscreen Button */}
        {resolvedUrl && !imageError && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxScale(1.6);
              setLightboxOffset({ x: 0, y: 0 });
              setIsLightboxOpen(true);
            }}
            className="absolute top-3.5 right-3.5 h-8 w-8 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shadow-xs backdrop-blur-md transition-all z-10 cursor-pointer hover:scale-105 active:scale-95"
            title="Inspect in Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Modern Thumbnails Row */}
      {allGalleryImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto w-full pb-2 mb-3.5 scrollbar-none justify-center">
          {allGalleryImages.map((img, idx) => {
            const thumbUrl = resolveUrl(img);
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setImageError(false);
                  onSelectImageIndex(idx);
                }}
                className={`h-14 w-14 shrink-0 rounded-xl border-2 overflow-hidden bg-white dark:bg-slate-900 p-1 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
                title={`View image ${idx + 1}`}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-base flex items-center justify-center h-full">📦</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Sleek Trust Highlights Row */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
          <Leaf className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">100% Whole Food</span>
            <span className="text-[9px] text-slate-400 block truncate">Unadulterated</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">Lab Certified</span>
            <span className="text-[9px] text-slate-400 block truncate">Zero Chemicals</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
          <HeartPulse className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">Metabolic Grade</span>
            <span className="text-[9px] text-slate-400 block truncate">Dietitian Pick</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
          <Truck className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate leading-tight">Direct Dispatch</span>
            <span className="text-[9px] text-slate-400 block truncate">Fresh Mill Batch</span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL (Supports both Light and Dark Themes) */}
      {isLightboxOpen && resolvedUrl && (
        <div 
          className="fixed inset-0 z-50 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl flex flex-col select-none animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 shrink-0 bg-white/90 dark:bg-slate-900/90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Close (Esc)</span>
              </button>
              <div>
                <h4 className="text-slate-900 dark:text-white text-sm font-bold truncate max-w-xs sm:max-w-md">
                  {productName}
                </h4>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Image {activeImageIndex + 1} of {allGalleryImages.length || 1} • High-Resolution View
                </p>
              </div>
            </div>

            {/* Lightbox Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxScale(s => Math.max(1, +(s - 0.5).toFixed(1)))}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-white px-2 min-w-[50px] text-center">
                {Math.round(lightboxScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setLightboxScale(s => Math.min(5, +(s + 0.5).toFixed(1)))}
                className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxScale(1);
                  setLightboxOffset({ x: 0, y: 0 });
                }}
                className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive Drag & Pan Viewport */}
          <div 
            className="flex-1 w-full overflow-hidden flex items-center justify-center relative p-4 bg-slate-100/50 dark:bg-slate-950/50 cursor-grab active:cursor-grabbing"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveLightbox}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              src={resolvedUrl}
              alt={productName}
              draggable={false}
              className="max-h-full max-w-full object-contain select-none transition-transform duration-75"
              style={{
                transform: `translate(${lightboxOffset.x}px, ${lightboxOffset.y}px) scale(${lightboxScale})`,
              }}
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-[11px] font-medium px-4 py-1.5 rounded-full pointer-events-none border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-2">
              <span>Scroll wheel to zoom</span>
              <span>•</span>
              <span>Click & drag to pan</span>
            </div>
          </div>

          {/* Bottom Thumbnails in Lightbox */}
          {allGalleryImages.length > 1 && (
            <div 
              className="p-3 bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex justify-center gap-2.5 overflow-x-auto shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              {allGalleryImages.map((img, idx) => {
                const thumbUrl = resolveUrl(img);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectImageIndex(idx);
                      setLightboxScale(1.6);
                      setLightboxOffset({ x: 0, y: 0 });
                    }}
                    className={`h-14 w-14 rounded-xl border-2 overflow-hidden bg-white dark:bg-slate-800 p-1 transition-all cursor-pointer ${
                      activeImageIndex === idx 
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-105' 
                        : 'border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-sm flex items-center justify-center h-full">📦</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
