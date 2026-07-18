import React, { useState } from 'react';
import { ArrowLeft, Home, Building2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

interface BookingSlotScreenProps {
  lab: any;
  testPrice: number;
  onBack: () => void;
  onContinue: (bookingData: any) => void;
}

export const BookingSlotScreen: React.FC<BookingSlotScreenProps> = ({ lab, testPrice, onBack, onContinue }) => {
  const [collectionType, setCollectionType] = useState<'HOME' | 'LAB_VISIT'>('LAB_VISIT');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [instructions, setInstructions] = useState('');

  const homeCollectionFee = 200; // Fixed for demo, normally comes from lab config

  const handleContinue = () => {
    onContinue({
      collectionType,
      collectionAddress: address,
      preferredDate: date,
      preferredTime: time,
      specialInstructions: instructions,
      homeCollectionFee: collectionType === 'HOME' ? homeCollectionFee : 0
    });
  };

  const isFormValid = date && time && (collectionType === 'LAB_VISIT' || (collectionType === 'HOME' && address.trim().length >= 3));

  // Generate next 7 days for the date picker
  const upcomingDates = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d.toISOString().split('T')[0];
  });

  const timeSlots = lab.availableSlots && lab.availableSlots.length > 0 
    ? lab.availableSlots 
    : [];

  return (
    <div className="pb-32 pt-6 px-4 max-w-5xl mx-auto bg-slate-50 min-h-screen font-sans antialiased">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">Step 2 of 3</span>
          <h2 className="text-2xl font-bold text-slate-800 leading-none mt-1">Collection Details</h2>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">How would you like to give your sample?</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setCollectionType('HOME')}
            disabled={!lab.isHomeCollectionAvailable}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              collectionType === 'HOME' 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-slate-100 hover:border-slate-200 bg-white'
            } ${!lab.isHomeCollectionAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Home className={`h-6 w-6 mb-2 ${collectionType === 'HOME' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className={`block font-bold ${collectionType === 'HOME' ? 'text-indigo-900' : 'text-slate-700'}`}>Home Visit</span>
            <span className="text-[10px] text-slate-500 mt-1 block">Trained phlebotomist visits your home (₹{homeCollectionFee})</span>
            {!lab.isHomeCollectionAvailable && <span className="text-[10px] font-bold text-red-500 mt-1 block">Not available for this lab</span>}
          </button>
          
          <button
            onClick={() => setCollectionType('LAB_VISIT')}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              collectionType === 'LAB_VISIT' 
                ? 'border-indigo-600 bg-indigo-50' 
                : 'border-slate-100 hover:border-slate-200 bg-white'
            }`}
          >
            <Building2 className={`h-6 w-6 mb-2 ${collectionType === 'LAB_VISIT' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className={`block font-bold ${collectionType === 'LAB_VISIT' ? 'text-indigo-900' : 'text-slate-700'}`}>Visit Center</span>
            <span className="text-[10px] text-slate-500 mt-1 block">You walk into the diagnostic center (Free)</span>
          </button>
        </div>
      </div>

      {collectionType === 'HOME' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
          <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" /> Collection Address
          </h3>
          <textarea 
            placeholder="Enter your full home address with landmarks..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 min-h-[100px] resize-none"
          />
        </div>
      )}

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-slate-400" /> Choose a Date
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {upcomingDates.map(d => {
            const dateObj = new Date(d);
            const isSelected = date === d;
            const isHoliday = (lab.holidays || []).includes(d);
            return (
              <button
                key={d}
                onClick={() => { if (!isHoliday) setDate(d); }}
                disabled={isHoliday}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border-2 min-w-[70px] transition-all ${
                  isHoliday ? 'border-rose-100 bg-rose-50 opacity-60 cursor-not-allowed' :
                  isSelected ? 'border-indigo-600 bg-indigo-600 text-white shadow-md' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                }`}
              >
                <span className={`text-[10px] uppercase font-bold tracking-widest ${isHoliday ? 'text-rose-400' : isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className={`text-xl font-black mt-1 ${isHoliday ? 'text-rose-700' : ''}`}>
                  {dateObj.getDate()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" /> Choose a Time Slot
        </h3>
        
        {(lab.holidays || []).includes(date) ? (
          <div className="py-8 text-center bg-rose-50 rounded-2xl border border-rose-100">
            <span className="text-3xl block mb-2">⛱️</span>
            <h4 className="font-bold text-rose-800 text-lg">Lab Closed</h4>
            <p className="text-rose-600 text-sm mt-1">This laboratory is on holiday for the selected date.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {timeSlots.length > 0 ? (
              timeSlots.map(t => (
              <button
                key={t}
                onClick={() => setTime(t)}
                className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all ${
                  time === t 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                }`}
              >
                {t}
              </button>
            ))
          ) : (
            <div className="col-span-3 py-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
              No time slots available for this lab.
            </div>
          )}
        </div>
        )}
      </div>

      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-bold text-slate-800 mb-3 text-sm">Special Instructions (Optional)</h3>
        <input 
          type="text" 
          placeholder="e.g. Ring the doorbell twice, pet in house..."
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      {/* Floating Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] max-w-5xl mx-auto z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Amount</span>
            <span className="text-xl font-black text-slate-800 flex items-center gap-2">
              ₹{testPrice + (collectionType === 'HOME' ? homeCollectionFee : 0)}
            </span>
          </div>
          <button 
            onClick={handleContinue}
            disabled={!isFormValid}
            className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Review & Pay
          </button>
        </div>
      </div>
    </div>
  );
};
