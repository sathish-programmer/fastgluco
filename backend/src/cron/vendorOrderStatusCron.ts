import ShopOrder from '../models/ShopOrder';
import '../models/Vendor';
import '../models/ShopProduct';
import { VendorAdapterFactory } from '../services/vendorAdapters/VendorAdapterFactory';
import { EmailService } from '../services/emailService';
import { FCMService } from '../services/fcmService';

export class VendorOrderStatusCron {
  private static isRunning = false;

  /**
   * Periodically scans all active vendor-managed orders and syncs their status
   * directly from the vendor's API (e.g., Arivu Foods).
   * Runs in background every 15 minutes.
   */
  public static async syncActiveVendorOrders() {
    if (this.isRunning) {
      console.log('[VendorOrderStatusCron] Previous sync still in progress. Skipping.');
      return;
    }

    this.isRunning = true;
    try {
      // Find orders that are assigned to a vendor, have an external vendor order ID,
      // and have not reached a terminal state (delivered or cancelled)
      const activeOrders = await ShopOrder.find({
        vendorId: { $exists: true, $ne: null },
        vendorOrderId: { $exists: true, $ne: '' },
        deliveryStatus: { $nin: ['delivered', 'cancelled'] },
        status: { $ne: 'cancelled' }
      }).populate('vendorId');

      if (activeOrders.length === 0) {
        return;
      }

      console.log(`[VendorOrderStatusCron] Checking status for ${activeOrders.length} active vendor order(s)...`);

      for (const order of activeOrders) {
        try {
          const vendor = order.vendorId as any;
          if (!vendor || !order.vendorOrderId) continue;

          const adapter = VendorAdapterFactory.getAdapter(vendor);
          const statusResult = await adapter.getOrderStatus(vendor, order.vendorOrderId);

          if (!statusResult || !statusResult.success) {
            continue;
          }

          const previousDeliveryStatus = order.deliveryStatus;
          const previousVendorStatus = order.vendorOrderStatus;
          const newDeliveryStatus = statusResult.deliveryStatus;
          const newVendorStatus = statusResult.status;

          let hasChanges = false;

          // Check if vendor updated their status
          if (newVendorStatus && newVendorStatus !== previousVendorStatus) {
            order.vendorOrderStatus = newVendorStatus;
            hasChanges = true;
          }

          if (newDeliveryStatus && newDeliveryStatus !== previousDeliveryStatus) {
            order.deliveryStatus = newDeliveryStatus;
            hasChanges = true;
          }

          if (statusResult.statusMessage && statusResult.statusMessage !== order.vendorStatusMessage) {
            order.vendorStatusMessage = statusResult.statusMessage;
            hasChanges = true;
          }

          if (statusResult.estimatedDeliveryDate && !order.estimatedDeliveryDate) {
            order.estimatedDeliveryDate = statusResult.estimatedDeliveryDate;
            hasChanges = true;
          }

          // Check if courier tracking details were assigned/updated
          if (statusResult.trackingNumber && statusResult.trackingNumber !== order.trackingDetails?.trackingId) {
            order.trackingDetails = {
              courierName: statusResult.courierName || order.trackingDetails?.courierName || 'Blue Dart Express',
              trackingId: statusResult.trackingNumber,
              trackingUrl: statusResult.trackingUrl || order.trackingDetails?.trackingUrl || ''
            };
            hasChanges = true;
          }

          // Terminal status: Delivered
          if (newDeliveryStatus === 'delivered' && !order.deliveryDate) {
            order.deliveryDate = statusResult.actualDeliveryDate || new Date();
            hasChanges = true;
          }

          if (hasChanges) {
            order.orderTimeline = order.orderTimeline || [];
            order.orderTimeline.push({
              status: newDeliveryStatus || 'processing',
              timestamp: new Date(),
              comment: `Vendor updated status to ${newVendorStatus}${
                order.trackingDetails?.trackingId ? ` (Courier: ${order.trackingDetails.courierName}, Tracking: ${order.trackingDetails.trackingId})` : ''
              }`
            });

            await order.save();
            const logDisplayId = order.vendorOrderId || order._id.toString().slice(-6);
            console.log(`[VendorOrderStatusCron] Order #${logDisplayId} updated: ${previousDeliveryStatus} -> ${newDeliveryStatus}`);

            // Dispatch customer notifications on milestone changes
            if (newDeliveryStatus === 'shipped' && previousDeliveryStatus !== 'shipped') {
              // 1. Email notification
              EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);

              // 2. FCM Push notification
              FCMService.sendNotificationToUser(order.userId.toString(), {
                title: '📦 Your Order Has Been Shipped!',
                body: `Your order #${order.vendorOrderId || order._id.toString().slice(-6).toUpperCase()} has been dispatched${order.trackingDetails?.courierName ? ` via ${order.trackingDetails.courierName}` : ''}.${
                  order.trackingDetails?.trackingId ? ` Tracking ID: ${order.trackingDetails.trackingId}` : ''
                }`,
                type: 'OrderShipped',
                data: {
                  route: 'Shop Orders',
                  orderId: order._id.toString(),
                  vendorOrderId: order.vendorOrderId || ''
                }
              }).catch(console.error);
            } else if (newDeliveryStatus === 'delivered' && previousDeliveryStatus !== 'delivered') {
              // 1. Email notification
              EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);

              // 2. FCM Push notification
              FCMService.sendNotificationToUser(order.userId.toString(), {
                title: '🎉 Order Delivered!',
                body: `Your order #${order.vendorOrderId || order._id.toString().slice(-6).toUpperCase()} has been delivered successfully. Enjoy your healthy meals!`,
                type: 'OrderDelivered',
                data: {
                  route: 'Shop Orders',
                  orderId: order._id.toString(),
                  vendorOrderId: order.vendorOrderId || ''
                }
              }).catch(console.error);
            }
          }
        } catch (itemErr: any) {
          console.error(`[VendorOrderStatusCron] Error syncing order ${order._id}:`, itemErr.message);
        }
      }
    } catch (err: any) {
      console.error('[VendorOrderStatusCron] Error during vendor orders background sync:', err.message);
    } finally {
      this.isRunning = false;
    }
  }
}
