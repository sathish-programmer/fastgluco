import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  ShieldCheck, 
  BarChart3, 
  Search, 
  Plus, 
  LayoutGrid, 
  List, 
  Sparkles, 
  Package, 
  X, 
  Percent, 
  IndianRupee, 
  FileText,
  TrendingUp,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Download,
  Settings,
  Check,
  Building,
  Receipt,
  CreditCard,
  Banknote,
  FileCheck,
  Printer,
  Clock,
  Info,
  CheckCircle,
  Truck,
  Tag
} from 'lucide-react';

interface AdminVendorManagementProps {
  apiUrl: string;
  token: string;
}

export const AdminVendorManagement: React.FC<AdminVendorManagementProps> = ({ apiUrl, token }) => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Active view: 'LIST' or 'DETAIL'
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedVendorData, setSelectedVendorData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons' | 'settlements' | 'logs' | 'config'>('overview');

  // Search & Filter (ACTIVE vendors focused by default)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'API' | 'MANUAL' | 'EXTERNAL_AMAZON'>('ALL');
  const [sortBy, setSortBy] = useState<'ACTIVE_FIRST' | 'GMV' | 'ORDERS' | 'NAME'>('ACTIVE_FIRST');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Helper to reliably construct absolute logo URLs with backend host
  const getVendorLogoUrl = (logo?: string) => {
    if (!logo) return '';
    if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:')) {
      return logo;
    }
    const baseUrl = (apiUrl || '').replace(/\/api\/?$/, '');
    const cleanPath = logo.startsWith('/') ? logo : `/${logo}`;
    return `${baseUrl}${cleanPath}`;
  };

  // Add Vendor Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    name: '',
    slug: '',
    email: '',
    password: '',
    phone: '',
    website: '',
    businessName: '',
    licenseNumber: '',
    taxId: '',
    commissionRate: 30,
    settlementCycleDays: 30,
    checkoutType: 'INTERNAL',
    productSyncMethod: 'API',
    productType: 'MULTIPLE',
    externalStoreUrl: '',
    mockMode: true
  });

  // Settlement Generation State
  const [generatingSettlement, setGeneratingSettlement] = useState(false);
  const [settlementCycleDays, setSettlementCycleDays] = useState(30);
  const [settlementStartDate, setSettlementStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [settlementEndDate, setSettlementEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSettlementBreakdown, setSelectedSettlementBreakdown] = useState<any | null>(null);

  // Order Details Modal
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);

  // Record Bank Payout & Proof State
  const [selectedSettlementForPayout, setSelectedSettlementForPayout] = useState<any | null>(null);
  const [payoutForm, setPayoutForm] = useState({
    paymentReference: '',
    paymentMode: 'NEFT',
    paymentDate: new Date().toISOString().slice(0, 10),
    bankProofNotes: ''
  });
  const [recordingPayout, setRecordingPayout] = useState(false);

  // Settlement Voucher Printable View
  const [selectedSettlementForVoucher, setSelectedSettlementForVoucher] = useState<any | null>(null);
  const [selectedProofData, setSelectedProofData] = useState<any | null>(null);

  // Edit Config Form in Tab 6
  const [editConfigForm, setEditConfigForm] = useState<any>({});

  // Vendor Coupons State
  const [vendorCoupons, setVendorCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showAddCouponModal, setShowAddCouponModal] = useState(false);
  const [newCouponForm, setNewCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    maxRedemptions: '',
    expiryDate: ''
  });

  // Polling All Orders State
  const [pollingVendorOrders, setPollingVendorOrders] = useState(false);

  // Cancellation Review Modal State
  const [cancellationReviewModal, setCancellationReviewModal] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processGatewayRefund, setProcessGatewayRefund] = useState(true);
  const [arivuActionRequired, setArivuActionRequired] = useState(true);
  const [processingCancellation, setProcessingCancellation] = useState(false);

  // Manual Order Status Update State
  const [manualStatusModal, setManualStatusModal] = useState<any | null>(null);
  const [manualDeliveryStatus, setManualDeliveryStatus] = useState('shipped');
  const [manualCourierName, setManualCourierName] = useState('');
  const [manualTrackingId, setManualTrackingId] = useState('');
  const [manualTrackingUrl, setManualTrackingUrl] = useState('');
  const [manualStatusNotes, setManualStatusNotes] = useState('');
  const [updatingManualStatus, setUpdatingManualStatus] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorDetails = async (vendorId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedVendorData(data);
        setEditConfigForm({
          name: data.vendor.name || '',
          slug: data.vendor.slug || '',
          email: data.vendor.email || '',
          phone: data.vendor.phone || '',
          website: data.vendor.website || '',
          businessName: data.vendor.businessName || '',
          licenseNumber: data.vendor.licenseNumber || '',
          taxId: data.vendor.taxId || '',
          businessAddress: data.vendor.businessAddress || data.vendor.address || '',
          externalStoreUrl: data.vendor.externalStoreUrl || '',
          commissionRate: data.vendor.commissionConfig?.rate ?? 30,
          settlementCycleDays: data.vendor.commissionConfig?.settlementCycleDays ?? 30,
          gstOnCommissionRate: data.vendor.commissionConfig?.gstOnCommissionRate ?? 18,
          passThroughShipping: data.vendor.commissionConfig?.passThroughShipping ?? true,
          mockMode: data.vendor.apiConfig?.mockMode ?? true,
          baseUrl: data.vendor.apiConfig?.baseUrl || '',
          apiKey: data.vendor.apiConfig?.apiKey || '',
          checkoutType: data.vendor.capabilities?.checkoutType || 'INTERNAL',
          productSyncMethod: data.vendor.capabilities?.productSyncMethod || 'API',
          productType: data.vendor.capabilities?.productType || 'MULTIPLE',
          gstPercentage: data.vendor.gstPercentage ?? 0,
          gstInclusive: data.vendor.gstInclusive !== false,
          freeShippingThreshold: data.vendor.shippingConfig?.freeShippingThreshold ?? 499,
          shippingChargeBelowThreshold: data.vendor.shippingConfig?.shippingChargeBelowThreshold ?? 70,
          carrierPartnerName: data.vendor.shippingConfig?.carrierPartnerName || 'Pan-India Express',
          estimatedDeliveryDays: data.vendor.shippingConfig?.estimatedDeliveryDays || '3-5 Business Days',
          shippingNote: data.vendor.shippingConfig?.shippingNote || '',
          pollingFrequency: data.vendor.pollingConfig?.frequency || 'DAILY_TWICE',
          pollingIsActive: data.vendor.pollingConfig?.isActive ?? true,
          lastPolledAt: data.vendor.pollingConfig?.lastPolledAt
        });
        setSettlementCycleDays(data.vendor.commissionConfig?.settlementCycleDays ?? 30);
        fetchVendorCoupons(vendorId);
      }
    } catch (e) {
      console.error('Error fetching vendor details:', e);
    }
  };

  const fetchVendorCoupons = async (vendorId: string) => {
    setLoadingCoupons(true);
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons?vendorId=${vendorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setVendorCoupons(data.coupons || []);
      }
    } catch (e) {
      console.error('Error fetching vendor coupons:', e);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateVendorCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !newCouponForm.code) return;
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: newCouponForm.code.trim().toUpperCase(),
          discountType: newCouponForm.discountType,
          discountValue: Number(newCouponForm.discountValue),
          maxRedemptions: newCouponForm.maxRedemptions ? Number(newCouponForm.maxRedemptions) : undefined,
          expiryDate: newCouponForm.expiryDate || undefined,
          vendorId: selectedVendorId,
          isGlobal: false
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Coupon '${newCouponForm.code.toUpperCase()}' created successfully!`);
        setShowAddCouponModal(false);
        setNewCouponForm({ code: '', discountType: 'percentage', discountValue: 10, maxRedemptions: '', expiryDate: '' });
        fetchVendorCoupons(selectedVendorId);
      } else {
        alert(data.message || 'Error creating coupon');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDeleteVendorCoupon = async (couponId: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor coupon?')) return;
    try {
      const res = await fetch(`${apiUrl}/admin/payments/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSyncMessage('Coupon deleted successfully!');
        if (selectedVendorId) fetchVendorCoupons(selectedVendorId);
      } else {
        const data = await res.json();
        alert(data.message || 'Error deleting coupon');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const openVendorDetail = (vendor: any) => {
    setSelectedVendorId(vendor._id);
    fetchVendorDetails(vendor._id);
    setActiveTab('overview');
  };

  const handleSeedDefaults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setSyncMessage('Arivu Foods and future vendor architectural records seeded successfully!');
        setTimeout(() => setSyncMessage(null), 5000);
        await fetchVendors();
      }
    } catch (e) {
      console.error('Error seeding vendors:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCatalog = async (vendorId: string) => {
    setSyncingCatalog(true);
    setSyncMessage(null);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendorId}/sync-products`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Catalog Synchronized! Processed ${data.result?.createdCount || 0} new, ${data.result?.updatedCount || 0} updated products.`);
        if (selectedVendorId) {
          fetchVendorDetails(selectedVendorId);
        }
        fetchVendors();
      } else {
        setSyncMessage(`Sync Warning: ${data.message || 'Error occurred'}`);
      }
    } catch (e: any) {
      setSyncMessage(`Failed to sync: ${e.message}`);
    } finally {
      setSyncingCatalog(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  };

  const handleSubmitOrderToVendor = async (orderId: string) => {
    if (!selectedVendorId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/orders/${orderId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchVendorDetails(selectedVendorId);
        setSyncMessage('Order submitted to vendor successfully!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error submitting order to vendor:', e);
    }
  };

  const handleToggleVendorStatus = async (vendorId: string, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        setVendors(prev => prev.map(v => v._id === vendorId ? { ...v, isActive: !currentStatus } : v));
        if (selectedVendorData && selectedVendorData.vendor?._id === vendorId) {
          setSelectedVendorData({
            ...selectedVendorData,
            vendor: { ...selectedVendorData.vendor, isActive: !currentStatus }
          });
        }
        setSyncMessage(`Vendor status updated: ${!currentStatus ? 'ACTIVE (Live)' : 'INACTIVE (Template)'}.`);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (err: any) {
      console.error('Error toggling vendor status:', err);
    }
  };

  const handlePollOrderStatus = async (orderId: string) => {
    if (!selectedVendorId) return;
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/orders/${orderId}/sync-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        fetchVendorDetails(selectedVendorId);
        setSyncMessage('Polled latest status and tracking from vendor API!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error polling status:', e);
    }
  };

  const handlePollAllVendorOrders = async () => {
    if (!selectedVendorId) return;
    setPollingVendorOrders(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/poll-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Order polling complete! ${data.message || ''}`);
        fetchVendorDetails(selectedVendorId);
      } else {
        setSyncMessage(`Polling error: ${data.message || 'Failed to poll vendor orders'}`);
      }
    } catch (e: any) {
      setSyncMessage(`Polling error: ${e.message}`);
    } finally {
      setPollingVendorOrders(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleReviewCancellation = async () => {
    if (!cancellationReviewModal) return;
    setProcessingCancellation(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/orders/${cancellationReviewModal._id}/review-cancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: reviewAction,
          adminNotes: reviewNotes,
          processGatewayRefund: reviewAction === 'approve' ? processGatewayRefund : false,
          arivuActionRequired
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message || 'Customer cancellation/refund request processed!');
        if (selectedVendorId) fetchVendorDetails(selectedVendorId);
        setCancellationReviewModal(null);
        setSelectedOrderForDetails(null);
      } else {
        setSyncMessage(`Review error: ${data.message}`);
      }
    } catch (e: any) {
      setSyncMessage(`Review error: ${e.message}`);
    } finally {
      setProcessingCancellation(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleUpdateManualStatus = async () => {
    if (!manualStatusModal) return;
    setUpdatingManualStatus(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/orders/${manualStatusModal._id}/manual-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliveryStatus: manualDeliveryStatus,
          courierName: manualCourierName,
          trackingId: manualTrackingId,
          trackingUrl: manualTrackingUrl,
          notes: manualStatusNotes
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(data.message || 'Order status updated manually!');
        if (selectedVendorId) fetchVendorDetails(selectedVendorId);
        setManualStatusModal(null);
        setSelectedOrderForDetails(null);
      } else {
        setSyncMessage(`Update error: ${data.message}`);
      }
    } catch (e: any) {
      setSyncMessage(`Update error: ${e.message}`);
    } finally {
      setUpdatingManualStatus(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleGenerateSettlement = async () => {
    if (!selectedVendorId) return;
    setGeneratingSettlement(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}/settlements/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: settlementStartDate,
          endDate: settlementEndDate,
          cycleDays: settlementCycleDays
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`Settlement cycle created: ${data.settlementCode} for ₹${data.finalSettlementAmount.toLocaleString()}!`);
        fetchVendorDetails(selectedVendorId);
      } else {
        setSyncMessage(`Failed to generate settlement: ${data.message}`);
      }
    } catch (e: any) {
      setSyncMessage(`Error: ${e.message}`);
    } finally {
      setGeneratingSettlement(false);
      setTimeout(() => setSyncMessage(null), 5000);
    }
  };

  const handleFinalizeSettlement = async (settlementId: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/settlements/${settlementId}/finalize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (res.ok) {
        setSyncMessage('Settlement finalized and orders locked successfully!');
        if (selectedVendorId) fetchVendorDetails(selectedVendorId);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e) {
      console.error('Error finalizing settlement:', e);
    }
  };

  const handleDownloadSettlementCsv = async (settlementId: string, settlementCode: string) => {
    try {
      const activeToken = token || localStorage.getItem('fastgluco_admin_token') || '';
      const res = await fetch(`${apiUrl}/admin/vendors/settlements/${settlementId}/export-csv?token=${encodeURIComponent(activeToken)}`, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to download CSV' }));
        throw new Error(errorData.message || 'Failed to download CSV');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${settlementCode || 'settlement'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Error downloading settlement CSV:', err);
      alert(err.message || 'Error downloading CSV');
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlementForPayout) return;
    setRecordingPayout(true);
    try {
      await fetch(`${apiUrl}/admin/vendors/settlements/${selectedSettlementForPayout._id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentReference: payoutForm.paymentReference,
          paymentMode: payoutForm.paymentMode,
          paidAt: payoutForm.paymentDate || new Date().toISOString(),
          notes: payoutForm.bankProofNotes
        })
      }).catch(() => null);

      if (selectedVendorData && selectedVendorData.settlements) {
        selectedVendorData.settlements = selectedVendorData.settlements.map((s: any) => {
          if (s._id === selectedSettlementForPayout._id) {
            return {
              ...s,
              status: 'PAID',
              paidAt: payoutForm.paymentDate || new Date().toISOString(),
              paymentReference: payoutForm.paymentReference,
              paymentMode: payoutForm.paymentMode,
              bankProofNotes: payoutForm.bankProofNotes
            };
          }
          return s;
        });
        setSelectedVendorData({ ...selectedVendorData });
      }

      setSyncMessage(`Payout of ₹${selectedSettlementForPayout.finalSettlementAmount.toLocaleString()} marked as PAID! UTR: ${payoutForm.paymentReference}`);
      setSelectedSettlementForPayout(null);
      if (selectedVendorId) fetchVendorDetails(selectedVendorId);
      setTimeout(() => setSyncMessage(null), 5000);
    } catch (e: any) {
      setSyncMessage(`Payout recording error: ${e.message}`);
    } finally {
      setRecordingPayout(false);
    }
  };

  const handleSaveVendorConfig = async () => {
    if (!selectedVendorId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors/${selectedVendorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editConfigForm.name,
          slug: editConfigForm.slug,
          email: editConfigForm.email,
          phone: editConfigForm.phone,
          website: editConfigForm.website,
          businessName: editConfigForm.businessName,
          licenseNumber: editConfigForm.licenseNumber,
          taxId: editConfigForm.taxId,
          businessAddress: editConfigForm.businessAddress,
          address: editConfigForm.businessAddress,
          externalStoreUrl: editConfigForm.externalStoreUrl,
          gstPercentage: Number(editConfigForm.gstPercentage || 0),
          gstInclusive: editConfigForm.gstInclusive !== false,
          capabilities: {
            checkoutType: editConfigForm.checkoutType,
            productSyncMethod: editConfigForm.productSyncMethod,
            productType: editConfigForm.productType
          },
          commissionConfig: {
            rate: Number(editConfigForm.commissionRate),
            settlementCycleDays: Number(editConfigForm.settlementCycleDays),
            gstOnCommissionRate: Number(editConfigForm.gstOnCommissionRate),
            passThroughShipping: editConfigForm.passThroughShipping
          },
          shippingConfig: {
            freeShippingThreshold: Number(editConfigForm.freeShippingThreshold ?? 499),
            shippingChargeBelowThreshold: Number(editConfigForm.shippingChargeBelowThreshold ?? 70),
            carrierPartnerName: editConfigForm.carrierPartnerName || 'Pan-India Express',
            estimatedDeliveryDays: editConfigForm.estimatedDeliveryDays || '3-5 Business Days',
            shippingNote: editConfigForm.shippingNote || ''
          },
          pollingConfig: {
            frequency: editConfigForm.pollingFrequency || 'DAILY_TWICE',
            isActive: editConfigForm.pollingIsActive !== false,
            pollingTimes: ['09:00', '22:00'],
            cronExpression: '0 9,22 * * *'
          },
          apiConfig: {
            mockMode: editConfigForm.mockMode,
            baseUrl: editConfigForm.baseUrl,
            apiKey: editConfigForm.apiKey
          }
        })
      });
      if (res.ok) {
        setSyncMessage('Vendor configuration updated successfully!');
        fetchVendorDetails(selectedVendorId);
        fetchVendors();
      }
    } catch (e: any) {
      setSyncMessage(`Save error: ${e.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  const handleCreateNewVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/admin/vendors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newVendorForm.name,
          slug: newVendorForm.slug,
          email: newVendorForm.email,
          password: newVendorForm.password,
          phone: newVendorForm.phone,
          website: newVendorForm.website,
          businessName: newVendorForm.businessName,
          licenseNumber: newVendorForm.licenseNumber,
          taxId: newVendorForm.taxId,
          externalStoreUrl: newVendorForm.externalStoreUrl,
          capabilities: {
            checkoutType: newVendorForm.checkoutType,
            productSyncMethod: newVendorForm.productSyncMethod,
            productType: newVendorForm.productType
          },
          commissionConfig: {
            rate: Number(newVendorForm.commissionRate),
            settlementCycleDays: Number(newVendorForm.settlementCycleDays)
          },
          apiConfig: {
            mockMode: newVendorForm.mockMode
          }
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        fetchVendors();
        setSyncMessage('New vendor added successfully!');
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } catch (e: any) {
      alert(`Error creating vendor: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filtered and sorted vendors list (Active vendors always first by default)
  const filteredVendors = useMemo(() => {
    return vendors
      .filter(v => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = 
          v.name?.toLowerCase().includes(q) || 
          v.slug?.toLowerCase().includes(q) || 
          v.email?.toLowerCase().includes(q) || 
          v.businessName?.toLowerCase().includes(q);

        const matchesStatus = 
          statusFilter === 'ALL' ? true : 
          statusFilter === 'ACTIVE' ? v.isActive : !v.isActive;

        const checkoutType = v.capabilities?.checkoutType || 'INTERNAL';
        const syncMethod = v.capabilities?.productSyncMethod || 'API';
        const matchesType = 
          typeFilter === 'ALL' ? true :
          typeFilter === 'EXTERNAL_AMAZON' ? checkoutType === 'EXTERNAL_AMAZON' :
          typeFilter === 'API' ? syncMethod === 'API' : syncMethod === 'MANUAL';

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        if (sortBy === 'ACTIVE_FIRST') {
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          if (a.slug === 'arivu-foods') return -1;
          if (b.slug === 'arivu-foods') return 1;
          return (b.metrics?.totalOrderValue || 0) - (a.metrics?.totalOrderValue || 0);
        } else if (sortBy === 'GMV') {
          return (b.metrics?.totalOrderValue || 0) - (a.metrics?.totalOrderValue || 0);
        } else if (sortBy === 'ORDERS') {
          return (b.metrics?.orderCount || 0) - (a.metrics?.orderCount || 0);
        } else {
          return (a.name || '').localeCompare(b.name || '');
        }
      });
  }, [vendors, searchQuery, statusFilter, typeFilter, sortBy]);

  // Overall statistics banner
  const overallStats = useMemo(() => {
    const totalVendors = vendors.length;
    const activeVendors = vendors.filter(v => v.isActive).length;
    const totalGmv = vendors.reduce((acc, v) => acc + (v.metrics?.totalOrderValue || 0), 0);
    const totalPendingSettlement = vendors.reduce((acc, v) => acc + (v.metrics?.pendingSettlementAmount || 0), 0);
    const totalProducts = vendors.reduce((acc, v) => acc + (v.metrics?.productCount || 0), 0);

    return { totalVendors, activeVendors, totalGmv, totalPendingSettlement, totalProducts };
  }, [vendors]);

  return (
    <div className="space-y-6 text-slate-800">
      {/* GLOBAL FEEDBACK NOTIFICATION BANNER */}
      {syncMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="text-sm font-semibold">{syncMessage}</span>
          </div>
          <button onClick={() => setSyncMessage(null)} className="text-emerald-500 hover:text-emerald-700 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* VIEW: VENDOR LISTING */}
      {!selectedVendorId && (
        <div className="space-y-6">
          {/* HEADER & ACTIONS */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl shadow-inner">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Multi-Vendor E-Commerce Console</h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">Manage partner integrations, catalog synchronization, order fulfillment & commission settlements</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleSeedDefaults}
                disabled={loading}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-200 shadow-sm transition"
                title="Seeds Arivu Foods (with 30% commission & mock catalog) and future vendor templates"
              >
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Seed Vendors & Templates</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Plus className="h-4 w-4" />
                <span>Onboard New Vendor</span>
              </button>
            </div>
          </div>

          {/* KPI STATS BANNER */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-3.5">
              <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Vendors</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{overallStats.totalVendors}</p>
                <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{overallStats.activeVendors} Active (Live)</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-3.5">
              <div className="p-3 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendor Products</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{overallStats.totalProducts}</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Catalog Synced</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-3.5">
              <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total GMV</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">₹{overallStats.totalGmv.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Gross vendor orders</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-3.5">
              <div className="p-3 bg-purple-50 text-purple-600 border border-purple-100 rounded-xl">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arivu Agreement</p>
                <p className="text-2xl font-black text-purple-700 leading-none mt-1">{vendors.find(v => v.slug === 'arivu-foods')?.commissionConfig?.rate ?? 30}% Comm</p>
                <p className="text-[10px] text-purple-600/80 font-medium mt-0.5">+18% GST retention</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition duration-200 flex items-center gap-3.5">
              <div className="p-3 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Settlement</p>
                <p className="text-2xl font-black text-amber-600 leading-none mt-1">₹{overallStats.totalPendingSettlement.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Unsettled orders</p>
              </div>
            </div>
          </div>

          {/* MODERN SEGMENTED TABS: ACTIVE VENDORS (FOCUSED) vs INACTIVE VENDORS vs ALL */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/60">
              {/* ACTIVE VENDORS TAB (FOCUSED BY DEFAULT) */}
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-white text-emerald-700 shadow-sm border border-emerald-200 ring-2 ring-emerald-500/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Active Vendors</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  statusFilter === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {overallStats.activeVendors}
                </span>
              </button>

              {/* INACTIVE VENDORS TAB */}
              <button
                type="button"
                onClick={() => setStatusFilter('INACTIVE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                  statusFilter === 'INACTIVE'
                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200 ring-2 ring-slate-400/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span>Inactive Vendors</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  statusFilter === 'INACTIVE' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/70 text-slate-500'
                }`}>
                  {overallStats.totalVendors - overallStats.activeVendors}
                </span>
              </button>

              {/* ALL VENDORS TAB */}
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-indigo-700 shadow-sm border border-indigo-200 ring-2 ring-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>All ({overallStats.totalVendors})</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 px-2">
              <span className="font-medium hidden sm:inline">Current View:</span>
              <span className="font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                {statusFilter === 'ACTIVE' ? `🔥 ${overallStats.activeVendors} Active Fulfillment Partner(s)` : statusFilter === 'INACTIVE' ? `💤 ${overallStats.totalVendors - overallStats.activeVendors} Inactive / Staged Vendors` : `🌐 All ${overallStats.totalVendors} Vendors`}
              </span>
            </div>
          </div>

          {/* FILTER AND SEARCH BAR */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl shadow-sm">
            <div className="flex items-center gap-3 w-full md:w-auto flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search vendor name, slug, email, business..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Integration Type Filter */}
              <select
                value={typeFilter}
                onChange={(e: any) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ALL">All Integration Types</option>
                <option value="API">API Sync (Arivu)</option>
                <option value="MANUAL">Manual / Portal (Babu/Wig/Oncocur)</option>
                <option value="EXTERNAL_AMAZON">Buy on Amazon (Pure & Pure / Swasa)</option>
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="ACTIVE_FIRST">Active Vendors First</option>
                <option value="GMV">Highest GMV First</option>
                <option value="ORDERS">Most Orders First</option>
                <option value="NAME">Vendor Name A-Z</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode('GRID')}
                className={`p-1.5 rounded-lg transition text-xs ${
                  viewMode === 'GRID'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`p-1.5 rounded-lg transition text-xs ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* VENDORS DISPLAY (GRID OR TABLE) */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-sm font-medium">Loading vendors from database...</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 space-y-3 shadow-sm">
              <Store className="h-10 w-10 mx-auto text-slate-400" />
              <p className="text-base font-bold text-slate-900">No Vendors Found</p>
              <p className="text-xs max-w-md mx-auto text-slate-500">Click "Seed Vendors & Templates" above to automatically create Arivu Foods (with accepted 30% agreement terms) and future vendor templates.</p>
              <button
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
              >
                Seed Default Vendors Now
              </button>
            </div>
          ) : viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVendors.map((vendor) => {
                const isArivu = vendor.slug === 'arivu-foods' || vendor.name?.toLowerCase().includes('arivu');
                const isAmazon = vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON';
                const isApi = vendor.capabilities?.productSyncMethod === 'API';
                const commRate = vendor.commissionConfig?.rate ?? 30;
                const orderCount = vendor.metrics?.orderCount || 0;
                const productCount = vendor.metrics?.productCount || 0;
                const pendingAmt = vendor.metrics?.pendingSettlementAmount || 0;
                const gmv = vendor.metrics?.totalOrderValue || 0;
                const isHealthy = vendor.metrics?.healthStatus !== 'UNHEALTHY';

                return (
                  <div
                    key={vendor._id}
                    className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4 group ${
                      vendor.isActive 
                        ? 'border-emerald-300/90 ring-2 ring-emerald-500/10 shadow-emerald-500/5' 
                        : 'border-slate-200/90 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top Bar: Logo, Name & Live badge, Status Toggle */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                            {vendor.logo ? (
                              <img 
                                src={getVendorLogoUrl(vendor.logo)} 
                                alt={vendor.name} 
                                onError={(e: any) => {
                                  if (vendor.slug === 'arivu-foods' || vendor.name?.toLowerCase().includes('arivu')) {
                                    e.currentTarget.src = '/assets/arivu-logo.png';
                                  }
                                }}
                                className="h-full w-full object-contain p-1" 
                              />
                            ) : (
                              <Store className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition truncate">
                                {vendor.name}
                              </h3>
                              {isArivu && (
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                                  LIVE
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">{vendor.businessName || vendor.slug}</p>
                          </div>
                        </div>

                        {/* Interactive Status Toggle Pill */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleVendorStatus(vendor._id, vendor.isActive, e)}
                          title={vendor.isActive ? 'Click to deactivate vendor' : 'Click to activate vendor'}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shrink-0 shadow-xs ${
                            vendor.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200/80 hover:text-slate-700'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${vendor.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{vendor.isActive ? 'Active' : 'Inactive'}</span>
                        </button>
                      </div>

                      {/* Capabilities & Commission Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isApi ? (
                          <span className="bg-blue-50 text-blue-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-blue-200/80 flex items-center gap-1 shadow-xs">
                            <RefreshCw className="h-3 w-3" /> API Sync
                          </span>
                        ) : isAmazon ? (
                          <span className="bg-amber-50 text-amber-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-amber-200/80 flex items-center gap-1 shadow-xs">
                            <ExternalLink className="h-3 w-3" /> Buy on Amazon
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                            Manual Fulfillment
                          </span>
                        )}

                        <span className="bg-purple-50 text-purple-700 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-purple-200/80 shadow-xs">
                          {commRate}% Commission
                        </span>

                        {vendor.apiConfig?.mockMode && (
                          <span className="bg-slate-100 text-slate-600 text-[11px] font-semibold px-2 py-1 rounded-lg border border-slate-200">
                            Mock API
                          </span>
                        )}
                      </div>

                      {/* Location & Website Preview */}
                      {(vendor.businessAddress || vendor.address || vendor.website) && (
                        <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
                          {(vendor.businessAddress || vendor.address) && (
                            <div className="flex items-start gap-1.5 truncate">
                              <span className="text-slate-400 font-bold shrink-0">📍</span>
                              <span className="truncate text-slate-700 font-medium">{vendor.businessAddress || vendor.address}</span>
                            </div>
                          )}
                          {vendor.website && (
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-slate-400 font-bold shrink-0">🌐</span>
                              <a href={vendor.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline truncate font-semibold">
                                {vendor.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Metrics 3-Col Box */}
                      <div className="grid grid-cols-3 divide-x divide-slate-200/80 bg-slate-50/80 border border-slate-200/70 rounded-xl p-2.5 text-center">
                        <div className="px-1">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Products</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{productCount}</p>
                        </div>
                        <div className="px-1">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Orders</p>
                          <p className="text-sm font-black text-slate-900 mt-0.5">{orderCount}</p>
                        </div>
                        <div className="px-1">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Pending Set.</p>
                          <p className={`text-sm font-black mt-0.5 ${pendingAmt > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                            ₹{pendingAmt > 0 ? pendingAmt.toLocaleString('en-IN') : '0'}
                          </p>
                        </div>
                      </div>

                      {/* GMV row */}
                      {gmv > 0 && (
                        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-200/70">
                          <span className="font-medium text-slate-500">Total GMV</span>
                          <span className="text-slate-900 font-extrabold">₹{gmv.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {/* Sync Status info */}
                      {isApi && (
                        <div className="text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
                          <span className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${
                              isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                            }`} />
                            Health: <span className={isHealthy ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{vendor.metrics?.healthStatus || 'HEALTHY'}</span>
                          </span>
                          <span>Last sync: {vendor.metrics?.lastSyncAt ? new Date(vendor.metrics.lastSyncAt).toLocaleDateString('en-IN') : 'Never'}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {isApi && (
                        <button
                          onClick={() => handleSyncCatalog(vendor._id)}
                          disabled={syncingCatalog}
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-200"
                        >
                          <RefreshCw className={`h-3 w-3 ${syncingCatalog ? 'animate-spin' : ''}`} />
                          <span>Sync</span>
                        </button>
                      )}

                      <button
                        onClick={() => openVendorDetail(vendor)}
                        className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                      >
                        <span>Manage Vendor</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Vendor</th>
                      <th className="px-4 py-3.5">Integration Method</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-center">Products</th>
                      <th className="px-4 py-3.5 text-center">Orders</th>
                      <th className="px-4 py-3.5">Total GMV</th>
                      <th className="px-4 py-3.5">Commission</th>
                      <th className="px-4 py-3.5">Pending Settlement</th>
                      <th className="px-4 py-3.5">Health</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredVendors.map((vendor) => (
                      <tr key={vendor._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                              {vendor.logo ? (
                                <img 
                                  src={getVendorLogoUrl(vendor.logo)} 
                                  alt="" 
                                  onError={(e: any) => {
                                    if (vendor.slug === 'arivu-foods' || vendor.name?.toLowerCase().includes('arivu')) {
                                      e.currentTarget.src = '/assets/arivu-logo.png';
                                    }
                                  }}
                                  className="h-full w-full object-contain p-0.5" 
                                />
                              ) : (
                                <Store className="h-4 w-4 text-slate-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-sm">{vendor.name}</p>
                              <p className="text-[11px] text-slate-500">{vendor.slug}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span className={`text-[11px] px-2 py-0.5 rounded border font-medium ${
                            vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : vendor.capabilities?.productSyncMethod === 'API'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {vendor.capabilities?.checkoutType === 'EXTERNAL_AMAZON' ? 'Amazon External' : vendor.capabilities?.productSyncMethod === 'API' ? 'API Sync' : 'Manual Portal'}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={(e) => handleToggleVendorStatus(vendor._id, vendor.isActive, e)}
                            title={vendor.isActive ? 'Click to deactivate' : 'Click to activate'}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                              vendor.isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${vendor.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{vendor.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-slate-900">
                          {vendor.metrics?.productCount || 0}
                        </td>

                        <td className="px-4 py-4 text-center font-bold text-slate-900">
                          {vendor.metrics?.orderCount || 0}
                        </td>

                        <td className="px-4 py-4 font-bold text-slate-900">
                          ₹{(vendor.metrics?.totalOrderValue || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4 text-purple-700 font-semibold">
                          {vendor.commissionConfig?.rate ?? 30}%
                        </td>

                        <td className="px-4 py-4 text-amber-600 font-bold">
                          ₹{(vendor.metrics?.pendingSettlementAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className={`h-2 w-2 rounded-full ${
                              vendor.metrics?.healthStatus !== 'UNHEALTHY'
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            }`} />
                            <span className="font-semibold text-slate-700">{vendor.metrics?.healthStatus || 'HEALTHY'}</span>
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => openVendorDetail(vendor)}
                            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: VENDOR DETAILS VIEW (6 TABS) */}
      {selectedVendorId && selectedVendorData && (
        <div className="space-y-6">
          {/* TOP BACK BAR */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedVendorId(null); setSelectedVendorData(null); fetchVendors(); }}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                  {selectedVendorData.vendor?.logo ? (
                    <img 
                      src={getVendorLogoUrl(selectedVendorData.vendor.logo)} 
                      alt="" 
                      onError={(e: any) => {
                        if (selectedVendorData.vendor?.slug === 'arivu-foods' || selectedVendorData.vendor?.name?.toLowerCase().includes('arivu')) {
                          e.currentTarget.src = '/assets/arivu-logo.png';
                        }
                      }}
                      className="h-full w-full object-contain p-1" 
                    />
                  ) : (
                    <Store className="h-7 w-7 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-xl font-black text-slate-900">{selectedVendorData.vendor?.name}</h2>
                    <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-lg font-bold border border-slate-200">
                      {selectedVendorData.vendor?.slug}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleVendorStatus(selectedVendorData.vendor?._id, selectedVendorData.vendor?.isActive)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer shadow-xs ${
                        selectedVendorData.vendor?.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={selectedVendorData.vendor?.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span className={`h-2 w-2 rounded-full ${selectedVendorData.vendor?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{selectedVendorData.vendor?.isActive ? 'Active Partner (Live)' : 'Inactive (Template)'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{selectedVendorData.vendor?.businessName} • {selectedVendorData.vendor?.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {selectedVendorData.vendor?.capabilities?.productSyncMethod === 'API' && (
                <button
                  onClick={() => handleSyncCatalog(selectedVendorId)}
                  disabled={syncingCatalog}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <RefreshCw className={`h-4 w-4 text-emerald-600 ${syncingCatalog ? 'animate-spin' : ''}`} />
                  <span>Sync Catalog Now</span>
                </button>
              )}
            </div>
          </div>

          {/* 7 TABS NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-inner">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'products', label: `Products (${selectedVendorData.products?.length || 0})`, icon: Package },
              { id: 'orders', label: `Orders (${selectedVendorData.orders?.length || 0})`, icon: FileText },
              { id: 'coupons', label: `Coupons (${vendorCoupons.length})`, icon: Tag },
              { id: 'settlements', label: `Commission & Settlements`, icon: IndianRupee },
              { id: 'logs', label: `API Integration & Sync Logs`, icon: Activity },
              { id: 'config', label: `Vendor Configuration`, icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* AGREEMENT HIGHLIGHT BANNER */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">Commercial Partnership Terms (Accepted Agreement 02.09.2026)</h3>
                      <p className="text-xs text-slate-500">Formal agreement governing product listing, order processing, commission retention & settlement terms.</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 shrink-0">
                    Active Contract
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/60">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Platform Commission</p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">{selectedVendorData.vendor?.commissionConfig?.rate ?? 30}% Listed Price</p>
                    <p className="text-[11px] text-slate-500">Excludes shipping & gateway fee</p>
                  </div>
                  <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100">
                    <p className="text-[10px] uppercase font-bold text-purple-700">GST on Commission</p>
                    <p className="text-lg font-black text-purple-900 mt-0.5">{selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18}% of Commission</p>
                    <p className="text-[11px] text-purple-700/80">Total platform retention: {((selectedVendorData.vendor?.commissionConfig?.rate ?? 30) * (1 + (selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18) / 100)).toFixed(1)}%</p>
                  </div>
                  <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100">
                    <p className="text-[10px] uppercase font-bold text-emerald-700">Shipping Pass-Through</p>
                    <p className="text-lg font-black text-emerald-800 mt-0.5">100% to Vendor</p>
                    <p className="text-[11px] text-emerald-700/80">Free ≥ ₹499 / state-based fee</p>
                  </div>
                  <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100">
                    <p className="text-[10px] uppercase font-bold text-blue-700">Payment Gateway Fee</p>
                    <p className="text-lg font-black text-blue-900 mt-0.5">Borne by Customer</p>
                    <p className="text-[11px] text-blue-700/80">2% + 18% GST (2.36%)</p>
                  </div>
                </div>
              </div>

              {/* STATS & COMMISSION SETTLEMENT EXECUTIVE LEDGER */}
              {(() => {
                const totalOrders = selectedVendorData.orders?.length || 0;
                const deliveredOrders = selectedVendorData.orders?.filter((o: any) => o.deliveryStatus === 'delivered') || [];
                const deliveredGrossSales = deliveredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                
                const commRate = selectedVendorData.vendor?.commissionConfig?.rate ?? 30;
                const gstRate = selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18;

                // 1. Delivered Listed Product GMV (Base on which commission is computed)
                const deliveredListedGmv = deliveredOrders.reduce((sum: number, o: any) => {
                  const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
                  return sum + listed;
                }, 0);
                
                // 2. Base Platform Commission (e.g. 30%)
                const commEarned = deliveredOrders.reduce((sum: number, o: any) => {
                  if (o.financialBreakdown?.platformCommission != null && o.financialBreakdown?.platformCommission !== 0) {
                    return sum + Number(o.financialBreakdown.platformCommission);
                  }
                  const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
                  return sum + Number(((listed * commRate) / 100).toFixed(2));
                }, 0);
                
                // 3. GST on Commission (e.g. 18%)
                const gstRetained = deliveredOrders.reduce((sum: number, o: any) => {
                  if (o.financialBreakdown?.gstOnCommission != null && o.financialBreakdown?.gstOnCommission !== 0) {
                    return sum + Number(o.financialBreakdown.gstOnCommission);
                  }
                  const comm = o.financialBreakdown?.platformCommission != null && o.financialBreakdown?.platformCommission !== 0
                    ? Number(o.financialBreakdown.platformCommission)
                    : Number((((o.financialBreakdown?.listedProductPrice || o.totalAmount || 0) * commRate) / 100).toFixed(2));
                  return sum + Number(((comm * gstRate) / 100).toFixed(2));
                }, 0);

                // 4. Total Platform Retention (Commission + GST on commission = 35.4%)
                const totalRetention = deliveredOrders.reduce((sum: number, o: any) => {
                  if (o.financialBreakdown?.totalPlatformRetention != null && o.financialBreakdown?.totalPlatformRetention !== 0) {
                    return sum + Number(o.financialBreakdown.totalPlatformRetention);
                  }
                  if (o.platformCommission != null && o.platformCommission !== 0) {
                    return sum + Number(o.platformCommission);
                  }
                  const comm = Number((((o.financialBreakdown?.listedProductPrice || o.totalAmount || 0) * commRate) / 100).toFixed(2));
                  const gst = Number(((comm * gstRate) / 100).toFixed(2));
                  return sum + Number((comm + gst).toFixed(2));
                }, 0);

                // 5. Shipping Pass-Through (100% to vendor)
                const shippingTransferred = deliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.shippingCharge) || 0), 0);
                
                // 6. Net Vendor Earned (Exact matching finalVendorPayable / vendorEarnings: 64.6% + shipping)
                const totalNetVendorEarned = deliveredOrders.reduce((sum: number, o: any) => {
                  if (o.financialBreakdown?.finalVendorPayable != null && o.financialBreakdown?.finalVendorPayable !== 0) {
                    return sum + Number(o.financialBreakdown.finalVendorPayable);
                  }
                  if (o.vendorEarnings != null && o.vendorEarnings !== 0) {
                    return sum + Number(o.vendorEarnings);
                  }
                  const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
                  const comm = Number(((listed * commRate) / 100).toFixed(2));
                  const gst = Number(((comm * gstRate) / 100).toFixed(2));
                  const ret = comm + gst;
                  return sum + Number((listed - ret + (o.shippingCharge || 0)).toFixed(2));
                }, 0);
                
                const settledPaidAmount = (selectedVendorData.settlements || [])
                  .filter((s: any) => s.status === 'PAID')
                  .reduce((sum: number, s: any) => sum + (s.finalSettlementAmount || 0), 0);
                
                const currentOutstandingDue = Math.max(0, totalNetVendorEarned - settledPaidAmount);

                return (
                  <div className="space-y-4">
                    {/* Executive Payable Banner */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block mb-1">
                          Executive Settlement Balance
                        </span>
                        <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <IndianRupee className="h-6 w-6 text-emerald-600" />
                          <span>Net Payable to Vendor: <span className="text-emerald-700">₹{totalNetVendorEarned.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Calculated from {deliveredOrders.length} delivered orders • Listed GMV ₹{deliveredListedGmv.toLocaleString('en-IN', { maximumFractionDigits: 2 })} - 35.4% Platform Retention (₹{totalRetention.toLocaleString('en-IN', { maximumFractionDigits: 2 })}) + Shipping (₹{shippingTransferred.toLocaleString('en-IN')})
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Settled to Date</span>
                          <span className="text-sm font-black text-slate-900 font-mono">₹{settledPaidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
                          <span className="text-[10px] font-bold text-amber-700 uppercase block">Outstanding Due</span>
                          <span className="text-base font-black text-amber-700 font-mono">₹{currentOutstandingDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <button
                          onClick={() => setActiveTab('settlements')}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                          <IndianRupee className="h-4 w-4" />
                          <span>Settle Cycles</span>
                        </button>
                      </div>
                    </div>

                    {/* Breakdown Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
                        <p className="text-xl font-black text-slate-900 mt-1">{totalOrders}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">{deliveredOrders.length} delivered</p>
                      </div>
                      <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listed Product GMV</p>
                        <p className="text-xl font-black text-slate-900 mt-1">₹{deliveredListedGmv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Paid: ₹{deliveredGrossSales.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Platform Comm (30%)</p>
                        <p className="text-xl font-black text-purple-800 mt-1">₹{commEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-purple-600 mt-0.5 font-medium">Mito Platform Profit</p>
                      </div>
                      <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">GST on Comm (18%)</p>
                        <p className="text-xl font-black text-purple-800 mt-1">₹{gstRetained.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Tax Compliance (SAC 9983)</p>
                      </div>
                      <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Shipping Pass-Through</p>
                        <p className="text-xl font-black text-emerald-800 mt-1">₹{shippingTransferred.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">100% to Vendor</p>
                      </div>
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Net Vendor Payable</p>
                        <p className="text-xl font-black text-emerald-900 mt-1">₹{totalNetVendorEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-amber-700 mt-0.5 font-bold">₹{currentOutstandingDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Outstanding</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* INTEGRATION HEALTH & DETAILS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>API & Fulfillment Architecture</span>
                  </h4>
                  <div className="space-y-0 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Product Sync Method:</span>
                      <span className="text-slate-900 font-bold">{selectedVendorData.vendor?.capabilities?.productSyncMethod || 'API'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Checkout Flow:</span>
                      <span className="text-slate-900 font-bold">{selectedVendorData.vendor?.capabilities?.checkoutType || 'INTERNAL'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Delivery & Logistics:</span>
                      <span className="text-emerald-700 font-bold">Vendor Managed</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Tracking Method:</span>
                      <span className="text-slate-900 font-bold">{selectedVendorData.vendor?.capabilities?.trackingMethod || 'API_POLLING'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">API Endpoint Base:</span>
                      <span className="text-blue-600 font-mono text-[11px] font-bold">{selectedVendorData.vendor?.apiConfig?.baseUrl || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-amber-600" />
                    <span>Vendor Profile & Compliance</span>
                  </h4>
                  <div className="space-y-0 text-xs divide-y divide-slate-100">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">FSSAI License:</span>
                      <span className="text-slate-900 font-mono font-bold">{selectedVendorData.vendor?.licenseNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">GST Registration:</span>
                      <span className="text-slate-900 font-mono font-bold">{selectedVendorData.vendor?.taxId || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Official Website:</span>
                      {(selectedVendorData.vendor?.website || selectedVendorData.vendor?.externalStoreUrl) ? (
                        <a 
                          href={selectedVendorData.vendor?.website || selectedVendorData.vendor?.externalStoreUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                        >
                          {selectedVendorData.vendor?.website || selectedVendorData.vendor?.externalStoreUrl} <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 font-medium">N/A</span>
                      )}
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500 font-medium">Registered Address:</span>
                      <span className="text-slate-900 text-right max-w-xs font-medium">
                        {selectedVendorData.vendor?.businessAddress || selectedVendorData.vendor?.address || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Vendor Product Catalog ({selectedVendorData.products?.length || 0})</h3>
                  <p className="text-xs text-slate-500 font-medium">Products mapped or synchronized from Arivu Foods API / manual catalog</p>
                </div>
                <button
                  onClick={() => handleSyncCatalog(selectedVendorId)}
                  disabled={syncingCatalog}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${syncingCatalog ? 'animate-spin' : ''}`} />
                  <span>Sync Catalog Now</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-4 py-3.5">Vendor SKU</th>
                      <th className="px-4 py-3.5">Category</th>
                      <th className="px-4 py-3.5">Price / MRP</th>
                      <th className="px-4 py-3.5 text-center">Stock</th>
                      <th className="px-4 py-3.5">FSSAI / Nutrition</th>
                      <th className="px-4 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedVendorData.products?.map((prod: any) => (
                      <tr key={prod._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                              {prod.image ? <img src={prod.image} alt="" className="h-full w-full object-cover" /> : <Package className="h-5 w-5 text-slate-400" />}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{prod.name}</p>
                              <p className="text-[10px] text-slate-500">{prod.productWeight || 'Standard size'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 font-medium">
                          {prod.vendorSku || prod.sku || 'N/A'}
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] border border-slate-200 font-medium">
                            {prod.category}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          ₹{prod.price}
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${prod.stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {prod.stock} units
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 text-[11px]">
                          {prod.fssaiNumber ? <span className="font-mono text-emerald-700 font-semibold">FSSAI: {prod.fssaiNumber}</span> : 'Standard'}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${prod.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {prod.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    <span>Vendor Order Stream & Financial Proof ({selectedVendorData.orders?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Track fulfillment status, 30% commission retention, shipping allocation, and net payable calculation per order</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePollAllVendorOrders}
                    disabled={pollingVendorOrders}
                    className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
                    title="Poll order tracking from Arivu Foods for all active orders"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${pollingVendorOrders ? 'animate-spin' : ''}`} />
                    <span>{pollingVendorOrders ? 'Polling Orders...' : 'Poll All Vendor Orders'}</span>
                  </button>
                </div>
              </div>

              {selectedVendorData.orders?.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-400 space-y-2 shadow-sm">
                  <FileText className="h-8 w-8 mx-auto text-slate-400" />
                  <p className="font-bold text-slate-900">No Orders Placed Yet</p>
                  <p className="text-xs text-slate-500">Orders placed by customers for this vendor's items will appear here automatically.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[950px]">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3.5">Order Ref</th>
                          <th className="px-4 py-3.5">Customer</th>
                          <th className="px-3 py-3.5">Product Price</th>
                          <th className="px-3 py-3.5 text-purple-700">30% Comm + GST</th>
                          <th className="px-3 py-3.5 text-emerald-700">Shipping (100%)</th>
                          <th className="px-3 py-3.5 text-slate-900">Net Vendor Due</th>
                          <th className="px-3 py-3.5">Delivery Status</th>
                          <th className="px-3 py-3.5">Settlement</th>
                          <th className="px-4 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedVendorData.orders?.map((order: any) => {
                          const gross = Number(order.totalAmount || 0);
                          const listedPrice = Number(order.financialBreakdown?.listedProductPrice ?? (order.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || gross));
                          const comm = Number(order.financialBreakdown?.platformCommission ?? (listedPrice * 0.30));
                          const gst = Number(order.financialBreakdown?.gstOnCommission ?? (comm * 0.18));
                          const totalRetention = Number(order.financialBreakdown?.totalPlatformRetention ?? order.platformCommission ?? (comm + gst));
                          const shipping = Number(order.shippingCharge || 0);
                          const netVendor = Number(order.financialBreakdown?.finalVendorPayable ?? order.vendorEarnings ?? Math.max(0, listedPrice - totalRetention + shipping));
                          const isDelivered = order.deliveryStatus === 'delivered';
                          const isSettled = order.settlementStatus === 'SETTLED' || order.settlementStatus === 'INCLUDED';
                          const hasCancelReq = !!order.cancellationRequest;

                          return (
                            <tr key={order._id} className="hover:bg-slate-50/80 transition">
                              <td className="px-4 py-3.5">
                                <div className="font-mono font-bold text-slate-900">
                                  {order.vendorOrderId ? order.vendorOrderId : `#${order._id.slice(-6).toUpperCase()}`}
                                </div>
                                <div className="font-mono text-[10px] text-blue-600 font-semibold">
                                  {order.vendorOrderId ? `Mito Ref: #${order._id.slice(-6).toUpperCase()}` : <span className="text-slate-400">Internal Ref</span>}
                                </div>
                                {hasCancelReq && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold uppercase tracking-wider">
                                    ⚠️ {order.cancellationRequest.type}: {order.cancellationRequest.status}
                                  </span>
                                )}
                              </td>

                              <td className="px-4 py-3.5">
                                <p className="text-slate-900 font-bold">{order.patientName || 'Customer'}</p>
                                <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                              </td>

                              <td className="px-3 py-3.5">
                                <div className="font-bold text-slate-900">₹{listedPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                {gross !== listedPrice && (
                                  <div className="text-[10px] text-slate-400 font-medium">Customer: ₹{gross.toLocaleString('en-IN')}</div>
                                )}
                              </td>

                              <td className="px-3 py-3.5">
                                <div className="font-bold text-purple-700">₹{totalRetention.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                <div className="text-[10px] text-purple-600/80 font-medium">₹{comm.toFixed(1)} + ₹{gst.toFixed(1)} GST</div>
                              </td>

                              <td className="px-3 py-3.5 font-bold text-emerald-700">
                                +₹{shipping}
                              </td>

                              <td className="px-3 py-3.5">
                                <div className="font-black text-slate-900 text-sm">₹{netVendor.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                                <div className="text-[10px] text-slate-500 font-medium">
                                  {isDelivered ? 'Delivered & Payable' : 'Accruing'}
                                </div>
                              </td>

                              <td className="px-3 py-3.5">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                                  order.deliveryStatus === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  order.deliveryStatus === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  order.deliveryStatus === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                  'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {order.deliveryStatus || 'pending'}
                                </span>
                              </td>

                              <td className="px-3 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  isSettled ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                  isDelivered ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-slate-100 text-slate-500 border-slate-200'
                                }`}>
                                  {isSettled ? 'Settled / Run Added' : isDelivered ? 'Pending Payout' : 'In Transit'}
                                </span>
                              </td>

                              <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedOrderForDetails(order)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 border border-slate-200"
                                  title="View exact math proof and tracking"
                                >
                                  <Receipt className="h-3 w-3 text-purple-600" />
                                  <span>Details</span>
                                </button>

                                {hasCancelReq && order.cancellationRequest.status === 'PENDING' && (
                                  <button
                                    onClick={() => {
                                      setCancellationReviewModal(order);
                                      setReviewAction('approve');
                                      setReviewNotes('');
                                    }}
                                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                    title="Review customer cancellation/refund request"
                                  >
                                    Review
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    setManualStatusModal(order);
                                    setManualDeliveryStatus(order.deliveryStatus || 'pending');
                                    setManualCourierName(order.trackingDetails?.courierName || '');
                                    setManualTrackingId(order.trackingDetails?.trackingId || '');
                                    setManualTrackingUrl(order.trackingDetails?.trackingUrl || '');
                                    setManualStatusNotes('');
                                  }}
                                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-semibold transition"
                                  title="Manually update order and tracking status"
                                >
                                  Status
                                </button>

                                {order.vendorSubmissionStatus !== 'SUBMITTED' ? (
                                  <button
                                    onClick={() => handleSubmitOrderToVendor(order._id)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                    title="Submit to Arivu Foods API"
                                  >
                                    Submit
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePollOrderStatus(order._id)}
                                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition"
                                    title="Poll latest tracking from vendor"
                                  >
                                    Poll Status
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3.5: VENDOR COUPONS */}
          {activeTab === 'coupons' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-indigo-600" />
                    <span>Vendor Coupons ({vendorCoupons.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Coupons configured specifically for {selectedVendorData.vendor?.name}. Customers ordering products from this vendor will only see and apply these coupons.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCouponModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Vendor Coupon</span>
                </button>
              </div>

              {loadingCoupons ? (
                <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Loading vendor coupons...</span>
                </div>
              ) : vendorCoupons.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Vendor Coupons Active</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      This vendor has no active coupons. When a customer adds products from this vendor to their cart, the coupon section will be automatically hidden unless you create a coupon here.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddCouponModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Create First Coupon
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
                        <th className="py-3 px-4">Coupon Code</th>
                        <th className="py-3 px-4">Discount</th>
                        <th className="py-3 px-4">Usage / Max</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {vendorCoupons.map((c) => {
                        const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                        const isLimitReached = c.maxRedemptions !== undefined && c.redemptionsCount >= c.maxRedemptions;
                        return (
                          <tr key={c._id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono font-black text-indigo-700">
                              {c.code}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                            </td>
                            <td className="py-3 px-4 text-slate-600">
                              {c.redemptionsCount || 0} {c.maxRedemptions ? `/ ${c.maxRedemptions}` : '(Unlimited)'}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('en-IN') : 'No Expiry'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                !c.isActive || isExpired || isLimitReached
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}>
                                {!c.isActive ? 'Inactive' : isExpired ? 'Expired' : isLimitReached ? 'Limit Reached' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => handleDeleteVendorCoupon(c._id)}
                                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: COMMISSION & SETTLEMENTS */}
          {activeTab === 'settlements' && (() => {
            const deliveredOrders = selectedVendorData.orders?.filter((o: any) => o.deliveryStatus === 'delivered') || [];
            const unsettledDeliveredOrders = deliveredOrders.filter((o: any) => o.settlementStatus !== 'SETTLED');
            const commRate = selectedVendorData.vendor?.commissionConfig?.rate ?? 30;
            const gstRate = selectedVendorData.vendor?.commissionConfig?.gstOnCommissionRate ?? 18;

            const deliveredListedGmv = deliveredOrders.reduce((sum: number, o: any) => {
              const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
              return sum + listed;
            }, 0);

            const commEarned = deliveredOrders.reduce((sum: number, o: any) => {
              if (o.financialBreakdown?.platformCommission != null && o.financialBreakdown?.platformCommission !== 0) {
                return sum + Number(o.financialBreakdown.platformCommission);
              }
              const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
              return sum + Number(((listed * commRate) / 100).toFixed(2));
            }, 0);

            const gstRetained = deliveredOrders.reduce((sum: number, o: any) => {
              if (o.financialBreakdown?.gstOnCommission != null && o.financialBreakdown?.gstOnCommission !== 0) {
                return sum + Number(o.financialBreakdown.gstOnCommission);
              }
              const comm = o.financialBreakdown?.platformCommission != null && o.financialBreakdown?.platformCommission !== 0
                ? Number(o.financialBreakdown.platformCommission)
                : Number((((o.financialBreakdown?.listedProductPrice || o.totalAmount || 0) * commRate) / 100).toFixed(2));
              return sum + Number(((comm * gstRate) / 100).toFixed(2));
            }, 0);

            const totalRetention = deliveredOrders.reduce((sum: number, o: any) => {
              if (o.financialBreakdown?.totalPlatformRetention != null && o.financialBreakdown?.totalPlatformRetention !== 0) {
                return sum + Number(o.financialBreakdown.totalPlatformRetention);
              }
              const comm = Number((((o.financialBreakdown?.listedProductPrice || o.totalAmount || 0) * commRate) / 100).toFixed(2));
              const gst = Number(((comm * gstRate) / 100).toFixed(2));
              return sum + Number((comm + gst).toFixed(2));
            }, 0);

            const shippingTransferred = deliveredOrders.reduce((sum: number, o: any) => sum + (Number(o.shippingCharge) || 0), 0);

            const totalNetVendorEarned = deliveredOrders.reduce((sum: number, o: any) => {
              if (o.financialBreakdown?.finalVendorPayable != null && o.financialBreakdown?.finalVendorPayable !== 0) {
                return sum + Number(o.financialBreakdown.finalVendorPayable);
              }
              if (o.vendorEarnings != null && o.vendorEarnings !== 0) {
                return sum + Number(o.vendorEarnings);
              }
              const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
              const comm = Number(((listed * commRate) / 100).toFixed(2));
              const gst = Number(((comm * gstRate) / 100).toFixed(2));
              return sum + Number((listed - (comm + gst) + (o.shippingCharge || 0)).toFixed(2));
            }, 0);

            const settledPaidAmount = (selectedVendorData.settlements || [])
              .filter((s: any) => s.status === 'PAID')
              .reduce((sum: number, s: any) => sum + (s.finalSettlementAmount || 0), 0);

            const currentOutstandingDue = Math.max(0, totalNetVendorEarned - settledPaidAmount);

            return (
            <div className="space-y-6">
              {/* SYNCHRONIZED EXECUTIVE SETTLEMENT BALANCE LEDGER */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block mb-1">
                    Live Settlement Ledger (Synchronized with Overview)
                  </span>
                  <h4 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <IndianRupee className="h-6 w-6 text-emerald-600" />
                    <span>Net Payable to Vendor: <span className="text-emerald-700">₹{totalNetVendorEarned.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Calculated from {deliveredOrders.length} delivered orders • Listed GMV ₹{deliveredListedGmv.toLocaleString('en-IN', { maximumFractionDigits: 2 })} - 35.4% Platform Retention (₹{totalRetention.toLocaleString('en-IN', { maximumFractionDigits: 2 })}) + Shipping (₹{shippingTransferred.toLocaleString('en-IN')})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Settled to Date</span>
                    <span className="text-sm font-black text-slate-900 font-mono">₹{settledPaidAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-right">
                    <span className="text-[10px] font-bold text-amber-700 uppercase block">Outstanding Due</span>
                    <span className="text-base font-black text-amber-700 font-mono">₹{currentOutstandingDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* BREAKDOWN TILES */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Delivered GMV</p>
                  <p className="text-xl font-black text-slate-900 mt-1">₹{deliveredListedGmv.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">{deliveredOrders.length} delivered orders</p>
                </div>
                <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Platform Comm (30%)</p>
                  <p className="text-xl font-black text-purple-800 mt-1">₹{commEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-purple-600 mt-0.5 font-medium">Mito Platform Profit</p>
                </div>
                <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">GST on Comm (18%)</p>
                  <p className="text-xl font-black text-purple-800 mt-1">₹{gstRetained.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">SAC 9983 Retention</p>
                </div>
                <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Shipping Pass-Through</p>
                  <p className="text-xl font-black text-emerald-800 mt-1">₹{shippingTransferred.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">100% to Vendor</p>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 shadow-sm">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Net Vendor Payable</p>
                  <p className="text-xl font-black text-emerald-900 mt-1">₹{totalNetVendorEarned.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  <p className="text-[10px] text-amber-700 mt-0.5 font-bold">₹{currentOutstandingDue.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Outstanding</p>
                </div>
              </div>

              {/* UNSETTLED DELIVERED ORDERS AWAITING CYCLE GENERATION */}
              {unsettledDeliveredOrders.length > 0 && (
                <div className="bg-amber-50/30 border border-amber-200/80 rounded-2xl p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-amber-950 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span>Delivered Orders Ready for Settlement Cycle ({unsettledDeliveredOrders.length})</span>
                      </h4>
                      <p className="text-xs text-amber-800 font-medium">These completed orders are eligible and will be bundled when you click "Run Settlement Calculation" below.</p>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      Net Due: ₹{unsettledDeliveredOrders.reduce((sum: number, o: any) => sum + (o.financialBreakdown?.finalVendorPayable || o.vendorEarnings || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-amber-50/60 text-slate-600 font-bold border-b border-amber-200 text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Order ID</th>
                          <th className="py-2.5 px-3">Delivered Date</th>
                          <th className="py-2.5 px-3">Listed GMV</th>
                          <th className="py-2.5 px-3">Platform Comm (30%)</th>
                          <th className="py-2.5 px-3">GST (18%)</th>
                          <th className="py-2.5 px-3">Net Vendor Share</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {unsettledDeliveredOrders.map((o: any) => {
                          const listed = Number(o.financialBreakdown?.listedProductPrice ?? (o.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || o.totalAmount || 0));
                          const comm = o.financialBreakdown?.platformCommission ?? Number(((listed * 30) / 100).toFixed(2));
                          const gst = o.financialBreakdown?.gstOnCommission ?? Number(((comm * 18) / 100).toFixed(2));
                          const payable = o.financialBreakdown?.finalVendorPayable ?? o.vendorEarnings ?? Number((listed - (comm + gst)).toFixed(2));
                          return (
                            <tr key={o._id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                                {o.vendorOrderId || `#${o._id.slice(-6).toUpperCase()}`}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {new Date(o.createdAt).toLocaleDateString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                ₹{listed.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-purple-700 font-semibold">
                                ₹{comm.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-purple-700 font-semibold">
                                ₹{gst.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 font-black text-emerald-700">
                                ₹{payable.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Awaiting Batch Run
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VENDOR BENEFICIARY BANK ACCOUNT CARD */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                      <Banknote className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Vendor Beneficiary & Settlement Account</span>
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          Verified for NEFT / RTGS / IMPS
                        </span>
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">All net commission settlements are remitted to this registered corporate account</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 font-medium">Agreed Platform Commission:</span>
                    <div className="text-sm font-black text-purple-700">
                      30.0% + 18% GST ({selectedVendorData.vendor?.commissionRate || 30}% Commercial)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Account Beneficiary Name</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedVendorData.vendor?.bankDetails?.accountName || 'Arivu Food Tech Solutions Pvt Ltd'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Bank Name & Branch</span>
                    <span className="font-bold text-slate-900 mt-0.5 block">{selectedVendorData.vendor?.bankDetails?.bankName || 'HDFC Bank (Koramangala Branch)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Account Number</span>
                    <span className="font-mono font-bold text-emerald-700 mt-0.5 block">{selectedVendorData.vendor?.bankDetails?.accountNumber || '50200084920194'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">IFSC Code</span>
                    <span className="font-mono font-bold text-blue-700 mt-0.5 block">{selectedVendorData.vendor?.bankDetails?.ifscCode || 'HDFC0001234'}</span>
                  </div>
                </div>
              </div>

              {/* SETTLEMENT DISCREPANCY ADVISORY BANNER */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <span>Agreement Settlement Cycle Configuration</span>
                </div>
                <p className="text-amber-800 font-medium">
                  In the signed agreement: <strong>Clause 13</strong> specifies a <strong>15-day settlement cycle</strong>, whereas <strong>Schedule A</strong> specifies a <strong>30-day settlement cycle</strong>.
                  Select your active operational cycle duration below:
                </p>
                <div className="flex items-center gap-4 pt-1">
                  <span className="font-bold text-slate-800">Active Operational Cycle:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSettlementCycleDays(15)}
                      className={`px-3 py-1 rounded-lg font-bold border transition ${settlementCycleDays === 15 ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      15 Days (Clause 13)
                    </button>
                    <button
                      onClick={() => setSettlementCycleDays(30)}
                      className={`px-3 py-1 rounded-lg font-bold border transition ${settlementCycleDays === 30 ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' : 'bg-white text-slate-700 border-slate-200'}`}
                    >
                      30 Days (Schedule A - Standard)
                    </button>
                  </div>
                </div>
              </div>

              {/* GENERATE SETTLEMENT TOOLBAR */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <IndianRupee className="h-5 w-5 text-emerald-600" />
                      <span>Generate Settlement Cycle Run</span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Calculates delivered orders in range, applies 30% commission, 18% GST retention, and 100% shipping transfer</p>
                  </div>

                  <button
                    onClick={handleGenerateSettlement}
                    disabled={generatingSettlement}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{generatingSettlement ? 'Calculating...' : 'Run Settlement Calculation'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={settlementStartDate}
                      onChange={(e) => setSettlementStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={settlementEndDate}
                      onChange={(e) => setSettlementEndDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Cycle Duration</label>
                    <input
                      type="text"
                      disabled
                      value={`${settlementCycleDays} Days Cycle`}
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* SETTLEMENT RUNS LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" />
                    <span>Settlement Runs, Payouts & Proof of Payment</span>
                  </h4>
                  <span className="text-xs text-slate-500 font-semibold">
                    {selectedVendorData.settlements?.length || 0} cycles generated
                  </span>
                </div>

                {selectedVendorData.settlements?.length === 0 ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-400 shadow-sm">
                    <IndianRupee className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-bold text-slate-900">No Settlements Generated Yet</p>
                    <p className="text-xs text-slate-500">Select dates above and click "Run Settlement Calculation" to compute your first cycle run.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[1000px]">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-3.5">Settlement Code</th>
                            <th className="px-3 py-3.5">Period</th>
                            <th className="px-2 py-3.5 text-center">Orders</th>
                            <th className="px-3 py-3.5">Gross Sales</th>
                            <th className="px-3 py-3.5 text-purple-700">Platform Share (35.4%)</th>
                            <th className="px-3 py-3.5 text-emerald-700">Shipping Transfer</th>
                            <th className="px-3 py-3.5 text-slate-900">Net Vendor Payable</th>
                            <th className="px-3 py-3.5">Payment & Proof</th>
                            <th className="px-4 py-3.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {selectedVendorData.settlements?.map((set: any) => {
                            const isPaid = set.status === 'PAID';

                            return (
                              <tr key={set._id} className="hover:bg-slate-50/80 transition">
                                <td className="px-4 py-3.5">
                                  <div className="font-mono font-bold text-slate-900">{set.settlementCode}</div>
                                  <div className="text-[10px] text-slate-400">
                                    {new Date(set.createdAt).toLocaleDateString()}
                                  </div>
                                </td>

                                <td className="px-3 py-3.5 text-slate-600 text-[11px] whitespace-nowrap font-medium">
                                  {new Date(set.startDate).toLocaleDateString()} – {new Date(set.endDate).toLocaleDateString()}
                                </td>

                                <td className="px-2 py-3.5 text-center font-bold text-slate-900">
                                  {set.totalOrdersCount}
                                </td>

                                <td className="px-3 py-3.5 font-bold text-slate-900">
                                  ₹{set.grossSales.toLocaleString()}
                                </td>

                                <td className="px-3 py-3.5 text-purple-700">
                                  <span className="font-bold">₹{set.totalPlatformRetention.toLocaleString()}</span>
                                  <span className="block text-[10px] text-purple-600/80 font-medium">(₹{set.totalPlatformCommission} + ₹{set.gstOnCommission} GST)</span>
                                </td>

                                <td className="px-3 py-3.5 font-bold text-emerald-700">
                                  +₹{set.shippingPassThrough.toLocaleString()}
                                </td>

                                <td className="px-3 py-3.5">
                                  <span className="font-black text-slate-900 text-sm">₹{set.finalSettlementAmount.toLocaleString()}</span>
                                </td>

                                <td className="px-3 py-3.5">
                                  {isPaid ? (
                                    <div>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="h-3 w-3" /> Paid
                                      </span>
                                      {set.paymentReference && (
                                        <div className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5 truncate max-w-[120px]" title={set.paymentReference}>
                                          UTR: {set.paymentReference}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                                        set.status === 'FINALIZED' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                      }`}>
                                        <Clock className="h-3 w-3" /> {set.status === 'FINALIZED' ? 'Ready for Payout' : 'Draft'}
                                      </span>
                                      <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Due to Vendor</div>
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                                  {!isPaid ? (
                                    <button
                                      onClick={() => {
                                        setSelectedSettlementForPayout(set);
                                        setPayoutForm({
                                          paymentReference: '',
                                          paymentMode: 'NEFT',
                                          paymentDate: new Date().toISOString().split('T')[0],
                                          bankProofNotes: `Payout for settlement ${set.settlementCode} to ${selectedVendorData.vendor?.name}`
                                        });
                                      }}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition inline-flex items-center gap-1 shadow-sm"
                                      title="Record Bank Transfer UTR Proof"
                                    >
                                      <Banknote className="h-3 w-3" />
                                      <span>Record Payout</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setSelectedProofData({
                                        settlementCode: set.settlementCode,
                                        vendorName: selectedVendorData.vendor?.name,
                                        paidAt: set.paidAt || set.updatedAt,
                                        paymentReference: set.paymentReference,
                                        paymentMode: set.paymentMode || 'NEFT / RTGS',
                                        finalSettlementAmount: set.finalSettlementAmount,
                                        bankDetails: selectedVendorData.vendor?.bankDetails,
                                        notes: set.bankProofNotes || 'Bank transfer completed successfully.'
                                      })}
                                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                      title="View verified bank payment reference"
                                    >
                                      <FileCheck className="h-3 w-3 text-emerald-600" />
                                      <span>Proof</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setSelectedSettlementForVoucher(set)}
                                    className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition inline-flex items-center gap-1"
                                    title="View & Print Official Settlement Voucher"
                                  >
                                    <Printer className="h-3 w-3" />
                                    <span>Voucher</span>
                                  </button>

                                  <button
                                    onClick={() => setSelectedSettlementBreakdown(set)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1 border border-slate-200"
                                    title="Line item calculation breakdown"
                                  >
                                    <Receipt className="h-3 w-3" />
                                  </button>

                                  <button
                                    onClick={() => handleDownloadSettlementCsv(set._id, set.settlementCode)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition border border-slate-200"
                                    title="Download CSV"
                                  >
                                    <Download className="h-3 w-3" />
                                  </button>

                                  {set.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleFinalizeSettlement(set._id)}
                                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                                      title="Lock settlement cycle"
                                    >
                                      Lock
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

          {/* TAB 5: API INTEGRATION & SYNC LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-600" />
                    <span>Vendor API Audit Logs ({selectedVendorData.syncLogs?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Complete record of catalog synchronization, order submissions, and status polls</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSyncCatalog(selectedVendorId)}
                    disabled={syncingCatalog}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${syncingCatalog ? 'animate-spin' : ''}`} />
                    <span>Run Sync Test</span>
                  </button>
                </div>
              </div>

              {selectedVendorData.syncLogs?.length === 0 ? (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-10 text-center text-slate-400 shadow-sm">
                  <Activity className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="font-bold text-slate-900">No Sync Logs Recorded</p>
                  <p className="text-xs text-slate-500">Click "Run Sync Test" to trigger catalog sync and record the first entry.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Action</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Driver Mode</th>
                        <th className="px-4 py-3.5">Duration</th>
                        <th className="px-4 py-3.5">Items Processed</th>
                        <th className="px-4 py-3.5">Timestamp</th>
                        <th className="px-5 py-3.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedVendorData.syncLogs?.map((log: any) => (
                        <tr key={log._id} className="hover:bg-slate-50/80 transition">
                          <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                            {log.action}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              log.status === 'WARNING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                              {log.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-[11px] font-medium">
                            {log.isMock ? <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">Mock Driver</span> : <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">Live API</span>}
                          </td>

                          <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                            {log.durationMs} ms
                          </td>

                          <td className="px-4 py-3.5 text-slate-900 font-bold">
                            {log.itemsProcessed || 0}
                          </td>

                          <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>

                          <td className="px-5 py-3.5 text-slate-600 text-[11px] max-w-xs truncate font-mono">
                            {log.errorMessage || JSON.stringify(log.responsePayload || {})}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VENDOR CONFIGURATION */}
          {activeTab === 'config' && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">Vendor Configuration & Capabilities</h3>
                  <p className="text-xs text-slate-500 font-medium">Configure architectural capabilities, commission terms, and API credentials</p>
                </div>
                <button
                  onClick={handleSaveVendorConfig}
                  disabled={saving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
                >
                  <Check className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SECTION: GENERAL INFO */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">General Information</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={editConfigForm.name || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">System Slug (Unique)</label>
                    <input
                      type="text"
                      value={editConfigForm.slug || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, slug: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editConfigForm.email || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Website URL</label>
                    <input
                      type="text"
                      placeholder="https://www.arivufoods.com"
                      value={editConfigForm.website || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, website: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Business Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Plot 42, Peenya Industrial Area, Bangalore 560058"
                      value={editConfigForm.businessAddress || ''}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, businessAddress: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* SECTION: ARCHITECTURAL CAPABILITIES */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Multi-Vendor Capabilities</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Checkout & Fulfillment Flow</label>
                    <select
                      value={editConfigForm.checkoutType || 'INTERNAL'}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, checkoutType: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="INTERNAL">Internal Checkout (Mito Cart & Payment)</option>
                      <option value="EXTERNAL_AMAZON">External Redirect ("Buy on Amazon")</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Catalog Sync Method</label>
                    <select
                      value={editConfigForm.productSyncMethod || 'API'}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, productSyncMethod: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                    >
                      <option value="API">Automated API Synchronization (Arivu Foods)</option>
                      <option value="MANUAL">Manual Listing via Admin Dashboard</option>
                    </select>
                  </div>

                  {editConfigForm.checkoutType === 'EXTERNAL_AMAZON' && (
                    <div>
                      <label className="block text-xs font-bold text-amber-700 mb-1">Amazon Product / Storefront URL</label>
                      <input
                        type="text"
                        value={editConfigForm.externalStoreUrl || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, externalStoreUrl: e.target.value })}
                        placeholder="https://www.amazon.in/dp/..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Commission Rate (%)</label>
                      <input
                        type="number"
                        value={editConfigForm.commissionRate}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, commissionRate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Settlement Cycle (Days)</label>
                      <select
                        value={editConfigForm.settlementCycleDays}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, settlementCycleDays: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                      >
                        <option value={15}>15 Days (Clause 13)</option>
                        <option value={30}>30 Days (Schedule A)</option>
                        <option value={7}>7 Days</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SECTION: API CONFIGURATION */}
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider">Vendor API Integration & Credentials</h4>
                  
                  <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
                    <input
                      type="checkbox"
                      id="mockModeToggle"
                      checked={editConfigForm.mockMode ?? true}
                      onChange={(e) => setEditConfigForm({ ...editConfigForm, mockMode: e.target.checked })}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="mockModeToggle" className="text-xs text-slate-700">
                      <span className="font-bold text-slate-900 block">Enable Mock API Driver</span>
                      Use pre-configured authentic Arivu Foods catalog & simulated order responses while Arivu finalizes live API docs.
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Production API Base URL</label>
                      <input
                        type="text"
                        value={editConfigForm.baseUrl || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, baseUrl: e.target.value })}
                        placeholder="https://api.arivufoods.com/v1"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">API Key / Authorization Token</label>
                      <input
                        type="password"
                        value={editConfigForm.apiKey || ''}
                        onChange={(e) => setEditConfigForm({ ...editConfigForm, apiKey: e.target.value })}
                        placeholder="••••••••••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION: VENDOR GST CONFIGURATION */}
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="h-4 w-4 text-indigo-600" />
                        <span>Vendor GST Configuration</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Configure vendor-specific GST rate and pricing model. Products associated with this vendor will dynamically apply these tax rules.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                      Vendor Level Tax
                    </span>
                  </div>

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          GST Percentage (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={editConfigForm.gstPercentage ?? 0}
                            onChange={(e) => setEditConfigForm({ ...editConfigForm, gstPercentage: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                            placeholder="0 (e.g. 5, 12, 18)"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Enter 0 for GST-exempt products (e.g. fresh staple grains, unprocessed natural foods).
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          GST Pricing Mode
                        </label>
                        <select
                          value={editConfigForm.gstInclusive ? 'INCLUSIVE' : 'EXCLUSIVE'}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, gstInclusive: e.target.value === 'INCLUSIVE' })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                        >
                          <option value="INCLUSIVE">Inclusive in Product MRP (Standard for FMCG / Packaged Foods)</option>
                          <option value="EXCLUSIVE">Exclusive (Added on top of subtotal at checkout)</option>
                        </select>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Indian consumer food law requires listed MRP to be inclusive of GST.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: SHIPPING CONFIGURATION */}
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span>Shipping Configuration</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Configure vendor-specific free delivery threshold, shipping fee, carrier partner, and customer dispatch messaging.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Pan-India Delivery
                    </span>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Free Shipping Threshold (₹) <span className="text-slate-400 font-normal">(Default: ₹499)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editConfigForm.freeShippingThreshold ?? 499}
                            onChange={(e) => setEditConfigForm({ ...editConfigForm, freeShippingThreshold: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                            placeholder="499"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Orders of ₹{editConfigForm.freeShippingThreshold || 499} or higher will have free delivery automatically applied.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Shipping Charge Below Threshold (₹)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={editConfigForm.shippingChargeBelowThreshold ?? 70}
                            onChange={(e) => setEditConfigForm({ ...editConfigForm, shippingChargeBelowThreshold: e.target.value })}
                            className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-500"
                            placeholder="70"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                          Shipping fee charged when order total is below the free threshold.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Courier / Logistics Partner Name
                        </label>
                        <input
                          type="text"
                          value={editConfigForm.carrierPartnerName || ''}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, carrierPartnerName: e.target.value })}
                          placeholder="e.g. Pan-India Express or Arivu Partner Logistics"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Shown to customer in cart breakdown (e.g. "via {editConfigForm.carrierPartnerName || 'Pan-India Express'}").
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Estimated Delivery Timeline
                        </label>
                        <input
                          type="text"
                          value={editConfigForm.estimatedDeliveryDays || ''}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, estimatedDeliveryDays: e.target.value })}
                          placeholder="e.g. 3-5 Business Days"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Shown to customer at checkout (e.g. "Estimated Timeline: 3-5 Business Days").
                        </span>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Custom Shipping Note / Dispatch Message
                        </label>
                        <textarea
                          rows={2}
                          value={editConfigForm.shippingNote || ''}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, shippingNote: e.target.value })}
                          placeholder="e.g. Dispatched directly from fresh certified stock. Tracking ID is issued upon dispatch."
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Optional custom dispatch note shown on checkout screen for products from this vendor.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION: ORDER STATUS POLLING SCHEDULE CONFIGURATION */}
                <div className="space-y-4 md:col-span-2 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span>Order Status & Tracking Polling Configuration</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Arivu does not provide webhooks. Automated background polling synchronizes shipments and tracking numbers once dispatched.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handlePollAllVendorOrders}
                      disabled={pollingVendorOrders}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${pollingVendorOrders ? 'animate-spin' : ''}`} />
                      <span>{pollingVendorOrders ? 'Polling Orders...' : 'Poll Vendor Orders Now'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Polling Frequency</label>
                        <select
                          value={editConfigForm.pollingFrequency || 'DAILY_TWICE'}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, pollingFrequency: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
                        >
                          <option value="DAILY_TWICE">Twice Daily at 9:00 AM & 10:00 PM IST (Arivu Recommended)</option>
                          <option value="EVERY_6_HOURS">Every 6 Hours</option>
                          <option value="EVERY_12_HOURS">Every 12 Hours</option>
                          <option value="CUSTOM">Custom Server Cron (0 9,22 * * *)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <input
                          type="checkbox"
                          id="pollingIsActiveToggle"
                          checked={editConfigForm.pollingIsActive !== false}
                          onChange={(e) => setEditConfigForm({ ...editConfigForm, pollingIsActive: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <label htmlFor="pollingIsActiveToggle" className="text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block">Enable Automated Background Polling</span>
                          Runs scheduled job to fetch AWB tracking from Arivu API for active orders.
                        </label>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                      <span>
                        Recommended schedule: <strong>9:00 AM & 10:00 PM IST</strong> captures all daytime and evening dispatches without rate limiting.
                      </span>
                      <span>
                        Last polled:{' '}
                        <strong className="text-slate-700">
                          {editConfigForm.lastPolledAt ? new Date(editConfigForm.lastPolledAt).toLocaleString() : 'Never / Automated on schedule'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: SETTLEMENT BREAKDOWN MODAL */}
      {selectedSettlementBreakdown && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-emerald-600" />
                  <span>Settlement Breakdown: {selectedSettlementBreakdown.settlementCode}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Order-level commercial formula calculation per agreement</p>
              </div>
              <button onClick={() => setSelectedSettlementBreakdown(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-center text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold uppercase">Gross Product Sales</span>
                  <span className="text-base font-black text-slate-900 mt-0.5 block">₹{selectedSettlementBreakdown.grossSales.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-purple-700 block text-[10px] font-bold uppercase">Platform Comm (30%)</span>
                  <span className="text-base font-black text-purple-700 mt-0.5 block">₹{selectedSettlementBreakdown.totalPlatformCommission.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-purple-700 block text-[10px] font-bold uppercase">GST on Comm (18%)</span>
                  <span className="text-base font-black text-purple-700 mt-0.5 block">₹{selectedSettlementBreakdown.gstOnCommission.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-emerald-800 block text-[10px] font-bold uppercase">Final Vendor Payable</span>
                  <span className="text-base font-black text-emerald-700 mt-0.5 block">₹{selectedSettlementBreakdown.finalSettlementAmount.toLocaleString()}</span>
                </div>
              </div>

              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="px-4 py-2.5">Order Ref</th>
                    <th className="px-3 py-2.5">Customer</th>
                    <th className="px-3 py-2.5">Listed Price</th>
                    <th className="px-3 py-2.5 text-purple-700">30% Comm</th>
                    <th className="px-3 py-2.5 text-purple-700">18% GST</th>
                    <th className="px-3 py-2.5">Vendor Share</th>
                    <th className="px-3 py-2.5 text-emerald-700">Shipping</th>
                    <th className="px-4 py-2.5 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedSettlementBreakdown.lineItems?.map((li: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">#{li.orderNumber}</td>
                      <td className="px-3 py-2.5 font-medium">{li.customerName}</td>
                      <td className="px-3 py-2.5 font-bold">₹{li.listedProductPrice}</td>
                      <td className="px-3 py-2.5 text-purple-700 font-semibold">₹{li.platformCommission}</td>
                      <td className="px-3 py-2.5 text-purple-700 font-semibold">₹{li.gstOnCommission}</td>
                      <td className="px-3 py-2.5 font-medium">₹{li.vendorProductShare}</td>
                      <td className="px-3 py-2.5 text-emerald-700 font-bold">₹{li.shippingCollected}</td>
                      <td className="px-4 py-2.5 text-right font-black text-emerald-700">₹{li.netVendorPayable}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSettlementBreakdown(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ORDER FINANCIAL BREAKDOWN MODAL */}
      {selectedOrderForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-purple-600" />
                  <span>Order Commercial & Commission Proof</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Mito Ref #{selectedOrderForDetails._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setSelectedOrderForDetails(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {(() => {
              const gross = Number(selectedOrderForDetails.totalAmount || 0);
              const listedPrice = Number(selectedOrderForDetails.financialBreakdown?.listedProductPrice ?? (selectedOrderForDetails.products?.reduce((acc: number, p: any) => acc + (p.price * p.qty), 0) || gross));
              const comm = Number(selectedOrderForDetails.financialBreakdown?.platformCommission ?? (listedPrice * 0.30));
              const gst = Number(selectedOrderForDetails.financialBreakdown?.gstOnCommission ?? (comm * 0.18));
              const totalRetention = Number(selectedOrderForDetails.financialBreakdown?.totalPlatformRetention ?? selectedOrderForDetails.platformCommission ?? (comm + gst));
              const shipping = Number(selectedOrderForDetails.shippingCharge || 0);
              const netVendor = Number(selectedOrderForDetails.financialBreakdown?.finalVendorPayable ?? selectedOrderForDetails.vendorEarnings ?? Math.max(0, listedPrice - totalRetention + shipping));
              const customerGst = Number(selectedOrderForDetails.gstAmount || selectedOrderForDetails.taxAmount || 0);
              const customerGatewayFee = Number(selectedOrderForDetails.financialBreakdown?.customerGatewayCharge ?? ((gross * 2.36) / 100));

              return (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Vendor Order Reference</span>
                      <span className="text-xs font-mono font-bold text-blue-700">{selectedOrderForDetails.vendorOrderId || 'Internal Order'}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Mito Ref: #{selectedOrderForDetails._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Order Status</span>
                      <span className="text-xs font-bold text-emerald-700 uppercase">{selectedOrderForDetails.deliveryStatus || 'pending'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-100 font-medium">
                    <div className="flex justify-between py-1.5">
                      <div>
                        <span className="text-slate-700 font-bold block">1. Listed Product GMV:</span>
                        {gross !== listedPrice && (
                          <span className="text-[10px] text-slate-400">Total Customer Paid: ₹{gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })} (incl. ₹{customerGst} customer tax)</span>
                        )}
                      </div>
                      <span className="text-slate-900 font-black">₹{listedPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-purple-700">
                      <span>2. Less: Mito Platform Commission (30%):</span>
                      <span className="font-bold">- ₹{comm.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-purple-700">
                      <span>3. Less: GST on Platform Commission (18%):</span>
                      <span className="font-bold">- ₹{gst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-purple-900 font-bold bg-purple-50/50 px-2 py-1 rounded">
                      <span>Total Platform Retention (35.4%):</span>
                      <span>₹{totalRetention.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-1.5 text-emerald-700">
                      <span>4. Plus: Shipping Pass-Through (100% to Vendor):</span>
                      <span className="font-bold">+ ₹{shipping.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2.5 text-sm font-bold bg-emerald-50 border border-emerald-200 px-3 rounded-xl mt-2">
                      <span className="text-emerald-900 font-black">Net Vendor Payable Amount (64.6% + shipping):</span>
                      <span className="text-emerald-700 font-black">₹{netVendor.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  {/* SHIPMENT & TRACKING DETAILS BOX (ARIVU CONFIRMED SCHEMA) */}
                  <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-blue-600" />
                        <span>Shipment & Courier Tracking</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white text-blue-700 border border-blue-200">
                        Status: {selectedOrderForDetails.deliveryStatus || 'pending'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Logistics Provider</span>
                        <span className="font-bold text-slate-800">
                          {selectedOrderForDetails.trackingDetails?.courierName || 'Pending Dispatch'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] uppercase font-bold">Tracking ID (AWB)</span>
                        <span className="font-mono font-bold text-slate-900">
                          {selectedOrderForDetails.trackingDetails?.trackingId || 'Not Assigned'}
                        </span>
                      </div>
                    </div>
                    {selectedOrderForDetails.trackingDetails?.trackingUrl && (
                      <div className="pt-1.5 border-t border-blue-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-medium">Track Shipment:</span>
                        <a
                          href={selectedOrderForDetails.trackingDetails.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 underline"
                        >
                          <span>[Track Order]</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* CANCELLATION / RETURN / REFUND REQUEST BOX */}
                  {selectedOrderForDetails.cancellationRequest && (
                    <div className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                      selectedOrderForDetails.cancellationRequest.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                      selectedOrderForDetails.cancellationRequest.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                      'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          <span>Customer {selectedOrderForDetails.cancellationRequest.type.toUpperCase()} Request</span>
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          selectedOrderForDetails.cancellationRequest.status === 'APPROVED' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' :
                          selectedOrderForDetails.cancellationRequest.status === 'REJECTED' ? 'bg-rose-100 border-rose-300 text-rose-800' :
                          'bg-amber-100 border-amber-300 text-amber-800'
                        }`}>
                          {selectedOrderForDetails.cancellationRequest.status}
                        </span>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div>
                          <strong className="text-slate-700">Reason:</strong> {selectedOrderForDetails.cancellationRequest.reason}
                        </div>
                        {selectedOrderForDetails.cancellationRequest.adminNotes && (
                          <div>
                            <strong className="text-slate-700">Admin Notes:</strong> {selectedOrderForDetails.cancellationRequest.adminNotes}
                          </div>
                        )}
                        <div className="flex justify-between pt-1 text-[10px] text-slate-500">
                          <span>Refund Status: <strong>{selectedOrderForDetails.cancellationRequest.refundStatus}</strong></span>
                          <span>Arivu Action: <strong>{selectedOrderForDetails.cancellationRequest.arivuActionRequired ? 'Required Manually' : 'None'}</strong></span>
                        </div>
                      </div>

                      {selectedOrderForDetails.cancellationRequest.status === 'PENDING' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellationReviewModal(selectedOrderForDetails);
                            setReviewAction('approve');
                            setReviewNotes('');
                          }}
                          className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-1"
                        >
                          Review & Process Customer Request
                        </button>
                      )}
                    </div>
                  )}

                  <div className="bg-purple-50/50 p-2.5 rounded-xl border border-purple-100 text-[11px] text-purple-800 flex items-start gap-2">
                    <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>
                      Customer Gateway Fee (₹{customerGatewayFee.toFixed(2)}) is collected from customer during checkout and retained for payment processor settlement (0 deducted from vendor).
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setManualStatusModal(selectedOrderForDetails);
                  setManualDeliveryStatus(selectedOrderForDetails.deliveryStatus || 'pending');
                  setManualCourierName(selectedOrderForDetails.trackingDetails?.courierName || '');
                  setManualTrackingId(selectedOrderForDetails.trackingDetails?.trackingId || '');
                  setManualTrackingUrl(selectedOrderForDetails.trackingDetails?.trackingUrl || '');
                  setManualStatusNotes('');
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Settings className="h-3.5 w-3.5 text-slate-600" />
                <span>Update Status Manually</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderForDetails(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REVIEW CANCELLATION / RETURN / REFUND REQUEST */}
      {cancellationReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span>Review {cancellationReviewModal.cancellationRequest?.type?.toUpperCase() || 'Cancellation'} Request</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Order Ref: #{cancellationReviewModal.vendorOrderId || cancellationReviewModal._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setCancellationReviewModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{cancellationReviewModal.patientName || 'Customer'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Order Amount:</span>
                <span className="font-bold text-slate-900">₹{cancellationReviewModal.totalAmount}</span>
              </div>
              <div className="pt-1 border-t border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Reason Provided:</span>
                <p className="font-medium text-slate-800 mt-0.5 italic">"{cancellationReviewModal.cancellationRequest?.reason}"</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewAction('approve')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reviewAction === 'approve'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Approve Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('reject')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      reviewAction === 'reject'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Reject Request
                  </button>
                </div>
              </div>

              {reviewAction === 'approve' && (
                <div className="space-y-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="gatewayRefundToggle"
                      checked={processGatewayRefund}
                      onChange={(e) => setProcessGatewayRefund(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="gatewayRefundToggle" className="text-xs text-slate-800 font-medium">
                      Process refund of ₹{cancellationReviewModal.totalAmount} via Payment Gateway (Razorpay)
                    </label>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-emerald-100/60">
                    <input
                      type="checkbox"
                      id="arivuActionToggle"
                      checked={arivuActionRequired}
                      onChange={(e) => setArivuActionRequired(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor="arivuActionToggle" className="text-xs text-slate-800 font-medium">
                      Coordinate fulfillment / dispatch cancellation with Arivu team manually
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Administrative Notes</label>
                <textarea
                  rows={2}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Internal notes or customer notification message..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellationReviewModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewCancellation}
                disabled={processingCancellation}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {processingCancellation ? 'Processing...' : 'Submit Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ORDER STATUS & TRACKING UPDATE */}
      {manualStatusModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-indigo-600" />
                  <span>Manual Order Status Update</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Order Ref: #{manualStatusModal.vendorOrderId || manualStatusModal._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button onClick={() => setManualStatusModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Status</label>
                <select
                  value={manualDeliveryStatus}
                  onChange={(e) => setManualDeliveryStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Logistics Provider (Courier Partner)</label>
                <input
                  type="text"
                  value={manualCourierName}
                  onChange={(e) => setManualCourierName(e.target.value)}
                  placeholder="e.g. DTDC, Blue Dart, Delhivery"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking ID (AWB Number)</label>
                <input
                  type="text"
                  value={manualTrackingId}
                  onChange={(e) => setManualTrackingId(e.target.value)}
                  placeholder="e.g. D123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tracking URL</label>
                <input
                  type="text"
                  value={manualTrackingUrl}
                  onChange={(e) => setManualTrackingUrl(e.target.value)}
                  placeholder="https://track.courier.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status Notes</label>
                <textarea
                  rows={2}
                  value={manualStatusNotes}
                  onChange={(e) => setManualStatusNotes(e.target.value)}
                  placeholder="Add notes for audit trail..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManualStatusModal(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateManualStatus}
                disabled={updatingManualStatus}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {updatingManualStatus ? 'Updating...' : 'Save Status Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECORD BANK PAYOUT */}
      {selectedSettlementForPayout && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayout} className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600" />
                  <span>Record Bank Payout & Proof</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">Settlement Code: {selectedSettlementForPayout.settlementCode}</p>
              </div>
              <button type="button" onClick={() => setSelectedSettlementForPayout(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Payable to Vendor</span>
                  <span className="text-slate-900 font-black text-xs">{selectedVendorData.vendor?.name}</span>
                  <span className="text-slate-500 text-[11px] block font-mono">
                    A/C: {selectedVendorData.vendor?.bankDetails?.accountNumber || '50200084920194'} ({selectedVendorData.vendor?.bankDetails?.ifscCode || 'HDFC0001234'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Net Amount</span>
                  <span className="text-lg font-black text-emerald-700">₹{selectedSettlementForPayout.finalSettlementAmount.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Bank Transaction UTR / Reference ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR198472948274 or CMS-93827104"
                  value={payoutForm.paymentReference}
                  onChange={(e) => setPayoutForm({ ...payoutForm, paymentReference: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 font-bold"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Permanent bank reference for tax & audit ledger</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Payment Method</label>
                  <select
                    value={payoutForm.paymentMode}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  >
                    <option value="NEFT">NEFT Bank Transfer</option>
                    <option value="RTGS">RTGS High-Value</option>
                    <option value="IMPS">IMPS Immediate</option>
                    <option value="UPI">Corporate UPI Transfer</option>
                    <option value="NET_BANKING">Direct Net Banking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Transfer Date</label>
                  <input
                    type="date"
                    required
                    value={payoutForm.paymentDate}
                    onChange={(e) => setPayoutForm({ ...payoutForm, paymentDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Audit & Accounting Notes</label>
                <textarea
                  rows={2}
                  value={payoutForm.bankProofNotes}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankProofNotes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500"
                  placeholder="Optional audit notes..."
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedSettlementForPayout(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={recordingPayout || !payoutForm.paymentReference.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{recordingPayout ? 'Saving Payout...' : 'Mark as Paid & Attach Proof'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: VIEW BANK PROOF */}
      {selectedProofData && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bank Payout Verification</h3>
                  <p className="text-[11px] text-slate-500">{selectedProofData.settlementCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedProofData(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Total Remitted Amount</span>
              <span className="text-2xl font-black text-emerald-800 mt-1 block">
                ₹{selectedProofData.finalSettlementAmount.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Successfully transferred & verified</span>
            </div>

            <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Transaction UTR / Ref:</span>
                <span className="font-mono font-bold text-blue-700">{selectedProofData.paymentReference}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-bold text-slate-900">{selectedProofData.paymentMode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Payout Date:</span>
                <span className="text-slate-900 font-bold">{new Date(selectedProofData.paidAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Beneficiary Bank:</span>
                <span className="text-slate-900 font-bold">{selectedProofData.bankDetails?.bankName || 'HDFC Bank'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Account Number:</span>
                <span className="font-mono text-emerald-700 font-bold">{selectedProofData.bankDetails?.accountNumber || '50200084920194'}</span>
              </div>
            </div>

            {selectedProofData.notes && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                <strong className="text-slate-900 block mb-0.5">Audit Note:</strong>
                {selectedProofData.notes}
              </div>
            )}

            <button
              onClick={() => setSelectedProofData(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL SETTLEMENT STATEMENT & TAX INVOICE VOUCHER */}
      {selectedSettlementForVoucher && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Settlement Statement & Tax Invoice Voucher</h3>
                  <p className="text-[10px] text-slate-500 font-medium">{selectedSettlementForVoucher.settlementCode}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Voucher</span>
                </button>
                <button onClick={() => setSelectedSettlementForVoucher(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* PRINTABLE VOUCHER CONTENT CONTAINER */}
            <div className="p-6 overflow-y-auto space-y-6 bg-white text-slate-900 font-sans text-xs">
              {/* LETTERHEAD */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-950 tracking-tight">MITO_REBOOT</h1>
                  <p className="text-[11px] font-semibold text-slate-600">Health & Wellness Commerce Platform</p>
                  <p className="text-[10px] text-slate-500">Mito Reboot Healthcare Pvt Ltd</p>
                  <p className="text-[10px] text-slate-500">GSTIN: 29AABCM1234F1Z8 | PAN: AABCM1234F</p>
                </div>

                <div className="text-right">
                  <span className="inline-block bg-slate-900 text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded mb-1">
                    Settlement Statement & Tax Credit
                  </span>
                  <p className="text-xs font-bold text-slate-900 font-mono">CODE: {selectedSettlementForVoucher.settlementCode}</p>
                  <p className="text-[10px] text-slate-500">Date: {new Date(selectedSettlementForVoucher.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-500">
                    Cycle: {new Date(selectedSettlementForVoucher.startDate).toLocaleDateString()} to {new Date(selectedSettlementForVoucher.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* VENDOR & BANK DETAILS ROW */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor Partner Details</h4>
                  <p className="font-bold text-slate-900 text-sm">{selectedVendorData.vendor?.name}</p>
                  <p className="text-[11px] text-slate-600">{selectedVendorData.vendor?.email}</p>
                  <p className="text-[10px] text-slate-500">GSTIN: {selectedVendorData.vendor?.gstin || '33AABCT9988K1Z5'}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Beneficiary Payout Account</h4>
                  <p className="font-bold text-slate-900">{selectedVendorData.vendor?.bankDetails?.accountName || 'Arivu Food Tech Solutions Pvt Ltd'}</p>
                  <p className="text-[11px] text-slate-600 font-mono">A/C: {selectedVendorData.vendor?.bankDetails?.accountNumber || '50200084920194'}</p>
                  <p className="text-[10px] text-slate-500">Bank: {selectedVendorData.vendor?.bankDetails?.bankName || 'HDFC Bank'} | IFSC: {selectedVendorData.vendor?.bankDetails?.ifscCode || 'HDFC0001234'}</p>
                </div>
              </div>

              {/* COMMERCIAL SUMMARY LEDGER */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Settlement Financial Ledger</h4>
                <table className="w-full text-left border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">Component Description</th>
                      <th className="p-2.5 text-center">Rate / Basis</th>
                      <th className="p-2.5 text-right">Debit / Deduction</th>
                      <th className="p-2.5 text-right">Credit / Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    <tr>
                      <td className="p-2.5 font-semibold">Gross Product Delivered Sales (GMV)</td>
                      <td className="p-2.5 text-center text-slate-500">{selectedSettlementForVoucher.totalOrdersCount} Delivered Orders</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                      <td className="p-2.5 text-right font-bold text-slate-900">₹{selectedSettlementForVoucher.grossSales.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-purple-900">Mito_Reboot Platform Commission</td>
                      <td className="p-2.5 text-center text-purple-900">30.0% Commercial</td>
                      <td className="p-2.5 text-right font-semibold text-purple-700">- ₹{selectedSettlementForVoucher.totalPlatformCommission.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-purple-900">GST on Platform Commission (Tax Invoice SAC 9983)</td>
                      <td className="p-2.5 text-center text-purple-900">18.0% GST</td>
                      <td className="p-2.5 text-right font-semibold text-purple-700">- ₹{selectedSettlementForVoucher.gstOnCommission.toLocaleString()}</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-emerald-900">Shipping Pass-Through Allowance</td>
                      <td className="p-2.5 text-center text-emerald-900">100% Pass-Through</td>
                      <td className="p-2.5 text-right text-slate-400">-</td>
                      <td className="p-2.5 text-right font-semibold text-emerald-700">+ ₹{selectedSettlementForVoucher.shippingPassThrough.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td className="p-3 text-slate-900 text-sm">Net Vendor Remittance Payable</td>
                      <td className="p-3 text-center text-slate-600">Net Payable</td>
                      <td className="p-3 text-right text-slate-600 font-semibold">- ₹{selectedSettlementForVoucher.totalPlatformRetention.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-700 text-base font-black">₹{selectedSettlementForVoucher.finalSettlementAmount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PAYMENT & PROOF STATUS */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Payment Status & Bank Reference</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedSettlementForVoucher.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {selectedSettlementForVoucher.status === 'PAID' ? 'PAID & SETTLED' : 'DUE FOR REMITTANCE'}
                    </span>
                    {selectedSettlementForVoucher.paymentReference && (
                      <span className="font-mono text-xs font-bold text-slate-900">
                        UTR: {selectedSettlementForVoucher.paymentReference}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Authorized Signatory</span>
                  <span className="text-xs font-bold text-slate-900 mt-1 block">Mito Reboot Finance Dept</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedSettlementForVoucher(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW VENDOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateNewVendor} className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-emerald-600" />
                <span>Onboard New Partner Vendor</span>
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Vendor Name *</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                      setNewVendorForm({ ...newVendorForm, name, slug });
                    }}
                    placeholder="e.g. Arivu Foods"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">System Slug</label>
                  <input
                    type="text"
                    required
                    value={newVendorForm.slug}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, slug: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Login Email *</label>
                  <input
                    type="email"
                    required
                    value={newVendorForm.email}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={newVendorForm.password}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Checkout Type</label>
                  <select
                    value={newVendorForm.checkoutType}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, checkoutType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  >
                    <option value="INTERNAL">Internal Checkout</option>
                    <option value="EXTERNAL_AMAZON">Buy on Amazon (External)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Catalog Sync</label>
                  <select
                    value={newVendorForm.productSyncMethod}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, productSyncMethod: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  >
                    <option value="API">API Sync</option>
                    <option value="MANUAL">Manual Listing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={newVendorForm.commissionRate}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, commissionRate: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Settlement Cycle (Days)</label>
                  <select
                    value={newVendorForm.settlementCycleDays}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, settlementCycleDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-500 font-medium"
                  >
                    <option value={30}>30 Days (Standard)</option>
                    <option value={15}>15 Days</option>
                    <option value={7}>7 Days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {saving ? 'Creating...' : 'Register Vendor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Vendor Coupon Modal */}
      {showAddCouponModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateVendorCoupon}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Add Vendor Coupon</h3>
                  <p className="text-xs text-slate-500 font-medium">Coupon will only apply to {selectedVendorData?.name || 'this vendor'}'s products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCouponModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ARIVU20"
                  value={newCouponForm.code}
                  onChange={(e) => setNewCouponForm({ ...newCouponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-black tracking-wider text-slate-900 uppercase focus:outline-none focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                  <select
                    value={newCouponForm.discountType}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newCouponForm.discountValue}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, discountValue: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={newCouponForm.maxRedemptions}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, maxRedemptions: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newCouponForm.expiryDate}
                    onChange={(e) => setNewCouponForm({ ...newCouponForm, expiryDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:bg-white focus:border-purple-500 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCouponModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loadingCoupons || !newCouponForm.code}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                {loadingCoupons ? 'Creating...' : 'Create Coupon'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
