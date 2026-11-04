import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { RevenueAnalyticsService } from '../services/revenueAnalyticsService';
import { PaymentGatewayConfig } from '../models/PaymentGatewayConfig';

export class RevenueAnalyticsController {
  /**
   * 1. GET /api/admin/revenue-analytics/overview
   */
  public static async getOverview(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const metrics = await RevenueAnalyticsService.getOverviewMetrics(dateRange);
      return res.status(200).json({
        success: true,
        dateRange: {
          preset: range,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        ...metrics
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getOverview:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching revenue overview metrics.' });
    }
  }

  /**
   * 2. GET /api/admin/revenue-analytics/transactions
   */
  public static async getTransactions(req: AuthRequest, res: Response) {
    try {
      const {
        page = '1',
        limit = '20',
        q = '',
        department = 'all',
        status = 'all',
        paymentMethod = 'all',
        startDate,
        endDate,
        minAmount,
        maxAmount
      } = req.query;

      const result = await RevenueAnalyticsService.getAllTransactions({
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        q: q as string,
        department: department as string,
        status: status as string,
        paymentMethod: paymentMethod as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined
      });

      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getTransactions:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error listing transactions.' });
    }
  }

  /**
   * 3. GET /api/admin/revenue-analytics/subscriptions
   */
  public static async getSubscriptions(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getSubscriptionsAnalytics(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getSubscriptions:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching subscriptions analytics.' });
    }
  }

  /**
   * 4. GET /api/admin/revenue-analytics/user-payments
   */
  public static async getUserPayments(req: AuthRequest, res: Response) {
    try {
      const { page = '1', limit = '20', q = '' } = req.query;
      const data = await RevenueAnalyticsService.getUserPaymentsList(
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
        q as string
      );

      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getUserPayments:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error listing user payments.' });
    }
  }

  /**
   * 4.1 GET /api/admin/revenue-analytics/user-payments/:userId
   */
  public static async getUserPaymentDetails(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.params;
      const data = await RevenueAnalyticsService.getUserFinancialProfile(userId);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getUserPaymentDetails:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching user financial profile.' });
    }
  }

  /**
   * 5. GET /api/admin/revenue-analytics/ask-mito
   */
  public static async getAskMito(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getAskMitoAnalytics(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getAskMito:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching Ask Mito revenue analytics.' });
    }
  }

  /**
   * 6. GET /api/admin/revenue-analytics/shop-sales
   */
  public static async getShopSales(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getShopSalesAnalytics(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getShopSales:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching shop sales analytics.' });
    }
  }

  /**
   * 7. GET /api/admin/revenue-analytics/departments
   */
  public static async getDepartments(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getDepartmentAnalytics(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getDepartments:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching department analytics.' });
    }
  }

  /**
   * 8. GET /api/admin/revenue-analytics/payment-methods
   */
  public static async getPaymentMethods(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getPaymentMethodsAnalytics(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getPaymentMethods:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching payment methods analytics.' });
    }
  }

  /**
   * 9. GET /api/admin/revenue-analytics/refunds
   */
  public static async getRefunds(req: AuthRequest, res: Response) {
    try {
      const { range = 'this_month', customStart, customEnd } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(
        range as string,
        customStart as string,
        customEnd as string
      );

      const data = await RevenueAnalyticsService.getRefundsAndFailed(dateRange);
      return res.status(200).json({
        success: true,
        ...data
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error in getRefunds:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching refunds & failed payments.' });
    }
  }

  /**
   * 10. GET /api/admin/revenue-analytics/reports/export
   */
  public static async exportReport(req: AuthRequest, res: Response) {
    try {
      const { format = 'csv', reportType = 'revenue_overview', range = 'this_month' } = req.query;
      const dateRange = RevenueAnalyticsService.parseDateRange(range as string);

      if (format === 'pdf') {
        const buffer = await RevenueAnalyticsService.generatePdfReport(reportType as string, dateRange);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.pdf"`);
        return res.send(buffer);
      }

      // Default CSV export
      const txData = await RevenueAnalyticsService.getAllTransactions({
        limit: 500,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

      const header = 'Transaction ID,Department,Item,Customer Name,Email,Phone,Gross Amount,Discount,Tax,Net Amount,Status,Date\n';
      const rows = txData.transactions.map((t: any) =>
        `"${t.transactionId}","${t.department}","${(t.itemTitle || '').replace(/"/g, '""')}","${t.userName}","${t.userEmail}","${t.userPhone}",${t.grossAmount},${t.discountAmount},${t.taxAmount},${t.netAmount},"${t.status}","${new Date(t.createdAt).toISOString()}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}-${Date.now()}.csv"`);
      return res.send(header + rows);
    } catch (error: any) {
      console.error('[Revenue Analytics] Error exporting report:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error generating report export.' });
    }
  }

  /**
   * 11. POST /api/admin/revenue-analytics/sync-razorpay
   */
  public static async syncRazorpay(req: AuthRequest, res: Response) {
    try {
      const result = await RevenueAnalyticsService.syncRazorpaySettlements();
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Revenue Analytics] Error syncing Razorpay:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error synchronizing with Razorpay.' });
    }
  }

  /**
   * 11.1 GET /api/admin/revenue-analytics/settings
   */
  public static async getSettings(req: AuthRequest, res: Response) {
    try {
      const config = await PaymentGatewayConfig.findOne().lean();
      return res.status(200).json({
        success: true,
        isSandbox: config?.isSandbox ?? true,
        enablePayments: config?.enablePayments ?? false,
        enableSubscriptions: config?.enableSubscriptions ?? false,
        hasRazorpayKey: !!(config?.razorpayKeyId),
        hasRazorpaySecret: !!(config?.razorpayKeySecret),
        razorpayKeyIdMasked: config?.razorpayKeyId ? `${config.razorpayKeyId.slice(0, 8)}...` : 'Not Set',
        askMitoQuestionFee: config?.askMitoQuestionFee || 100,
        gstPercentage: config?.gstPercentage || 18,
        webhookUrl: `${process.env.API_BASE_URL || 'https://api.mitoreboot.in'}/api/payments/razorpay/webhook`
      });
    } catch (error: any) {
      console.error('[Revenue Analytics] Error fetching settings:', error);
      return res.status(500).json({ success: false, message: error.message || 'Error fetching payment settings.' });
    }
  }

  /**
   * Public Webhook Listener: POST /api/payments/razorpay/webhook
   */
  public static async handleRazorpayWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!signature) {
        return res.status(400).json({ message: 'Missing x-razorpay-signature header.' });
      }

      const result = await RevenueAnalyticsService.processRazorpayWebhook(signature, rawBody, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('[Razorpay Webhook Error]:', error);
      return res.status(500).json({ message: error.message || 'Error processing webhook.' });
    }
  }
}
