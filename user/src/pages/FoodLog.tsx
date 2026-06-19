import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SyncService } from '../services/syncService';
import { useToast } from '../context/ToastContext';
import { 
  Search, 
  Plus, 
  Trash2, 
  Scale, 
  Flame, 
  ShoppingBag, 
  Activity, 
  Wheat, 
  Smile,
  Calendar,
  Pencil,
  X,
  Coffee,
  Apple,
  Soup,
  Utensils,
  Cookie
} from 'lucide-react';

export const FoodLog: React.FC = () => {
  const { token, apiUrl } = useAuth();
  const { showToast } = useToast();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Beverages':
        return <Coffee className="h-5 w-5 text-sky-500" />;
      case 'Fruits':
      case 'Vegetables':
        return <Apple className="h-5 w-5 text-emerald-500" />;
      case 'Snacks':
      case 'Sweets':
        return <Cookie className="h-5 w-5 text-amber-500" />;
      case 'Non-Veg':
        return <Soup className="h-5 w-5 text-rose-500" />;
      default:
        return <Utensils className="h-5 w-5 text-primary" />;
    }
  };

  const getCategoryIconContainerClass = (category: string) => {
    switch (category) {
      case 'Beverages':
        return 'bg-sky-50 border-sky-100';
      case 'Fruits':
      case 'Vegetables':
        return 'bg-emerald-50 border-emerald-100';
      case 'Snacks':
      case 'Sweets':
        return 'bg-amber-50 border-amber-100';
      case 'Non-Veg':
        return 'bg-rose-50 border-rose-100';
      default:
        return 'bg-primary/5 border-primary/10';
    }
  };

  const [logs, setLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryFoods, setLibraryFoods] = useState<any[]>([]);
  const [selectedLibraryFood, setSelectedLibraryFood] = useState<any | null>(null);

  // Edit log modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editMealType, setEditMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [editCategory, setEditCategory] = useState<string>('Custom');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [editUnit, setEditUnit] = useState('');
  const [editCalories, setEditCalories] = useState<number>(0);
  const [editCarbs, setEditCarbs] = useState<number>(0);
  const [editProtein, setEditProtein] = useState<number>(0);
  const [editFat, setEditFat] = useState<number>(0);
  const [editFiber, setEditFiber] = useState<number>(0);

  const [editBaseCalories, setEditBaseCalories] = useState<number>(0);
  const [editBaseCarbs, setEditBaseCarbs] = useState<number>(0);
  const [editBaseProtein, setEditBaseProtein] = useState<number>(0);
  const [editBaseFat, setEditBaseFat] = useState<number>(0);
  const [editBaseFiber, setEditBaseFiber] = useState<number>(0);

  // Helper to get local date strings
  const getTodayLocalDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentLocalTimeStr = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Date states
  const [selectedViewDate, setSelectedViewDate] = useState<string>(getTodayLocalDateStr());
  const [logDate, setLogDate] = useState<string>(getTodayLocalDateStr());
  const [logTime, setLogTime] = useState<string>(getCurrentLocalTimeStr());

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
  }, [token, selectedViewDate]);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      searchFoodLibrary();
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const fetchLogs = async () => {
    if (!token) return;
    try {
      // Parse date components explicitly to avoid UTC-vs-local timezone issues
      const [year, month, day] = selectedViewDate.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);

      const response = await fetch(`${apiUrl}/food-logs?startDate=${start.toISOString()}&endDate=${end.toISOString()}`, {
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
    setQuantity(food.servingSize || 100);
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
    setQuantity(1);
    setUnit('serving');
  };

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const mealName = selectedLibraryFood ? selectedLibraryFood.name : customName;
    if (!mealName) return;

    let loggedAtStr = new Date().toISOString();
    try {
      if (logDate && logTime) {
        const [year, month, day] = logDate.split('-').map(Number);
        const [hour, minute] = logTime.split(':').map(Number);
        const mealDateTime = new Date(year, month - 1, day, hour, minute);
        loggedAtStr = mealDateTime.toISOString();
      }
    } catch (err) {
      console.error('Error parsing loggedAt date:', err);
    }

    const finalCalories = selectedLibraryFood 
      ? (selectedLibraryFood.calories / selectedLibraryFood.servingSize) 
      : calories;
    const finalCarbs = selectedLibraryFood 
      ? (selectedLibraryFood.carbs / selectedLibraryFood.servingSize) 
      : carbs;
    const finalProtein = selectedLibraryFood 
      ? (selectedLibraryFood.protein / selectedLibraryFood.servingSize) 
      : protein;
    const finalFat = selectedLibraryFood 
      ? (selectedLibraryFood.fat / selectedLibraryFood.servingSize) 
      : fat;
    const finalFiber = selectedLibraryFood 
      ? ((selectedLibraryFood.fiber || 0) / selectedLibraryFood.servingSize) 
      : fiber;

    const payload = {
      name: mealName,
      category,
      mealType,
      calories: finalCalories,
      carbs: finalCarbs,
      protein: finalProtein,
      fat: finalFat,
      fiber: finalFiber,
      quantity: parseFloat(quantity as any) || 1,
      unit,
      loggedAt: loggedAtStr
    };

    const res = await SyncService.logMeal(payload, token, apiUrl);

    if (res.success) {
      if (res.offline) {
        setMessage('Device offline: Meal saved locally to sync queue.');
      } else {
        showToast('Meal logged successfully!', 'success');
        setMessage('Meal logged successfully.');
      }
      
      // Reset form
      handleClearSelected();
      setQuantity(1);
      
      // If user logged meal on a different date, switch view date to match
      if (logDate !== selectedViewDate) {
        setSelectedViewDate(logDate);
      } else {
        fetchLogs();
      }
      
      setTimeout(() => setMessage(null), 4000);
    } else {
      showToast('Error occurred while logging meal.', 'error');
    }
  };

  const handleOpenEditModal = (log: any) => {
    setEditingLog(log);
    setEditName(log.name);
    setEditMealType(log.mealType);
    setEditCategory(log.category);
    setEditQuantity(log.quantity);
    setEditUnit(log.unit);
    
    setEditBaseCalories(log.calories);
    setEditBaseCarbs(log.carbs);
    setEditBaseProtein(log.protein);
    setEditBaseFat(log.fat);
    setEditBaseFiber(log.fiber || 0);

    setEditCalories(Math.round(log.calories * log.quantity));
    setEditCarbs(Math.round(log.carbs * log.quantity));
    setEditProtein(Math.round(log.protein * log.quantity));
    setEditFat(Math.round(log.fat * log.quantity));
    setEditFiber(Math.round((log.fiber || 0) * log.quantity));

    const d = new Date(log.loggedAt);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setEditDate(`${year}-${month}-${day}`);
    
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setEditTime(`${hours}:${minutes}`);

    setIsEditModalOpen(true);
  };

  const handleEditQuantityChange = (newQty: any) => {
    setEditQuantity(newQty);
    const qtyNum = parseFloat(newQty) || 0;
    setEditCalories(Math.round(editBaseCalories * qtyNum));
    setEditCarbs(Math.round(editBaseCarbs * qtyNum));
    setEditProtein(Math.round(editBaseProtein * qtyNum));
    setEditFat(Math.round(editBaseFat * qtyNum));
    setEditFiber(Math.round(editBaseFiber * qtyNum));
  };

  const handleEditCaloriesChange = (val: number) => {
    setEditCalories(val);
    if (editQuantity > 0) setEditBaseCalories(val / editQuantity);
  };

  const handleEditCarbsChange = (val: number) => {
    setEditCarbs(val);
    if (editQuantity > 0) setEditBaseCarbs(val / editQuantity);
  };

  const handleEditProteinChange = (val: number) => {
    setEditProtein(val);
    if (editQuantity > 0) setEditBaseProtein(val / editQuantity);
  };

  const handleEditFatChange = (val: number) => {
    setEditFat(val);
    if (editQuantity > 0) setEditBaseFat(val / editQuantity);
  };

  const handleEditFiberChange = (val: number) => {
    setEditFiber(val);
    if (editQuantity > 0) setEditBaseFiber(val / editQuantity);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingLog) return;

    let loggedAtStr = editingLog.loggedAt;
    try {
      if (editDate && editTime) {
        const [year, month, day] = editDate.split('-').map(Number);
        const [hour, minute] = editTime.split(':').map(Number);
        const mealDateTime = new Date(year, month - 1, day, hour, minute);
        loggedAtStr = mealDateTime.toISOString();
      }
    } catch (err) {
      console.error('Error parsing loggedAt date:', err);
    }

    const payload = {
      name: editName,
      category: editCategory,
      mealType: editMealType,
      calories: editBaseCalories,
      carbs: editBaseCarbs,
      protein: editBaseProtein,
      fat: editBaseFat,
      fiber: editBaseFiber,
      quantity: parseFloat(editQuantity as any) || 1,
      unit: editUnit,
      loggedAt: loggedAtStr
    };

    try {
      const response = await fetch(`${apiUrl}/food-logs/${editingLog._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast('Meal log updated successfully!', 'success');
        setIsEditModalOpen(false);
        setEditingLog(null);
        fetchLogs();
      } else {
        showToast('Error updating meal log.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating meal log.', 'error');
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

    const totalCalories = logs.reduce((acc, log) => acc + Math.round(log.calories * log.quantity), 0);
    const totalCarbs = logs.reduce((acc, log) => acc + Math.round(log.carbs * log.quantity), 0);
    const totalProtein = logs.reduce((acc, log) => acc + Math.round(log.protein * log.quantity), 0);
    const totalFat = logs.reduce((acc, log) => acc + Math.round(log.fat * log.quantity), 0);
    const totalFiber = logs.reduce((acc, log) => acc + Math.round((log.fiber || 0) * log.quantity), 0);

    return (
      <div className="pb-24 pt-4 px-4 max-w-lg mx-auto bg-slate-50/70 min-h-screen font-sans antialiased text-slate-800">
        {/* Title */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-850">Diet Log</h2>
            <p className="text-xs text-slate-400 font-semibold mt-1">
              Identify meal items causing glucose spikes
            </p>
          </div>
          <div className="bg-white border border-slate-150 p-2 rounded-2xl shadow-sm text-primary">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold rounded-2xl shadow-sm animate-in fade-in duration-200">
            {message}
          </div>
        )}

        {/* Log Form Card */}
        <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-5 mb-6">
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Log a Meal</h3>

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
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold bg-slate-50/30 transition-all"
              />

              {/* Auto-suggestion overlay */}
              {libraryFoods.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] max-h-56 overflow-y-auto z-10 divide-y divide-slate-100 overflow-hidden">
                  {libraryFoods.map((food) => (
                    <div
                      key={food._id}
                      onClick={() => handleSelectLibraryFood(food)}
                      className="p-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center text-sm transition-all"
                    >
                      <span className="font-bold text-slate-700">{food.name}</span>
                      <span className="text-[10px] font-extrabold text-slate-400 bg-slate-100/80 px-2 py-1 rounded-lg flex items-center gap-1.5">
                        {food.category}
                        <span className="text-[9px] bg-white border border-slate-100 px-1 py-0.5 rounded font-black text-primary">
                          {food.calories} kcal / {food.servingSize}{food.servingUnit}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Core meal inputs */}
            <div className="space-y-3.5 bg-slate-50/30 p-4 rounded-2xl border border-slate-100/70">
              {selectedLibraryFood ? (
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <div>
                    <span className="text-[9px] font-bold text-primary uppercase tracking-wider block">Selected Template</span>
                    <span className="text-sm font-bold text-slate-800">{selectedLibraryFood.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-all bg-white shadow-sm px-2.5 py-1 rounded-lg border border-rose-100"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Rice and Dal, boiled egg..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold bg-white"
                  />
                </div>
              )}

              {/* Backdating inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Meal</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-600 bg-white cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time of Meal</label>
                  <input
                    type="time"
                    required
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-600 bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Period</label>
                  <select
                    value={mealType}
                    onChange={(e: any) => setMealType(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-600 bg-white cursor-pointer"
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                  </select>
                </div>

                {!selectedLibraryFood && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Food Category</label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-bold text-slate-600 bg-white cursor-pointer"
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

              {/* Nutrients inputs */}
              <div className="pt-3 border-t border-slate-200/60">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nutritional Breakdown</span>
                <div className="grid grid-cols-5 gap-1.5">
                  {/* Calories */}
                  <div className={`p-2 rounded-xl text-center border transition-all ${
                    selectedLibraryFood ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80 focus-within:border-primary/40'
                  }`}>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Calories</span>
                    {selectedLibraryFood ? (
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {Math.round((selectedLibraryFood.calories / selectedLibraryFood.servingSize) * quantity)}
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                  {/* Carbs */}
                  <div className={`p-2 rounded-xl text-center border transition-all ${
                    selectedLibraryFood ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80 focus-within:border-primary/40'
                  }`}>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Carbs</span>
                    {selectedLibraryFood ? (
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {Math.round((selectedLibraryFood.carbs / selectedLibraryFood.servingSize) * quantity)}g
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={carbs}
                        onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                  {/* Protein */}
                  <div className={`p-2 rounded-xl text-center border transition-all ${
                    selectedLibraryFood ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80 focus-within:border-primary/40'
                  }`}>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Protein</span>
                    {selectedLibraryFood ? (
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {Math.round((selectedLibraryFood.protein / selectedLibraryFood.servingSize) * quantity)}g
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={protein}
                        onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                  {/* Fat */}
                  <div className={`p-2 rounded-xl text-center border transition-all ${
                    selectedLibraryFood ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80 focus-within:border-primary/40'
                  }`}>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Fat</span>
                    {selectedLibraryFood ? (
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {Math.round((selectedLibraryFood.fat / selectedLibraryFood.servingSize) * quantity)}g
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={fat}
                        onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                  {/* Fiber */}
                  <div className={`p-2 rounded-xl text-center border transition-all ${
                    selectedLibraryFood ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200/80 focus-within:border-primary/40'
                  }`}>
                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Fiber</span>
                    {selectedLibraryFood ? (
                      <span className="text-xs font-bold text-slate-700 block mt-0.5">
                        {Math.round(((selectedLibraryFood.fiber || 0) / selectedLibraryFood.servingSize) * quantity)}g
                      </span>
                    ) : (
                      <input
                        type="number"
                        value={fiber}
                        onChange={(e) => setFiber(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Serving size sizing controls */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Serving Qty</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantity(val === '' ? '' as any : parseFloat(val));
                    }}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    disabled={!!selectedLibraryFood}
                    className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-500 disabled:bg-slate-100/50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Log Meal</span>
            </button>
          </form>
        </div>

        {/* Log History list */}
        <div>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Smile className="h-4 w-4 text-primary" />
              <span>Meal Log History</span>
            </h3>
            <div className="flex items-center space-x-2 bg-white border border-slate-100 rounded-2xl px-3 py-1.5 self-start sm:self-auto shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">View Date:</span>
              <input
                type="date"
                value={selectedViewDate}
                onChange={(e) => setSelectedViewDate(e.target.value)}
                className="text-xs font-bold text-slate-600 bg-transparent focus:outline-none border-none cursor-pointer"
              />
            </div>
          </div>

          {/* Daily Nutrient Summary Card */}
          {logs.length > 0 && (
            <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-4 mb-4">
              <h4 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-3">Daily Nutrients Summary</h4>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Calories</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{totalCalories}</span>
                </div>
                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Carbs</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{totalCarbs}g</span>
                </div>
                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Protein</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{totalProtein}g</span>
                </div>
                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Fat</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{totalFat}g</span>
                </div>
                <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100/60">
                  <span className="text-[8px] font-bold text-slate-400 block uppercase">Fiber</span>
                  <span className="text-xs font-bold text-slate-700 block mt-0.5">{totalFiber}g</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3.5">
            {logs.length === 0 ? (
              <div className="text-center p-8 bg-white border border-slate-100 rounded-3xl text-xs font-semibold text-slate-400 shadow-[0_12px_24px_rgba(0,0,0,0.02)]">
                No foods logged for {new Date(selectedViewDate + 'T12:00:00').toLocaleDateString([], { dateStyle: 'medium' })}.
              </div>
            ) : (
              logs.map((log) => (
                <div 
                  key={log._id} 
                  className="bg-white p-4 rounded-3xl border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] flex items-center justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center space-x-3.5 max-w-[82%]">
                    <div className={`p-3 border rounded-2xl shrink-0 ${getCategoryIconContainerClass(log.category)}`}>
                      {getCategoryIcon(log.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-tight">{log.name}</h4>
                        <span className="text-[9px] text-slate-400 font-extrabold bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                        {log.mealType} • {log.quantity} {log.unit}
                      </span>
                      <div className="flex items-center space-x-2 mt-2 flex-wrap gap-y-1">
                        <span className="inline-flex items-center text-[10px] text-orange-600 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          <Flame className="h-2.5 w-2.5 mr-0.5 fill-orange-100" />
                          {Math.round(log.calories * log.quantity)} kcal
                        </span>
                        <span className="inline-flex items-center text-[10px] text-blue-600 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          <Scale className="h-2.5 w-2.5 mr-0.5" />
                          {Math.round(log.carbs * log.quantity)}g carbs
                        </span>
                        <span className="inline-flex items-center text-[10px] text-indigo-600 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                          <ShoppingBag className="h-2.5 w-2.5 mr-0.5" />
                          {Math.round(log.protein * log.quantity)}g pro
                        </span>
                        {log.fiber > 0 && (
                          <span className="inline-flex items-center text-[10px] text-emerald-600 font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full">
                            <Wheat className="h-2.5 w-2.5 mr-0.5" />
                            {Math.round(log.fiber * log.quantity)}g fib
                          </span>
                        )}
                      </div>

                      {/* Spike Correlation Quick Indicator */}
                      {log.glucoseAnalysis && log.glucoseAnalysis.status && (
                        <span className={`inline-flex items-center text-[9px] font-bold px-2.5 py-0.5 rounded-full mt-2 border ${
                          log.glucoseAnalysis.status === 'Safe' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          log.glucoseAnalysis.status === 'Moderate' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                          <Activity className="h-2.5 w-2.5 mr-1" />
                          {log.glucoseAnalysis.status.toUpperCase()} SPIKE ({log.glucoseAnalysis.peakGlucose} mg/dL)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(log)}
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-primary rounded-xl transition-all"
                      title="Edit Log"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteLog(log._id)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                      title="Delete Log"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Edit Food Log Modal */}
        {isEditModalOpen && editingLog && (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Edit Food Log</h3>
                  <p className="text-xs text-slate-450 font-medium mt-0.5">Modify meal entry details</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingLog(null); }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-700 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Meal</label>
                    <input
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-600 bg-white cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time of Meal</label>
                    <input
                      type="time"
                      required
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-600 bg-white cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Period</label>
                    <select
                      value={editMealType}
                      onChange={(e: any) => setEditMealType(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-600 bg-white cursor-pointer"
                    >
                      <option value="Breakfast">Breakfast</option>
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Snack">Snack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Food Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-semibold text-slate-600 bg-white cursor-pointer"
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
                </div>

                {/* Quantity / Unit */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Serving Qty</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={editQuantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleEditQuantityChange(val === '' ? '' as any : parseFloat(val));
                      }}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-slate-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit</label>
                    <input
                      type="text"
                      required
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold text-slate-600 bg-white"
                    />
                  </div>
                </div>

                {/* Macros inputs */}
                <div className="pt-3 border-t border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nutritional Values (Total)</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    <div className="p-2 rounded-xl text-center border bg-slate-50 border-slate-100 focus-within:border-primary/40 transition-all">
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Calories</span>
                      <input
                        type="number"
                        value={editCalories}
                        onChange={(e) => handleEditCaloriesChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl text-center border bg-slate-50 border-slate-100 focus-within:border-primary/40 transition-all">
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Carbs</span>
                      <input
                        type="number"
                        value={editCarbs}
                        onChange={(e) => handleEditCarbsChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl text-center border bg-slate-50 border-slate-100 focus-within:border-primary/40 transition-all">
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Protein</span>
                      <input
                        type="number"
                        value={editProtein}
                        onChange={(e) => handleEditProteinChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl text-center border bg-slate-50 border-slate-100 focus-within:border-primary/40 transition-all">
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Fat</span>
                      <input
                        type="number"
                        value={editFat}
                        onChange={(e) => handleEditFatChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    <div className="p-2 rounded-xl text-center border bg-slate-50 border-slate-100 focus-within:border-primary/40 transition-all">
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Fiber</span>
                      <input
                        type="number"
                        value={editFiber}
                        onChange={(e) => handleEditFiberChange(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setIsEditModalOpen(false); setEditingLog(null); }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold py-2.5 px-4 rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-extrabold py-2.5 px-4 rounded-xl text-sm shadow-soft transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
};
