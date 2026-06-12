import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/syncService';
import { 
  Search, 
  Plus, 
  Trash2, 
  Scale, 
  Flame, 
  ShoppingBag, 
  Activity, 
  Wheat, 
  Smile 
} from 'lucide-react';

export const FoodLog: React.FC = () => {
  const { token, apiUrl } = useAuth();

  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryFoods, setLibraryFoods] = useState<any[]>([]);
  const [selectedLibraryFood, setSelectedLibraryFood] = useState<any | null>(null);

  // New log form state
  const [customName, setCustomName] = useState('');
  const [category, setCategory] = useState<'South Indian' | 'North Indian' | 'Snacks' | 'Fruits' | 'Vegetables' | 'Beverages' | 'Dairy' | 'Non-Veg' | 'Sweets' | 'Custom'>('South Indian');
  const [mealType, setMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [calories, setCalories] = useState<number>(0);
  const [carbs, setCarbs] = useState<number>(0);
  const [protein, setProtein] = useState<number>(0);
  const [fat, setFat] = useState<number>(0);
  const [fiber, setFiber] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('serving');

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [token]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchFoodLibrary();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const response = await fetch(`${apiUrl}/food-logs?startDate=${startOfDay.toISOString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const searchFoodLibrary = async () => {
    if (!token) return;
    if (!searchQuery.trim()) {
      setLibraryFoods([]);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/food-library?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLibraryFoods(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectLibraryFood = (food: any) => {
    setSelectedLibraryFood(food);
    setCustomName(food.name);
    setCategory(food.category);
    setCalories(food.calories);
    setCarbs(food.carbs);
    setProtein(food.protein);
    setFat(food.fat);
    setFiber(food.fiber || 0);
    setUnit(food.servingUnit || 'g');
    setLibraryFoods([]);
    setSearchQuery('');
  };

  const handleClearSelected = () => {
    setSelectedLibraryFood(null);
    setCustomName('');
    setCalories(0);
    setCarbs(0);
    setProtein(0);
    setFat(0);
    setFiber(0);
    setUnit('serving');
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const mealName = selectedLibraryFood ? selectedLibraryFood.name : customName;
    if (!mealName) return;

    const payload = {
      name: mealName,
      category,
      mealType,
      calories,
      carbs,
      protein,
      fat,
      fiber,
      quantity,
      unit,
      loggedAt: new Date().toISOString()
    };

    const res = await SyncService.logMeal(payload, token, apiUrl);

    if (res.success) {
      if (res.offline) {
        setMessage('Device offline: Meal saved locally to sync queue.');
      } else {
        setMessage('Meal logged successfully.');
      }
      
      // Reset form
      handleClearSelected();
      setQuantity(1);
      fetchLogs();
      
      setTimeout(() => setMessage(null), 4000);
    } else {
      alert('Error occurred while logging meal.');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${apiUrl}/food-logs/${logId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-white min-h-screen">
      {/* Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Diet Log</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Record meals to identify items causing glucose spikes
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold rounded-2xl shadow-soft">
          {message}
        </div>
      )}

      {/* Log Form Card */}
      <div className="bg-cardBg p-5 rounded-3xl border border-slate-100 shadow-soft mb-6">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Log a Meal</h3>

          {/* Search Indian Database */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Indian database (idli, roti, papaya...)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium bg-white"
            />

            {/* Auto-suggestion overlay */}
            {libraryFoods.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto z-10 divide-y divide-slate-100">
                {libraryFoods.map((food) => (
                  <div
                    key={food._id}
                    onClick={() => handleSelectLibraryFood(food)}
                    className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-sm"
                  >
                    <span className="font-semibold text-slate-700">{food.name}</span>
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded flex items-center">
                      {food.category}
                      <span className="ml-2 text-[10px] bg-white border border-slate-200 px-1.5 rounded">{food.calories} kcal / {food.servingSize}{food.servingUnit}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Core meal inputs */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-soft">
            {selectedLibraryFood ? (
              <div className="flex items-center justify-between p-2.5 bg-primary-light/50 border border-primary-light rounded-xl">
                <div>
                  <span className="text-xs font-bold text-primary-dark uppercase tracking-wider block">Selected Template</span>
                  <span className="text-sm font-bold text-slate-800">{selectedLibraryFood.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="text-xs font-bold text-danger hover:underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meal Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Rice and Dal, boiled egg..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meal Category</label>
                <select
                  value={mealType}
                  onChange={(e: any) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-600"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              {!selectedLibraryFood && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Food Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs font-semibold text-slate-600"
                  >
                    <option value="South Indian">South Indian</option>
                    <option value="North Indian">North Indian</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Sweets">Sweets</option>
                    <option value="Custom">Custom Entry</option>
                  </select>
                </div>
              )}
            </div>

            {/* Nutrients inputs (shown if manual entry or pre-populated by library selection) */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-slate-100">
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Calories</span>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                  disabled={!!selectedLibraryFood}
                  className="w-full border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-1 focus:outline-none disabled:bg-transparent"
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Carbs (g)</span>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                  disabled={!!selectedLibraryFood}
                  className="w-full border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-1 focus:outline-none disabled:bg-transparent"
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Protein</span>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                  disabled={!!selectedLibraryFood}
                  className="w-full border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-1 focus:outline-none disabled:bg-transparent"
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Fat (g)</span>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                  disabled={!!selectedLibraryFood}
                  className="w-full border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-1 focus:outline-none disabled:bg-transparent"
                />
              </div>
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Fiber (g)</span>
                <input
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(parseFloat(e.target.value) || 0)}
                  disabled={!!selectedLibraryFood}
                  className="w-full border-b border-slate-200 text-center font-bold text-slate-700 text-xs py-1 focus:outline-none disabled:bg-transparent"
                />
              </div>
            </div>

            {/* Serving size sizing controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serving Qty</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-bold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  disabled={!!selectedLibraryFood}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium text-slate-500 disabled:bg-transparent"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Log Meal Log</span>
          </button>
        </form>
      </div>

      {/* Today's logged meals list */}
      <div>
        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center space-x-2">
          <Smile className="h-5 w-5 text-primary" />
          <span>Today's Meal Log</span>
        </h3>

        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center p-8 bg-cardBg border border-slate-100 rounded-3xl text-sm font-semibold text-slate-400">
              No foods logged yet today.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log._id} 
                className="bg-cardBg p-4 rounded-2xl border border-slate-100 shadow-soft flex items-center justify-between transition-card"
              >
                <div className="flex items-start space-x-3 max-w-[80%]">
                  <div className="p-2.5 bg-white border border-slate-100 rounded-xl mt-0.5 shrink-0">
                    <Wheat className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700">{log.name}</h4>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {log.mealType} • {log.quantity} {log.unit}
                    </span>
                    <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-500 font-semibold bg-white px-3 py-1 rounded-xl border border-slate-50">
                      <span className="flex items-center text-orange-600">
                        <Flame className="h-3 w-3 mr-0.5 fill-orange-100" />
                        {Math.round(log.calories * log.quantity)} kcal
                      </span>
                      <span className="flex items-center text-blue-600">
                        <Scale className="h-3 w-3 mr-0.5" />
                        {Math.round(log.carbs * log.quantity)}g carbs
                      </span>
                      <span className="flex items-center text-teal-600">
                        <ShoppingBag className="h-3 w-3 mr-0.5" />
                        {Math.round(log.protein * log.quantity)}g pro
                      </span>
                      {log.fiber > 0 && (
                        <span className="flex items-center text-emerald-600">
                          <Wheat className="h-3 w-3 mr-0.5" />
                          {Math.round(log.fiber * log.quantity)}g fib
                        </span>
                      )}
                    </div>

                    {/* Spike Correlation Quick Indicator */}
                    {log.glucoseAnalysis && (
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 border ${
                        log.glucoseAnalysis.status === 'Safe' ? 'bg-green-50 text-success border-green-100' :
                        log.glucoseAnalysis.status === 'Moderate' ? 'bg-orange-50 text-warning border-orange-100' :
                        'bg-red-50 text-danger border-red-100'
                      }`}>
                        <Activity className="h-3 w-3 mr-1" />
                        {log.glucoseAnalysis.status} Spike ({log.glucoseAnalysis.peakGlucose} mg/dL)
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteLog(log._id)}
                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-danger rounded-full transition-all shrink-0"
                  title="Delete Log"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
