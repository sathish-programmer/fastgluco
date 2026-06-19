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
  Cookie,
  Sparkles,
  Camera,
  Lock,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface FoodLogProps {
  features?: any;
  onNavigateToTab?: (tab: string) => void;
}

export const FoodLog: React.FC<FoodLogProps> = ({ features, onNavigateToTab }) => {
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
  const [isExternalFood, setIsExternalFood] = useState(false);

  // FatSecret fallback state
  const [isFatSecretSearching, setIsFatSecretSearching] = useState(false);
  const [fatSecretResults, setFatSecretResults] = useState<any[]>([]);
  const [fatSecretVariants, setFatSecretVariants] = useState<any[] | null>(null); // for picker modal

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreviewUrl, setScanPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanningProgress, setScanningProgress] = useState('Initializing Scanner...');
  const [scanResult, setScanResult] = useState<any | null>(null);
  
  interface ScannedItemState {
    enabled: boolean;
    portionType: string;
    customGrams: number;
  }
  const [scannedItemsState, setScannedItemsState] = useState<Record<number, ScannedItemState>>({});

  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMealType, setScanMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack'>('Breakfast');
  const [activeTab, setActiveTab] = useState<'search' | 'manual' | 'scan'>('search');
  const [portionType, setPortionType] = useState<string>('100');
  const [customGrams, setCustomGrams] = useState<number>(100);
  const handlePortionChange = (type: string, customVal?: number) => {
    setPortionType(type);
    const val = type === 'custom' ? (customVal ?? customGrams) : parseFloat(type);
    setQuantity(val);
  };

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
      setFatSecretResults([]);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/food-library?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLibraryFoods(data);
        // Auto-trigger FatSecret fallback if FoodMaster returns nothing
        if (data.length === 0) {
          setFatSecretResults([]);
          setIsFatSecretSearching(true);
          try {
            const fsRes = await fetch(`${apiUrl}/food-library/external?q=${encodeURIComponent(searchQuery)}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (fsRes.ok) {
              const fsData = await fsRes.json();
              setFatSecretResults(fsData.results || []);
            }
          } catch (fsErr) {
            console.error('FatSecret search error:', fsErr);
          } finally {
            setIsFatSecretSearching(false);
          }
        } else {
          setFatSecretResults([]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectLibraryFood = (food: any, external = false) => {
    setSelectedLibraryFood(food);
    setIsExternalFood(external);
    setFatSecretVariants(null);
    setCustomName(food.name);
    setCategory(food.category);
    setCalories(food.calories);
    setCarbs(food.carbs);
    setProtein(food.protein);
    setFat(food.fat);
    setFiber(food.fiber || 0);

    const pType = food.portionType || 'weight';
    if (pType === 'count') {
      setPortionType('1');
      setCustomGrams(1);
      setQuantity(1);
      setUnit(food.servingUnit || 'piece');
    } else if (pType === 'volume') {
      setPortionType('100');
      setCustomGrams(100);
      setQuantity(100);
      setUnit('ml');
    } else {
      setPortionType('100');
      setCustomGrams(100);
      setQuantity(100);
      setUnit('g');
    }

    setLibraryFoods([]);
    setFatSecretResults([]);
    setSearchQuery('');
  };

  const handleClearSelected = () => {
    setSelectedLibraryFood(null);
    setIsExternalFood(false);
    setFatSecretVariants(null);
    setCustomName('');
    setCalories(0);
    setCarbs(0);
    setProtein(0);
    setFat(0);
    setFiber(0);
    setQuantity(1);
    setUnit('serving');
    setPortionType('100');
    setCustomGrams(100);
  };
  const validateSanity = (name: string, cal: number, carb: number, prot: number, fatVal: number, fib: number): boolean => {
    if (cal > 2500) {
      showToast(`Calories for "${name}" (${Math.round(cal)} kcal) seem too high. Please verify portion size.`, 'error');
      return false;
    }
    if (carb > 350) {
      showToast(`Carbohydrates for "${name}" (${Math.round(carb)}g) seem too high. Please verify portion size.`, 'error');
      return false;
    }
    if (prot > 150) {
      showToast(`Protein for "${name}" (${Math.round(prot)}g) seems too high. Please verify portion size.`, 'error');
      return false;
    }
    if (fatVal > 150) {
      showToast(`Fat for "${name}" (${Math.round(fatVal)}g) seems too high. Please verify portion size.`, 'error');
      return false;
    }
    if (fib > 50) {
      showToast(`Fiber for "${name}" (${Math.round(fib)}g) seems too high. Please verify portion size.`, 'error');
      return false;
    }
    return true;
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

    const qty = parseFloat(quantity as any) || 1;
    const calcCalories = finalCalories * qty;
    const calcCarbs = finalCarbs * qty;
    const calcProtein = finalProtein * qty;
    const calcFat = finalFat * qty;
    const calcFiber = finalFiber * qty;

    if (!validateSanity(mealName, calcCalories, calcCarbs, calcProtein, calcFat, calcFiber)) {
      return;
    }

    const payload: any = {
      name: mealName,
      category,
      mealType,
      calories: finalCalories,
      carbs: finalCarbs,
      protein: finalProtein,
      fat: finalFat,
      fiber: finalFiber,
      quantity: qty,
      unit,
      loggedAt: loggedAtStr
    };

    // FatSecret: pass base values + userConfirmed so backend saves to FoodMaster
    if (isExternalFood && selectedLibraryFood) {
      payload.isExternal = true;
      payload.userConfirmed = true;
      payload.baseCalories = selectedLibraryFood.calories;
      payload.baseCarbs = selectedLibraryFood.carbs;
      payload.baseProtein = selectedLibraryFood.protein;
      payload.baseFat = selectedLibraryFood.fat;
      payload.baseFiber = selectedLibraryFood.fiber || 0;
      payload.baseServingSize = selectedLibraryFood.servingSize || 100;
      payload.baseServingUnit = selectedLibraryFood.servingUnit || 'g';
    }

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

  const handleOpenScanner = () => {
    if (!features?.foodScanner) {
      setIsUpgradeModalOpen(true);
    } else {
      setIsScannerOpen(true);
      setScanFile(null);
      setScanPreviewUrl(null);
      setScanResult(null);
      setScanError(null);
    }
  };

  const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setScanFile(file);
      setScanPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setScanError(null);
    }
  };

  const triggerScanImage = async () => {
    if (!scanFile || !token) return;
    setIsScanning(true);
    setScanError(null);
    
    const steps = [
      'Scanning photo dimensions...',
      'Running visual object detection...',
      'Matching food with Indian Database...',
      'Estimating serving size & weight...',
      'Calculating calories & macros...'
    ];

    let stepIdx = 0;
    setScanningProgress(steps[0]);
    const progressInterval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setScanningProgress(steps[stepIdx]);
      }
    }, 900);

    const formData = new FormData();
    formData.append('image', scanFile);

    try {
      const response = await fetch(`${apiUrl}/food-logs/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (response.status === 402 || response.status === 403) {
        setIsScannerOpen(false);
        setIsUpgradeModalOpen(true);
        return;
      }

      const data = await response.json();
      if (response.ok && data.success) {
        setScanResult(data);
        const initialStates: Record<number, ScannedItemState> = {};
        if (data.items) {
          data.items.forEach((item: any, idx: number) => {
            const isCount = item.portionType === 'count';
            initialStates[idx] = {
              enabled: true,
              portionType: isCount ? '1' : '100',
              customGrams: isCount ? 1 : 100
            };
          });
        }
        setScannedItemsState(initialStates);
        showToast(`AI successfully detected ${data.items ? data.items.length : 0} items!`, 'success');
      } else {
        setScanError(data.message || 'AI scanning failed. Please try another image.');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setScanError('Connection error during AI scanning.');
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddScannedMeal = async () => {
    if (!scanResult || !token) return;
    try {
      const itemsToLog = scanResult.items.filter((_: any, idx: number) => {
        const itemState = scannedItemsState[idx] || { enabled: true, portionType: '100', customGrams: 100 };
        return itemState.enabled;
      });

      if (itemsToLog.length === 0) {
        showToast('No items were selected to log.', 'error');
        return;
      }

      // Check sanity validation for all checked items first
      let allSanityPassed = true;
      scanResult.items.forEach((item: any, idx: number) => {
        const itemState = scannedItemsState[idx] || { enabled: true, portionType: '100', customGrams: 105 };
        if (!itemState.enabled) return;

        const grams = itemState.portionType === 'custom' ? itemState.customGrams : parseFloat(itemState.portionType);
        const baseServingSize = item.servingSize || 100;
        const factor = grams / baseServingSize;

        const calcCalories = item.calories * factor;
        const calcCarbs = item.carbs * factor;
        const calcProtein = item.protein * factor;
        const calcFat = item.fat * factor;
        const calcFiber = (item.fiber || 0) * factor;

        if (!validateSanity(item.foodName, calcCalories, calcCarbs, calcProtein, calcFat, calcFiber)) {
          allSanityPassed = false;
        }
      });

      if (!allSanityPassed) return;

      const logPromises = scanResult.items.map(async (item: any, idx: number) => {
        const itemState = scannedItemsState[idx] || { enabled: true, portionType: '100', customGrams: 100 };
        if (!itemState.enabled) return null;
        // Skip items without nutrition data (requiresManualEntry)
        if (item.requiresManualEntry) return null;

        const grams = itemState.portionType === 'custom' ? itemState.customGrams : parseInt(itemState.portionType);
        const baseServingSize = item.servingSize || 100;

        const payload: any = {
          name: item.foodName,
          category: item.category || 'Non-Veg',
          mealType: scanMealType,
          calories: item.calories / baseServingSize, // per gram
          carbs: item.carbs / baseServingSize,
          protein: item.protein / baseServingSize,
          fat: item.fat / baseServingSize,
          fiber: (item.fiber || 0) / baseServingSize,
          quantity: grams,
          unit: item.servingUnit === 'ml' ? 'ml' : 'g',
          loggedAt: new Date().toISOString()
        };

        // FatSecret items: send confirmation signal to backend so it saves to FoodMaster
        if (item.source === 'FatSecret') {
          payload.isExternal = true;
          payload.userConfirmed = true;
          payload.baseCalories = item.calories;
          payload.baseCarbs = item.carbs;
          payload.baseProtein = item.protein;
          payload.baseFat = item.fat;
          payload.baseFiber = item.fiber || 0;
          payload.baseServingSize = baseServingSize;
          payload.baseServingUnit = item.servingUnit || 'g';
        }

        const response = await fetch(`${apiUrl}/food-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Failed to log ${item.foodName}`);
        }
        return response.json();
      });

      const loggedResults = await Promise.all(logPromises);
      const activeLogs = loggedResults.filter(Boolean);

      if (activeLogs.length > 0) {
        showToast('All checked food items logged successfully!', 'success');
        setIsScannerOpen(false);
        fetchLogs();
      } else {
        showToast('Error saving scanned meal items.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error saving scanned meal items.', 'error');
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
      <>
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

        {/* AI Photo Food Scanner Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-primary p-4 rounded-3xl text-white shadow-soft mb-6 relative overflow-hidden flex items-center justify-between">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Sparkles className="h-24 w-24" />
          </div>
          <div className="max-w-[70%]">
            <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 bg-white/20 rounded-full text-[8px] uppercase tracking-wider font-extrabold mb-1.5">
              <Sparkles className="h-3 w-3 fill-white" />
              <span>Premium Feature</span>
            </div>
            <h4 className="text-sm font-extrabold tracking-tight">AI Photo Food Scanner</h4>
            <p className="text-[10px] text-indigo-100 font-semibold mt-0.5 leading-tight">
              Snap a picture of your food to auto-estimate calories & macros instantly!
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenScanner}
            className="shrink-0 bg-white text-indigo-600 hover:bg-slate-50 font-bold text-[10px] px-3.5 py-2.5 rounded-2xl shadow-soft transition-all"
          >
            Scan Now
          </button>
        </div>

        {/* Log Form Card */}
        <div className="bg-white border border-slate-100 shadow-[0_12px_24px_rgba(0,0,0,0.02)] rounded-3xl p-5 mb-6">
          <form onSubmit={handleLogSubmit} className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Log a Meal</h3>

            {/* Tabs Selector */}
            <div className="flex space-x-1.5 p-1 bg-slate-100/80 rounded-2xl mb-4 border border-slate-200/20">
              <button
                key="search"
                type="button"
                onClick={() => {
                  setActiveTab('search');
                  setSelectedLibraryFood(null);
                  setQuantity(100);
                  setUnit('g');
                  setCustomName('');
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'search'
                    ? 'bg-white text-slate-800 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                🔍 Search Food
              </button>
              <button
                key="manual"
                type="button"
                onClick={() => {
                  setActiveTab('manual');
                  setSelectedLibraryFood(null);
                  setQuantity(1);
                  setUnit('serving');
                  setCustomName('');
                  setCalories(0);
                  setCarbs(0);
                  setProtein(0);
                  setFat(0);
                  setFiber(0);
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'manual'
                    ? 'bg-white text-slate-800 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ✍️ Add Manually
              </button>
              <button
                key="scan"
                type="button"
                onClick={() => {
                  setActiveTab('scan');
                  handleOpenScanner();
                }}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'scan'
                    ? 'bg-white text-slate-800 shadow-soft'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                📷 Scan Food
              </button>
            </div>

            {/* TAB CONTENT: SEARCH FOOD */}
            {activeTab === 'search' && (
              <div className="space-y-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search library (idli, roti, grilled chicken...)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold bg-slate-50/30 transition-all"
                  />

                  {/* Auto-suggestion overlay — FoodMaster results */}
                  {libraryFoods.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-100 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] max-h-56 overflow-y-auto z-10 divide-y divide-slate-100 overflow-hidden">
                      {libraryFoods.map((food) => (
                        <div
                          key={food._id}
                          onClick={() => handleSelectLibraryFood(food, false)}
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

                  {/* FatSecret fallback results */}
                  {libraryFoods.length === 0 && (isFatSecretSearching || fatSecretResults.length > 0) && (
                    <div className="absolute left-0 right-0 mt-2 bg-white border border-blue-100 rounded-3xl shadow-[0_12px_30px_rgba(0,0,0,0.08)] max-h-64 overflow-y-auto z-10 overflow-hidden">
                      <div className="px-3 pt-2.5 pb-1 flex items-center gap-1.5">
                        <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">🌐 FatSecret</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Not in local DB — showing verified external results</span>
                      </div>
                      {isFatSecretSearching && (
                        <div className="px-3 py-3 flex items-center gap-2 text-xs text-slate-400 font-semibold">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Searching FatSecret...
                        </div>
                      )}
                      {fatSecretResults.map((food: any, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            // If this food has variants, show picker first
                            if (fatSecretResults.length > 1 && idx === 0) {
                              setFatSecretVariants(fatSecretResults);
                            } else {
                              handleSelectLibraryFood(food, true);
                            }
                          }}
                          className="p-3 hover:bg-blue-50/50 cursor-pointer flex justify-between items-center text-sm transition-all border-t border-slate-100 first:border-0"
                        >
                          <span className="font-bold text-slate-700">{food.name}</span>
                          <span className="text-[10px] font-extrabold text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1.5">
                            {food.calories} kcal / 100{food.servingUnit}
                          </span>
                        </div>
                      ))}
                      {fatSecretResults.length > 1 && (
                        <div
                          className="p-2.5 text-center text-[10px] font-bold text-blue-500 bg-blue-50/40 cursor-pointer hover:bg-blue-50 transition-all border-t border-blue-100"
                          onClick={() => setFatSecretVariants(fatSecretResults)}
                        >
                          See all {fatSecretResults.length} variants →
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {selectedLibraryFood ? (
                  <div className="space-y-3.5 bg-slate-50/30 p-4 rounded-2xl border border-slate-100/70">
                    <div className="flex items-center justify-between p-3 bg-white border border-slate-150 rounded-xl">
                      <div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider block ${isExternalFood ? 'text-blue-600' : 'text-primary'}`}>
                          {isExternalFood ? '🌐 FatSecret Verified' : 'Local Database'}
                        </span>
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

                    {/* Backdating inputs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date of Meal</label>
                        <input
                          type="date"
                          required
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none text-xs font-bold text-slate-600 bg-white cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Time of Meal</label>
                        <input
                          type="time"
                          required
                          value={logTime}
                          onChange={(e) => setLogTime(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none text-xs font-bold text-slate-600 bg-white cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Period</label>
                        <select
                          value={mealType}
                          onChange={(e: any) => setMealType(e.target.value)}
                          className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none text-xs font-bold text-slate-600 bg-white cursor-pointer"
                        >
                          <option value="Breakfast">Breakfast</option>
                          <option value="Lunch">Lunch</option>
                          <option value="Dinner">Dinner</option>
                          <option value="Snack">Snack</option>
                        </select>
                      </div>
                    </div>

                    {/* Portion Selection */}
                    {(() => {
                      const foodPortionType = selectedLibraryFood?.portionType || 'weight';
                      let options: string[] = ['100', '200', '300', 'custom'];
                      let suffix = 'g';
                      let label = 'Enter Grams';
                      let suffixLabel = 'grams';

                      if (foodPortionType === 'count') {
                        options = ['1', '2', '3', 'custom'];
                        suffix = '';
                        label = 'Enter Quantity';
                        suffixLabel = selectedLibraryFood?.servingUnit || 'pieces';
                      } else if (foodPortionType === 'volume') {
                        options = ['100', '200', '300', 'custom'];
                        suffix = 'ml';
                        label = 'Enter Volume';
                        suffixLabel = 'ml';
                      }

                      return (
                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Portion Size</span>
                          <div className="grid grid-cols-4 gap-2">
                            {options.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handlePortionChange(type)}
                                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                  portionType === type
                                    ? 'bg-primary/10 border-primary text-primary'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {type === 'custom' ? 'Custom' : `${type}${suffix}`}
                              </button>
                            ))}
                          </div>

                          {portionType === 'custom' && (
                            <div className="animate-in fade-in duration-200">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="1"
                                  value={customGrams}
                                  onChange={(e) => handlePortionChange('custom', parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-slate-400">{suffixLabel}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Calculated Nutrition Preview */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-150 space-y-2 mt-4">
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Calculated Nutrition ({quantity}g)</span>
                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Calories</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {Math.round((selectedLibraryFood.calories / (selectedLibraryFood.servingSize || 100)) * quantity)} kcal
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Carbs</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {Math.round((selectedLibraryFood.carbs / (selectedLibraryFood.servingSize || 100)) * quantity)}g
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Protein</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {Math.round((selectedLibraryFood.protein / (selectedLibraryFood.servingSize || 100)) * quantity)}g
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Fat</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {Math.round((selectedLibraryFood.fat / (selectedLibraryFood.servingSize || 100)) * quantity)}g
                          </span>
                        </div>
                        <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                          <span className="text-[8px] text-slate-400 font-bold uppercase block">Fiber</span>
                          <span className="text-xs font-extrabold text-slate-700">
                            {Math.round(((selectedLibraryFood.fiber || 0) / (selectedLibraryFood.servingSize || 100)) * quantity)}g
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Log Meal</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-400 block">Search and select a food template from the library above to get started...</span>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: ADD MANUALLY */}
            {activeTab === 'manual' && (
              <div className="space-y-3.5 bg-slate-50/30 p-4 rounded-2xl border border-slate-100/70">
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
                </div>

                {/* Nutrients inputs */}
                <div className="pt-3 border-t border-slate-200/60">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Nutritional Breakdown</span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {/* Calories */}
                    <div className="p-2 rounded-xl text-center border bg-white border-slate-200/80 focus-within:border-primary/40">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Calories</span>
                      <input
                        type="number"
                        value={calories}
                        onChange={(e) => setCalories(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    {/* Carbs */}
                    <div className="p-2 rounded-xl text-center border bg-white border-slate-200/80 focus-within:border-primary/40">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Carbs</span>
                      <input
                        type="number"
                        value={carbs}
                        onChange={(e) => setCarbs(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    {/* Protein */}
                    <div className="p-2 rounded-xl text-center border bg-white border-slate-200/80 focus-within:border-primary/40">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Protein</span>
                      <input
                        type="number"
                        value={protein}
                        onChange={(e) => setProtein(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    {/* Fat */}
                    <div className="p-2 rounded-xl text-center border bg-white border-slate-200/80 focus-within:border-primary/40">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Fat</span>
                      <input
                        type="number"
                        value={fat}
                        onChange={(e) => setFat(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
                    </div>
                    {/* Fiber */}
                    <div className="p-2 rounded-xl text-center border bg-white border-slate-200/80 focus-within:border-primary/40">
                      <span className="text-[8px] font-bold text-slate-400 block uppercase">Fiber</span>
                      <input
                        type="number"
                        value={fiber}
                        onChange={(e) => setFiber(parseFloat(e.target.value) || 0)}
                        className="w-full text-center font-bold text-slate-700 text-xs mt-0.5 bg-transparent focus:outline-none"
                      />
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
                      className="w-full px-3 py-2 rounded-2xl border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-semibold bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 px-4 rounded-2xl shadow-soft flex items-center justify-center space-x-2 transition-all hover:shadow-md active:scale-[0.98]"
                >
                  <Plus className="h-4 w-4" />
                  <span>Log Meal</span>
                </button>
              </div>
            )}

            {/* TAB CONTENT: SCAN FOOD */}
            {activeTab === 'scan' && (
              <div className="text-center py-8 space-y-4 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50 animate-in fade-in duration-200">
                <div className="mx-auto h-16 w-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center border border-indigo-100 shadow-sm">
                  <Camera className="h-7 w-7" />
                </div>
                <h4 className="text-xs font-bold text-slate-700">AI Photo Food Scanner</h4>
                <p className="text-[10px] text-slate-400 font-semibold max-w-[240px] mx-auto leading-normal">
                  Identify visible food items instantly using Gemini AI and calculate accurate macros using local database matching.
                </p>
                <button
                  type="button"
                  onClick={handleOpenScanner}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-extrabold text-xs rounded-2xl shadow-soft transition-all"
                >
                  Launch Camera / Upload
                </button>
              </div>
            )}
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
        {/* PREMIUM LOCK MODAL */}
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl text-center animate-scaleIn">
              <div className="inline-flex h-14 w-14 bg-indigo-50 text-indigo-600 rounded-full items-center justify-center mb-4 border border-indigo-100">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Premium Food Scanner Locked</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                AI Photo Food Scanner is exclusive to our <strong>Premium Plan</strong> subscribers. Upgrade to get instant macro estimates and calorie counts from meal photos.
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    if (onNavigateToTab) {
                      onNavigateToTab('Profile');
                    }
                  }}
                  className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold shadow-soft flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="h-4 w-4 fill-white" />
                  <span>View Subscription Plans</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SCANNER MODAL */}
        {isScannerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl p-5 max-w-md w-full border border-slate-100 shadow-2xl relative my-8">
              <button
                type="button"
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-1.5 mb-4 border-b border-slate-100 pb-3">
                <Sparkles className="h-4 w-4 text-indigo-500 fill-indigo-500 animate-pulse" />
                <span>AI Photo Food Scanner</span>
              </h3>

              {!scanPreviewUrl ? (
                /* UPLOADER / CAMERA INTERFACE */
                <div className="border-2 border-dashed border-slate-200 hover:border-primary/40 rounded-2xl p-6 text-center transition-all bg-slate-50/50">
                  <input
                    type="file"
                    id="scanner-image-input"
                    accept="image/*"
                    onChange={handleScanFileChange}
                    className="hidden"
                  />
                  <label htmlFor="scanner-image-input" className="cursor-pointer flex flex-col items-center">
                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 border border-indigo-100">
                      <Camera className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 block">Take Photo or Upload Image</span>
                    <span className="text-[10px] text-slate-450 font-semibold mt-1 max-w-[200px]">
                      AI will analyze the meal image to estimate ingredients, serving size, and macros.
                    </span>
                  </label>
                </div>
              ) : (
                /* PREVIEW & SCANNING INTERFACE */
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-100 border border-slate-200">
                    <img src={scanPreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                    {isScanning && (
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(37,99,235,0.8)] top-0 animate-bounce" />
                    )}
                    {isScanning && (
                      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                        <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                        <span className="text-xs font-bold uppercase tracking-wider animate-pulse">{scanningProgress}</span>
                      </div>
                    )}
                  </div>

                  {scanError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-start space-x-2">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {!isScanning && !scanResult && (
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => { setScanFile(null); setScanPreviewUrl(null); }}
                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                      >
                        Choose Different Photo
                      </button>
                      <button
                        type="button"
                        onClick={triggerScanImage}
                        className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-soft flex items-center justify-center space-x-1.5 transition-all"
                      >
                        <Sparkles className="h-4 w-4 fill-white" />
                        <span>Identify & Estimate</span>
                      </button>
                    </div>
                  )}                  {scanResult && (
                    /* SCAN RESULTS CARD */
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-4 animate-in slide-in-from-bottom duration-250">
                      <span className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Detected Items in Plate</span>
                      
                      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
                        {scanResult.items && scanResult.items.map((item: any, idx: number) => {
                          const itemState = scannedItemsState[idx] || { enabled: true, portionType: '100', customGrams: 100 };
                          const grams = itemState.portionType === 'custom' ? itemState.customGrams : parseInt(itemState.portionType);
                          const baseServingSize = item.servingSize || 100;
                          const factor = grams / baseServingSize;

                          return (
                            <div key={idx} className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-3 shadow-sm">
                              {/* Header: toggle, name, confidence, calories */}
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={itemState.enabled}
                                    onChange={(e) => {
                                      setScannedItemsState(prev => ({
                                        ...prev,
                                        [idx]: { ...itemState, enabled: e.target.checked }
                                      }));
                                    }}
                                    className="h-4.5 w-4.5 text-primary border-slate-350 rounded-lg focus:ring-primary/20"
                                  />
                                  <div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-850">{item.foodName}</span>
                                      {item.source === 'FatSecret' && (
                                        <span className="text-[7px] font-extrabold bg-blue-50 text-blue-600 border border-blue-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">🌐 FatSecret</span>
                                      )}
                                      {item.source === 'FoodMaster' && (
                                        <span className="text-[7px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                                          {Math.round((item.confidence || 0) * 100)}% Match
                                        </span>
                                      )}
                                      {item.requiresManualEntry && (
                                        <span className="text-[7px] font-extrabold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Not Found</span>
                                      )}
                                    </div>
                                  </div>
                                </label>

                                {itemState.enabled && !item.requiresManualEntry && (
                                  <div className="text-right">
                                    <span className="text-xs font-black text-slate-800">
                                      {Math.round((item.calories || 0) * factor)} kcal
                                    </span>
                                  </div>
                                )}
                              </div>

                              {itemState.enabled && (
                                <>
                                  {item.requiresManualEntry ? (
                                    <div className="bg-slate-50 rounded-xl p-3 text-center border border-dashed border-slate-200">
                                      <span className="text-[10px] text-slate-400 font-semibold">Nutrition data not found. Search this food manually.</span>
                                    </div>
                                  ) : (
                                  <>
                                  {/* Nutrition values grid */}
                                  <div className="grid grid-cols-4 gap-1.5">
                                    <div className="bg-slate-50/50 p-1.5 rounded-xl text-center border border-slate-100">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Carbs</span>
                                      <span className="text-[10px] font-bold text-slate-700">{Math.round((item.carbs || 0) * factor)}g</span>
                                    </div>
                                    <div className="bg-slate-50/50 p-1.5 rounded-xl text-center border border-slate-100">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Protein</span>
                                      <span className="text-[10px] font-bold text-slate-700">{Math.round((item.protein || 0) * factor)}g</span>
                                    </div>
                                    <div className="bg-slate-50/50 p-1.5 rounded-xl text-center border border-slate-100">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Fat</span>
                                      <span className="text-[10px] font-bold text-slate-700">{Math.round((item.fat || 0) * factor)}g</span>
                                    </div>
                                    <div className="bg-slate-50/50 p-1.5 rounded-xl text-center border border-slate-100">
                                      <span className="text-[8px] text-slate-400 font-bold uppercase block">Fiber</span>
                                      <span className="text-[10px] font-bold text-slate-700">{Math.round((item.fiber || 0) * factor)}g</span>
                                    </div>
                                  </div>

                                  {/* Portion Size Selection */}
                                  {(() => {
                                    const foodPortionType = item.portionType || 'weight';
                                    let options: string[] = ['100', '200', '300', 'custom'];
                                    let suffix = 'g';
                                    let label = 'Enter Grams';
                                    let suffixLabel = 'grams';

                                    if (foodPortionType === 'count') {
                                      options = ['1', '2', '3', 'custom'];
                                      suffix = '';
                                      label = 'Enter Quantity';
                                      suffixLabel = item.servingUnit || 'pieces';
                                    } else if (foodPortionType === 'volume') {
                                      options = ['100', '200', '300', 'custom'];
                                      suffix = 'ml';
                                      label = 'Enter Volume';
                                      suffixLabel = 'ml';
                                    }

                                    return (
                                      <div className="space-y-1.5">
                                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Portion Size</span>
                                        <div className="grid grid-cols-4 gap-1.5">
                                          {options.map((type) => (
                                            <button
                                              key={type}
                                              type="button"
                                              onClick={() => {
                                                setScannedItemsState(prev => ({
                                                  ...prev,
                                                  [idx]: {
                                                    ...itemState,
                                                    portionType: type,
                                                    customGrams: type !== 'custom' ? parseInt(type) : itemState.customGrams
                                                  }
                                                }));
                                              }}
                                              className={`py-1 text-[9px] font-extrabold rounded-lg border transition-all ${
                                                itemState.portionType === type
                                                  ? 'bg-primary/10 border-primary text-primary'
                                                  : 'bg-white border-slate-205 text-slate-600 hover:bg-slate-50'
                                              }`}
                                            >
                                              {type === 'custom' ? 'Custom' : `${type}${suffix}`}
                                            </button>
                                          ))}
                                        </div>

                                        {itemState.portionType === 'custom' && (
                                          <div className="animate-in fade-in duration-200 mt-1">
                                            <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
                                            <div className="relative">
                                              <input
                                                type="number"
                                                min="1"
                                                value={itemState.customGrams}
                                                onChange={(e) => {
                                                  const val = parseInt(e.target.value) || 1;
                                                  setScannedItemsState(prev => ({
                                                    ...prev,
                                                    [idx]: { ...itemState, customGrams: val }
                                                  }));
                                                }}
                                                className="w-full px-2.5 py-1 rounded-lg border border-slate-205 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary/20"
                                              />
                                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-slate-400">{suffixLabel}</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                  </>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Total Sum Section */}
                      {(() => {
                        let totalCal = 0;
                        let totalCarb = 0;
                        let totalProt = 0;
                        let totalFatVal = 0;
                        let totalFib = 0;

                        if (scanResult.items) {
                          scanResult.items.forEach((item: any, idx: number) => {
                            const itemState = scannedItemsState[idx] || { enabled: true, portionType: '100', customGrams: 100 };
                            if (!itemState.enabled || item.requiresManualEntry || item.calories == null) return;

                            const grams = itemState.portionType === 'custom' ? itemState.customGrams : parseInt(itemState.portionType);
                            const factor = grams / (item.servingSize || 100);

                            totalCal += (item.calories || 0) * factor;
                            totalCarb += (item.carbs || 0) * factor;
                            totalProt += (item.protein || 0) * factor;
                            totalFatVal += (item.fat || 0) * factor;
                            totalFib += (item.fiber || 0) * factor;
                          });
                        }

                        return (
                          <div className="bg-indigo-50/40 border border-indigo-100/60 rounded-2xl p-4 space-y-2">
                            <span className="block text-[8px] font-extrabold text-indigo-750 uppercase tracking-wider">Total Meal Summary</span>
                            <div className="flex justify-between items-center pb-2 border-b border-indigo-100/40">
                              <span className="text-xs font-bold text-slate-650">Combined Energy</span>
                              <span className="text-sm font-black text-indigo-800">{Math.round(totalCal)} kcal</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center pt-1">
                              <div>
                                <span className="text-[8px] text-slate-450 font-bold block uppercase">Carbs</span>
                                <span className="text-xs font-extrabold text-slate-700">{Math.round(totalCarb)}g</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-450 font-bold block uppercase">Protein</span>
                                <span className="text-xs font-extrabold text-slate-700">{Math.round(totalProt)}g</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-450 font-bold block uppercase">Fat</span>
                                <span className="text-xs font-extrabold text-slate-700">{Math.round(totalFatVal)}g</span>
                              </div>
                              <div>
                                <span className="text-[8px] text-slate-450 font-bold block uppercase">Fiber</span>
                                <span className="text-xs font-extrabold text-slate-700">{Math.round(totalFib)}g</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-3 pt-2 border-t border-slate-200/60">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meal Window</label>
                          <select
                            value={scanMealType}
                            onChange={(e: any) => setScanMealType(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none"
                          >
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Dinner">Dinner</option>
                            <option value="Snack">Snack</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={() => { setScanResult(null); setScanFile(null); setScanPreviewUrl(null); }}
                          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                          Scan Another
                        </button>
                        <button
                          type="button"
                          onClick={handleAddScannedMeal}
                          className="flex-1 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-soft flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <span>Log Meal Entry</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FATSECRET VARIANT PICKER MODAL */}
      {fatSecretVariants && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">🌐 FatSecret</span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">Select Correct Variant</h3>
                <p className="text-[10px] text-slate-400 font-medium">Multiple matches found. Pick the closest one.</p>
              </div>
              <button
                type="button"
                onClick={() => setFatSecretVariants(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {fatSecretVariants.map((food: any, idx: number) => (
                <div
                  key={idx}
                  onClick={() => handleSelectLibraryFood(food, true)}
                  className="p-4 hover:bg-blue-50/40 cursor-pointer transition-all"
                >
                  <span className="text-sm font-bold text-slate-800 block">{food.name}</span>
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-orange-500">{food.calories} kcal</span>
                    <span className="text-[10px] text-slate-400 font-semibold">C: {food.carbs}g</span>
                    <span className="text-[10px] text-slate-400 font-semibold">P: {food.protein}g</span>
                    <span className="text-[10px] text-slate-400 font-semibold">F: {food.fat}g</span>
                    <span className="text-[9px] text-slate-400">per 100{food.servingUnit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
