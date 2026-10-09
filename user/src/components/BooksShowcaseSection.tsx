import React, { useState } from 'react';
import { ExternalLink, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

export interface BookItem {
  id: string;
  asin?: string;
  name: string;
  brand: string;
  price: number;
  regularPrice: number;
  discountPercent: number;
  image: string;
  category: 'Books';
  subcategory: 'Books for elderly memory' | 'Books for women health' | 'Books on natural antioxidant food';
  buyUrl: string;
  highlight?: string;
}

export const CURATED_BOOKS: BookItem[] = [
  // 1. Books for elderly memory
  {
    id: 'book-elderly-1',
    asin: '1648450954',
    name: 'Memory Games for Seniors (Large Print): A Fun Activity Book with Brain Games',
    brand: 'Senior Activities Press',
    price: 1283,
    regularPrice: 2699,
    discountPercent: 22,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1648450954.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory',
    buyUrl: 'https://www.amazon.in/dp/1648450954?tag=mitoreboot-21',
    highlight: 'Cognitive retention & logic challenges'
  },
  {
    id: 'book-elderly-2',
    asin: '1837995346',
    name: 'Brain Games for Seniors: Fun, Achievable and Soothing Logic Puzzles',
    brand: 'Summersdale Publishers',
    price: 1361,
    regularPrice: 1599,
    discountPercent: 15,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1837995346.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory',
    buyUrl: 'https://www.amazon.in/dp/1837995346?tag=mitoreboot-21',
    highlight: 'Soothing mental agility & memory'
  },
  {
    id: 'book-elderly-3',
    asin: 'B0DM1BM3PS',
    name: "6 Packs 16 Large Piece Puzzle for Seniors Dementia Alzheimer's Cognitive Games",
    brand: 'Senior Cognitive Games',
    price: 3819,
    regularPrice: 15748,
    discountPercent: 76,
    image: 'https://images-na.ssl-images-amazon.com/images/P/B0DM1BM3PS.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for elderly memory',
    buyUrl: 'https://www.amazon.in/dp/B0DM1BM3PS?tag=mitoreboot-21',
    highlight: 'Dementia & healthy aging puzzle set'
  },

  // 2. Books for women health
  {
    id: 'book-women-1',
    asin: 'B0DKT5B8S1',
    name: 'Inside The Menopause Brain: Reset your Understanding of the Menopause',
    brand: 'Avery Publishing',
    price: 2065,
    regularPrice: 2437,
    discountPercent: 15,
    image: 'https://images-na.ssl-images-amazon.com/images/P/B0DKT5B8S1.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health',
    buyUrl: 'https://www.amazon.in/dp/B0DKT5B8S1?tag=mitoreboot-21',
    highlight: 'Neurological & hormonal balance'
  },
  {
    id: 'book-women-2',
    asin: '0593855191',
    name: 'The Menopause Gut: Balance Your Microbiome to Reclaim Your Health',
    brand: 'Rodale Books',
    price: 1218,
    regularPrice: 2999,
    discountPercent: 24,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0593855191.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health',
    buyUrl: 'https://www.amazon.in/dp/0593855191?tag=mitoreboot-21',
    highlight: 'Gut microbiome for midlife longevity'
  },
  {
    id: 'book-women-3',
    asin: '0679778004',
    name: 'Self-Help for Premenstrual Syndrome Third Edition',
    brand: 'Random House',
    price: 1197,
    regularPrice: 1441,
    discountPercent: 17,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0679778004.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health',
    buyUrl: 'https://www.amazon.in/dp/0679778004?tag=mitoreboot-21',
    highlight: 'Evidence-based PMS symptom relief'
  },
  {
    id: 'book-women-4',
    asin: '0722531400',
    name: 'Recipes for Health – PMS: Over 100 Recipes for Overcoming Premenstrual Tension',
    brand: 'Thorsons',
    price: 999,
    regularPrice: 1199,
    discountPercent: 17,
    image: 'https://images-na.ssl-images-amazon.com/images/P/0722531400.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health',
    buyUrl: 'https://www.amazon.in/dp/0722531400?tag=mitoreboot-21',
    highlight: '100+ nourishing hormone-balancing recipes'
  },
  {
    id: 'book-women-5',
    asin: '9355154461',
    name: 'AN AYURVEDIC AND MODERN OVERVIEW Of PREMENSTRUAL SYNDROME',
    brand: 'Ayurvedic Press',
    price: 250,
    regularPrice: 300,
    discountPercent: 17,
    image: 'https://images-na.ssl-images-amazon.com/images/P/9355154461.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books for women health',
    buyUrl: 'https://www.amazon.in/dp/9355154461?tag=mitoreboot-21',
    highlight: 'Holistic Ayurvedic + modern protocols'
  },

  // 3. Books on natural antioxidant food
  {
    id: 'book-food-1',
    asin: '1557043019',
    name: 'The Antioxidant Save-Your-Life Cookbook: 150 Nutritious Recipes',
    brand: 'Jane Kinderlehrer Smart Food Series',
    price: 499,
    regularPrice: 699,
    discountPercent: 29,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1557043019.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food',
    buyUrl: 'https://www.amazon.in/dp/1557043019?tag=mitoreboot-21',
    highlight: 'High-antioxidant cellular nutrition'
  },
  {
    id: 'book-food-2',
    asin: '1989682812',
    name: 'Vegan Diet: Quick and Easy Paleo Vegan Recipes (High Antioxidants)',
    brand: 'Health Books',
    price: 1226,
    regularPrice: 1532,
    discountPercent: 20,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1989682812.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food',
    buyUrl: 'https://www.amazon.in/dp/1989682812?tag=mitoreboot-21',
    highlight: 'Phytochemicals & anti-inflammatory meal plans'
  },
  {
    id: 'book-food-3',
    asin: '1632872323',
    name: 'Superfood Recipes: Super Foods Healthy Recipes Book',
    brand: 'Gloria Richardson',
    price: 999,
    regularPrice: 1056,
    discountPercent: 5,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1632872323.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food',
    buyUrl: 'https://www.amazon.in/dp/1632872323?tag=mitoreboot-21',
    highlight: 'Natural bioavailable antioxidant superfoods'
  },
  {
    id: 'book-food-4',
    asin: '9350578883',
    name: 'Nature Cure Through Fruits And Vegetables: Best Natural Prescriptions',
    brand: 'Medical Publishing',
    price: 156.6,
    regularPrice: 195,
    discountPercent: 20,
    image: 'https://images-na.ssl-images-amazon.com/images/P/9350578883.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food',
    buyUrl: 'https://www.amazon.in/dp/9350578883?tag=mitoreboot-21',
    highlight: 'Healing natural antioxidants in everyday diet'
  },
  {
    id: 'book-food-5',
    asin: '1578263239',
    name: 'Cooking Well Beautiful Skin: Over 75 Antioxidant-Rich Recipes',
    brand: 'Hatherleigh Press',
    price: 710.4,
    regularPrice: 1050,
    discountPercent: 32,
    image: 'https://images-na.ssl-images-amazon.com/images/P/1578263239.01._SCLZZZZZZZ_SX500_.jpg',
    category: 'Books',
    subcategory: 'Books on natural antioxidant food',
    buyUrl: 'https://www.amazon.in/dp/1578263239?tag=mitoreboot-21',
    highlight: 'Skin-protecting antioxidants & polyphenols'
  }
];

export interface BooksShowcaseSectionProps {
  onNavigateToShop?: (category: string, subcategory?: string) => void;
  title?: string;
  subtitle?: string;
  defaultSubcategory?: string;
  showAllOption?: boolean;
  className?: string;
}

export const BooksShowcaseSection: React.FC<BooksShowcaseSectionProps> = ({
  onNavigateToShop,
  title = 'Health & Longevity Books',
  subtitle = 'Curated literature for cognitive retention, women’s wellness & antioxidant nutrition',
  defaultSubcategory = 'All',
  showAllOption = true,
  className = ''
}) => {
  const [selectedSub, setSelectedSub] = useState<string>(defaultSubcategory);

  const subcategories = [
    ...(showAllOption ? [{ id: 'All', label: 'All Books', icon: '📚', count: CURATED_BOOKS.length }] : []),
    {
      id: 'Books for elderly memory',
      label: '1. Books for elderly memory',
      icon: '🧠',
      count: CURATED_BOOKS.filter(b => b.subcategory === 'Books for elderly memory').length
    },
    {
      id: 'Books for women health',
      label: '2. Books for women health',
      icon: '🌸',
      count: CURATED_BOOKS.filter(b => b.subcategory === 'Books for women health').length
    },
    {
      id: 'Books on natural antioxidant food',
      label: '3. Books on natural antioxidant food',
      icon: '🥗',
      count: CURATED_BOOKS.filter(b => b.subcategory === 'Books on natural antioxidant food').length
    }
  ];

  const displayedBooks = selectedSub === 'All'
    ? CURATED_BOOKS
    : CURATED_BOOKS.filter(b => b.subcategory === selectedSub);

  const handleOpenAmazon = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-xs transition-all ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                {title}
              </h4>
              <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                Books Column
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {onNavigateToShop && (
          <button
            type="button"
            onClick={() => onNavigateToShop('Books', selectedSub !== 'All' ? selectedSub : undefined)}
            className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 shrink-0 self-start sm:self-auto cursor-pointer hover:underline"
          >
            <span>View All in Shop</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 3 Sub-Columns / Collections Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {subcategories.map(tab => {
          const isActive = selectedSub === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedSub(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/25 scale-[1.02]'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:bg-white dark:hover:bg-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Books Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {displayedBooks.map((book) => {
          const subIcon = book.subcategory.includes('elderly') ? '🧠' : book.subcategory.includes('women') ? '🌸' : '🥗';
          const subLabel = book.subcategory.replace('Books for ', '').replace('Books on ', '');

          return (
            <div
              key={book.id}
              className="group bg-slate-50/70 dark:bg-slate-950/60 hover:bg-white dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-500/40 rounded-2xl p-3.5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md"
            >
              <div className="space-y-2.5">
                {/* Book Cover Image */}
                <div className="relative aspect-[3/4] w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center p-3 overflow-hidden shadow-2xs">
                  <img
                    src={book.image}
                    alt={book.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                    loading="lazy"
                  />
                  <span className="absolute top-2 left-2 bg-slate-950/90 text-amber-400 text-[8.5px] font-black px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1 border border-amber-400/20 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Amazon Verified
                  </span>
                  {book.discountPercent > 0 && (
                    <span className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                      {book.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Subcategory & Author */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 dark:text-slate-500">
                      {book.brand}
                    </span>
                    <span className="text-[8.5px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 truncate max-w-[150px]">
                      {subIcon} {subLabel}
                    </span>
                  </div>

                  {/* Book Title */}
                  <h5 className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug min-h-[2.2rem] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {book.name}
                  </h5>

                  {/* Highlight */}
                  {book.highlight && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 italic flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5 text-amber-500 shrink-0" />
                      <span>{book.highlight}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Price & Buy Action */}
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2.5 flex items-center justify-between gap-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    ₹{book.price}
                  </span>
                  {book.regularPrice > book.price && (
                    <span className="text-[10px] text-slate-400 line-through font-medium">
                      ₹{book.regularPrice}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAmazon(book.buyUrl)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>Amazon</span>
                  <ExternalLink className="h-3 w-3 stroke-[2.5]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      {onNavigateToShop && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-[11px]">
            Affiliate verified literature with authentic ISBN & publisher references.
          </span>
          <button
            type="button"
            onClick={() => onNavigateToShop('Books', selectedSub !== 'All' ? selectedSub : undefined)}
            className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Explore in MitoReboot Shop →
          </button>
        </div>
      )}
    </div>
  );
};
