import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize2, RotateCcw, X, 
  Sparkles, Leaf, ShieldCheck, HeartPulse, Truck, Layers
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
  // Magnifier & Hover State
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({
    x: 0,
    y: 0,
    xPercent: 50,
    yPercent: 50,
    width: 400,
    height: 400
  });
  const [zoomLevel, setZoomLevel] = useState<number>(2.8); // 2.8x default
  const [zoomMode, setZoomMode] = useState<'side' | 'inner'>('side'); // Flipkart/Amazon side zoom vs inner loupe
  const [imageError, setImageError] = useState(false);

  // Fullscreen Lightbox Modal State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1.6);
  const [lightboxOffset, setLightboxOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Default to inner zoom on small mobile screens
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setZoomMode('inner');
    }
  }, []);

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

  // Handle Mouse Movement over Image
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setMousePos({
      x,
      y,
      xPercent,
      yPercent,
      width: rect.width,
      height: rect.height
    });
  };

  // Handle Mobile Touch Movement
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
    const xPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const yPercent = Math.max(0, Math.min(100, (y / rect.height) * 100));

    setMousePos({
      x,
      y,
      xPercent,
      yPercent,
      width: rect.width,
      height: rect.height
    });
    setIsHovered(true);
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

  // Lens math for Flipkart / Amazon cursor indicator
  const lensWidth = Math.round(mousePos.width / zoomLevel);
  const lensHeight = Math.round(mousePos.height / zoomLevel);
  const lensLeft = Math.max(0, Math.min(mousePos.width - lensWidth, mousePos.x - lensWidth / 2));
  const lensTop = Math.max(0, Math.min(mousePos.height - lensHeight, mousePos.y - lensHeight / 2));

  return (
    <div className="w-full flex flex-col items-center">
      {/* Sleek Minimalist Zoom & View Toolbar */}
      {resolvedUrl && !imageError && (
        <div className="w-full flex items-center justify-between gap-2 pb-2.5 text-xs text-slate-500 dark:text-slate-400">
          <div className="inline-flex items-center p-1 bg-slate-100/80 dark:bg-slate-900/80 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] font-bold">
            <span className="flex items-center gap-1 px-2 text-slate-700 dark:text-slate-300 font-extrabold">
              <ZoomIn className="h-3 w-3 text-indigo-500" />
              <span>Zoom</span>
            </span>
            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-800 p-0.5 rounded-lg shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
              <button
                type="button"
                onClick={() => setZoomLevel(2.5)}
                className={`px-2.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  zoomLevel === 2.5 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                2.5x
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(3.5)}
                className={`px-2.5 py-0.5 rounded-md font-extrabold transition-all cursor-pointer ${
                  zoomLevel === 3.5 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                3.5x HD
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoomMode(zoomMode === 'side' ? 'inner' : 'side')}
              className="hidden md:flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 shadow-2xs transition-all cursor-pointer"
              title="Toggle between Amazon/Flipkart side zoom and inner container zoom"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>{zoomMode === 'side' ? 'Side Magnifier' : 'Inner Loupe'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLightboxScale(1.6);
                setLightboxOffset({ x: 0, y: 0 });
                setIsLightboxOpen(true);
              }}
              className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 shadow-2xs transition-all cursor-pointer"
              title="Open full-screen inspection"
            >
              <Maximize2 className="h-3 w-3" />
              <span className="hidden sm:inline">Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Image Showcase Container with Soft Ambient Pedestal */}
      <div 
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        onTouchStart={() => setIsHovered(true)}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsHovered(false)}
        onClick={() => {
          if (resolvedUrl && !imageError) {
            setLightboxScale(1.6);
            setLightboxOffset({ x: 0, y: 0 });
            setIsLightboxOpen(true);
          }
        }}
        className={`w-full aspect-square bg-gradient-to-b from-slate-50/90 via-white to-slate-50/40 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center overflow-hidden mb-4 relative shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.25)] select-none transition-all duration-200 group ${
          resolvedUrl && !imageError ? 'cursor-crosshair' : ''
        }`}
      >
        {/* Render Base Image or Fallback */}
        {resolvedUrl && !imageError ? (
          <img
            src={resolvedUrl}
            alt={productName}
            onError={() => setImageError(true)}
            className={`h-full w-full object-contain p-6 select-none ${
              zoomMode === 'inner' && isHovered 
                ? 'transition-none pointer-events-none' 
                : 'transition-transform duration-300 group-hover:scale-[1.03]'
            }`}
            style={
              zoomMode === 'inner' && isHovered ? {
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${mousePos.xPercent}% ${mousePos.yPercent}%`,
                willChange: 'transform, transform-origin'
              } : undefined
            }
          />
        ) : isEmoji ? (
          <span className="text-8xl select-none">{activeImageSrc}</span>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 via-indigo-50/40 to-slate-200/50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 dark:bg-indigo-400/15 border border-indigo-200/60 dark:border-indigo-500/30 flex items-center justify-center shadow-xs mb-3">
              <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 max-w-[160px] truncate">
              {category || 'Clinical Formulation'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-1">
              MitoReboot Certified Lab
            </span>
          </div>
        )}

        {/* Discount Badge */}
        {discountPercent > 0 && (
          <span className="absolute top-4 left-4 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md tracking-wider pointer-events-none z-20">
            {discountPercent}% OFF
          </span>
        )}

        {/* Expand Lightbox Button */}
        {resolvedUrl && !imageError && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxScale(1.6);
              setLightboxOffset({ x: 0, y: 0 });
              setIsLightboxOpen(true);
            }}
            className="absolute top-4 right-4 h-9 w-9 rounded-2xl bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/70 dark:border-slate-700 flex items-center justify-center shadow-md backdrop-blur-md transition-all z-20 cursor-pointer hover:scale-105 active:scale-95"
            title="Open Fullscreen Lightbox"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        )}

        {/* Flipkart / Amazon Lens Reticle Overlay (Active when side zoom is enabled) */}
        {isHovered && resolvedUrl && !imageError && zoomMode === 'side' && (
          <div
            className="hidden md:block absolute pointer-events-none border-2 border-indigo-500 bg-indigo-500/15 backdrop-blur-[0.5px] rounded-2xl shadow-xl z-20 transition-all duration-75"
            style={{
              width: `${lensWidth}px`,
              height: `${lensHeight}px`,
              left: `${lensLeft}px`,
              top: `${lensTop}px`,
            }}
          >
            <div className="absolute top-1 right-1 bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
              {zoomLevel}x
            </div>
          </div>
        )}

        {/* Floating Ambient Hover Pill */}
        {resolvedUrl && !imageError && !isHovered && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-700/80 backdrop-blur-md text-slate-700 dark:text-slate-200 text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-sm pointer-events-none flex items-center gap-1.5 whitespace-nowrap z-20 transition-all duration-300 opacity-95 group-hover:opacity-0">
            <ZoomIn className="h-3 w-3 text-indigo-500" />
            <span>Hover to zoom • Click for Fullscreen</span>
          </div>
        )}
      </div>

      {/* FLIPKART / AMAZON FLOATING SIDE ZOOM WINDOW (Appears over right column on desktop hover) */}
      {isHovered && resolvedUrl && !imageError && zoomMode === 'side' && (
        <div 
          className="hidden md:flex flex-col absolute left-[44%] top-6 bottom-6 right-6 z-40 bg-white dark:bg-slate-950 rounded-[2.5rem] border-2 border-indigo-500/70 shadow-2xl overflow-hidden pointer-events-none animate-in fade-in duration-100"
          style={{ minHeight: '440px' }}
        >
          {/* Header */}
          <div className="bg-slate-900/95 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black tracking-wide flex items-center gap-1.5">
                <ZoomIn className="h-3.5 w-3.5 text-indigo-400" />
                <span>HD Magnifier ({zoomLevel}x)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-300 font-medium">
              Inspect Nutrition Values, Ingredients & Directions
            </span>
          </div>

          {/* Viewport with high-res transform */}
          <div className="flex-1 w-full relative overflow-hidden bg-white dark:bg-slate-950 flex items-center justify-center p-8">
            <img
              src={resolvedUrl}
              alt="Magnified View"
              className="w-full h-full object-contain pointer-events-none select-none transition-none"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: `${mousePos.xPercent}% ${mousePos.yPercent}%`,
                willChange: 'transform, transform-origin'
              }}
            />
          </div>

          {/* Footer note */}
          <div className="bg-slate-50 dark:bg-slate-900 px-5 py-2.5 border-t border-slate-200/80 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between items-center shrink-0">
            <span className="font-semibold">Official Clinical Batch Packaging</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Click image anytime for Fullscreen Pan & Zoom</span>
          </div>
        </div>
      )}

      {/* Thumbnails Gallery */}
      {allGalleryImages.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto w-full pb-2 mb-4 scrollbar-none">
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
                className={`h-16 w-16 shrink-0 rounded-2xl border-2 overflow-hidden bg-white dark:bg-slate-900 p-1.5 transition-all cursor-pointer ${
                  activeImageIndex === idx
                    ? 'border-indigo-600 ring-2 ring-indigo-500/25 scale-105 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-300'
                }`}
                title={`View image ${idx + 1}`}
              >
                {thumbUrl ? (
                  <img src={thumbUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <span className="text-xl flex items-center justify-center h-full">📦</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Modern Boutique Clinical Trust & Quality Badges */}
      <div className="w-full grid grid-cols-2 gap-2.5 pt-1">
        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-emerald-200 dark:hover:border-emerald-900/40 transition-all">
          <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center shrink-0">
            <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight block">100% Organic & Pure</span>
            <span className="text-[9px] text-slate-400 font-medium">Unprocessed Staples</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight block">Lab Verified Quality</span>
            <span className="text-[9px] text-slate-400 font-medium">Heavy Metal Tested</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-rose-200 dark:hover:border-rose-900/40 transition-all">
          <div className="h-8 w-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-800/40 flex items-center justify-center shrink-0">
            <HeartPulse className="h-4 w-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight block">Therapeutic Grade</span>
            <span className="text-[9px] text-slate-400 font-medium">Metabolic Nutrition</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-cyan-200 dark:hover:border-cyan-900/40 transition-all">
          <div className="h-8 w-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/60 dark:border-cyan-800/40 flex items-center justify-center shrink-0">
            <Truck className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 leading-tight block">Fast Direct Dispatch</span>
            <span className="text-[9px] text-slate-400 font-medium">Fresh Mill Batches</span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {isLightboxOpen && resolvedUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col select-none animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between border-b border-white/10 shrink-0 bg-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
                <span>Close (Esc)</span>
              </button>
              <div>
                <h4 className="text-white text-sm font-extrabold truncate max-w-xs sm:max-w-md">
                  {productName}
                </h4>
                <p className="text-slate-400 text-[11px]">
                  Image {activeImageIndex + 1} of {allGalleryImages.length || 1} • High-Resolution Packaging Inspection
                </p>
              </div>
            </div>

            {/* Lightbox Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxScale(s => Math.max(1, +(s - 0.5).toFixed(1)))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono font-bold text-white px-2 min-w-[50px] text-center">
                {Math.round(lightboxScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setLightboxScale(s => Math.min(5, +(s + 0.5).toFixed(1)))}
                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
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
                className="h-8 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Reset Zoom"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive Drag & Pan Viewport */}
          <div 
            className="flex-1 w-full overflow-hidden flex items-center justify-center relative p-4 cursor-grab active:cursor-grabbing"
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

            {/* Instruction badge */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-slate-300 text-[11px] font-medium px-4 py-1.5 rounded-full pointer-events-none border border-white/10 flex items-center gap-2">
              <span>Scroll wheel to zoom</span>
              <span>•</span>
              <span>Click & drag to pan packaging</span>
            </div>
          </div>

          {/* Bottom Thumbnails */}
          {allGalleryImages.length > 1 && (
            <div 
              className="p-3 bg-black/80 border-t border-white/10 flex justify-center gap-2.5 overflow-x-auto shrink-0"
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
                    className={`h-14 w-14 rounded-xl border-2 overflow-hidden bg-white/5 p-1 transition-all cursor-pointer ${
                      activeImageIndex === idx 
                        ? 'border-indigo-400 ring-2 ring-indigo-400/40 scale-105' 
                        : 'border-white/20 opacity-60 hover:opacity-100'
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
