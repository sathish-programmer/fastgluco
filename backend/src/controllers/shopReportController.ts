import { Request, Response } from 'express';
import ShopOrder from '../models/ShopOrder';
import ShopProduct from '../models/ShopProduct';
import { Vendor } from '../models/Vendor';

export class ShopReportController {
  public static async getReportsSummary(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const matchQuery: any = { status: 'completed' };
      if (startDate || endDate) {
        matchQuery.createdAt = {};
        if (startDate) matchQuery.createdAt.$gte = new Date(startDate as string);
        if (endDate) matchQuery.createdAt.$lte = new Date(endDate as string);
      }

      const orders = await ShopOrder.find(matchQuery).populate('vendorId', 'name businessName');

      // 1. Sales summary
      const totalOrdersCount = orders.length;
      const totalRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
      const totalGST = orders.reduce((acc, o) => acc + (o.gstAmount || o.taxAmount || 0), 0);
      const totalDiscounts = orders.reduce((acc, o) => acc + (o.discountAmount || 0), 0);

      // 2. Orders by delivery status
      const allOrders = await ShopOrder.find();
      const statusCounts = {
        pending: allOrders.filter(o => o.deliveryStatus === 'pending' || !o.deliveryStatus).length,
        assigned: allOrders.filter(o => o.deliveryStatus === 'assigned').length,
        accepted: allOrders.filter(o => o.deliveryStatus === 'accepted').length,
        packed: allOrders.filter(o => o.deliveryStatus === 'packed').length,
        shipped: allOrders.filter(o => o.deliveryStatus === 'shipped').length,
        delivered: allOrders.filter(o => o.deliveryStatus === 'delivered').length,
        cancelled: allOrders.filter(o => o.deliveryStatus === 'cancelled').length
      };

      // 3. Product Sales & Top Selling Products
      const productSalesMap: Record<string, { name: string, qty: number, revenue: number, category: string }> = {};
      
      orders.forEach(order => {
        order.products.forEach(p => {
          const key = p.productId ? p.productId.toString() : p.name;
          if (!productSalesMap[key]) {
            productSalesMap[key] = {
              name: p.name,
              qty: 0,
              revenue: 0,
              category: 'General'
            };
          }
          productSalesMap[key].qty += p.qty;
          productSalesMap[key].revenue += p.price * p.qty;
        });
      });

      // Populate product categories
      const allProducts = await ShopProduct.find();
      const productCategoryMap = new Map<string, string>();
      allProducts.forEach(prod => {
        productCategoryMap.set(prod._id.toString(), prod.category || 'General');
      });

      Object.keys(productSalesMap).forEach(key => {
        if (productCategoryMap.has(key)) {
          productSalesMap[key].category = productCategoryMap.get(key) || 'General';
        }
      });

      const productSalesList = Object.values(productSalesMap).sort((a, b) => b.qty - a.qty);
      const topSellingProducts = productSalesList.slice(0, 5);

      // 4. Most Ordered Categories
      const categorySalesMap: Record<string, number> = {};
      Object.values(productSalesMap).forEach(ps => {
        categorySalesMap[ps.category] = (categorySalesMap[ps.category] || 0) + ps.qty;
      });
      const topCategories = Object.entries(categorySalesMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);

      // 5. Vendor Report
      const vendorSalesMap: Record<string, { name: string, businessName: string, assigned: number, completed: number, cancelled: number, revenue: number }> = {};
      const vendors = await Vendor.find();
      vendors.forEach(v => {
        vendorSalesMap[v._id.toString()] = {
          name: v.name,
          businessName: v.businessName || '',
          assigned: 0,
          completed: 0,
          cancelled: 0,
          revenue: 0
        };
      });

      allOrders.forEach(o => {
        if (o.vendorId) {
          const vId = o.vendorId.toString();
          if (vendorSalesMap[vId]) {
            vendorSalesMap[vId].assigned++;
            if (o.deliveryStatus === 'delivered') {
              vendorSalesMap[vId].completed++;
              vendorSalesMap[vId].revenue += o.totalAmount;
            } else if (o.deliveryStatus === 'cancelled') {
              vendorSalesMap[vId].cancelled++;
            }
          }
        }
      });

      const vendorReports = Object.values(vendorSalesMap).sort((a, b) => b.revenue - a.revenue);

      // 6. Monthly Revenue (Current Year)
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = Array(12).fill(0).map((_, i) => ({ month: new Date(2026, i, 1).toLocaleString('default', { month: 'short' }), revenue: 0 }));
      
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

      const yearlyOrders = await ShopOrder.find({
        status: 'completed',
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      });

      yearlyOrders.forEach(o => {
        const monthIndex = new Date(o.createdAt).getMonth();
        monthlyRevenue[monthIndex].revenue += o.totalAmount;
      });

      res.json({
        summary: {
          totalOrdersCount,
          totalRevenue,
          totalGST,
          totalDiscounts
        },
        statusCounts,
        topSellingProducts,
        topCategories,
        vendorReports,
        monthlyRevenue
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || 'Error generating reports' });
    }
  }
}
