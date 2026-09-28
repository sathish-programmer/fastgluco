import ShopOrder from '../models/ShopOrder';
import { Vendor } from '../models/Vendor';
import '../models/ShopProduct';
import { VendorAdapterFactory } from '../services/vendorAdapters/VendorAdapterFactory';
import { EmailService } from '../services/emailService';
import { FCMService } from '../services/fcmService';

export class VendorOrderStatusCron {
  private static isRunning = false;

  /**
   * Helper to determine if a vendor is due for status polling
   */
  private static isVendorDueForPoll(vendor: any): boolean {
    const config = vendor.pollingConfig;
    if (!config) return true;

    const frequency = config.frequency || 'TWICE_DAILY';
    const lastPolled = config.lastPolledAt ? new Date(config.lastPolledAt).getTime() : 0;
    const now = Date.now();
    const elapsedMinutes = (now - lastPolled) / (1000 * 60);

    if (frequency === 'TWICE_DAILY' || frequency === 'DAILY_TWICE') {
      // 9 AM and 10 PM IST check
      // Current IST hour:
      const istDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const istHour = istDate.getHours();
      // If hour is 9 or 22 and haven't polled in the last 60 minutes
      if ((istHour === 9 || istHour === 22) && elapsedMinutes > 60) {
        return true;
      }
      // Or if not polled in 12 hours
      return elapsedMinutes > 12 * 60;
    }

    if (frequency === 'HOURLY') return elapsedMinutes >= 55;
    if (frequency === 'EVERY_15_MIN') return elapsedMinutes >= 14;
    if (frequency === 'EVERY_4_HOURS') return elapsedMinutes >= 235;
    if (frequency === 'EVERY_6_HOURS') return elapsedMinutes >= 355;
    if (frequency === 'EVERY_12_HOURS') return elapsedMinutes >= 715;

    return elapsedMinutes >= 60;
  }

  /**
   * Periodic check called by cron (e.g. every 15 minutes)
   * Only polls vendors that are due according to their configured polling frequency.
   */
  public static async checkAndRunPeriodicPoll() {
    return this.syncActiveVendorOrders(undefined, false);
  }

  /**
   * Scans active vendor-managed orders and syncs their status from the vendor API.
   * @param targetVendorId Optional specific vendor ID (e.g. when triggered from admin)
   * @param force If true, bypasses schedule/interval checks
   */
  public static async syncActiveVendorOrders(targetVendorId?: string, force = false): Promise<{ polledCount: number; updatedCount: number }> {
    if (this.isRunning) {
      console.log('[VendorOrderStatusCron] Previous sync still in progress. Skipping.');
      return { polledCount: 0, updatedCount: 0 };
    }

    this.isRunning = true;
    let polledCount = 0;
    let updatedCount = 0;

    try {
      const orderQuery: any = {
        vendorId: { $exists: true, $ne: null },
        vendorOrderId: { $exists: true, $ne: '' },
        deliveryStatus: { $nin: ['delivered', 'cancelled'] },
        status: { $ne: 'cancelled' }
      };

      if (targetVendorId) {
        orderQuery.vendorId = targetVendorId;
      }

      const activeOrders = await ShopOrder.find(orderQuery).populate('vendorId');
      if (activeOrders.length === 0) {
        return { polledCount: 0, updatedCount: 0 };
      }

      // Group orders by vendor
      const vendorOrderMap = new Map<string, { vendor: any; orders: any[] }>();
      for (const order of activeOrders) {
        const v = order.vendorId as any;
        if (!v || !order.vendorOrderId) continue;
        const vId = v._id.toString();
        if (!vendorOrderMap.has(vId)) {
          vendorOrderMap.set(vId, { vendor: v, orders: [] });
        }
        vendorOrderMap.get(vId)!.orders.push(order);
      }

      for (const [vendorId, { vendor, orders }] of vendorOrderMap.entries()) {
        if (!force && !this.isVendorDueForPoll(vendor)) {
          continue;
        }

        polledCount += orders.length;
        console.log(`[VendorOrderStatusCron] Polling ${orders.length} active order(s) for vendor ${vendor.name}...`);

        try {
          const adapter = VendorAdapterFactory.getAdapter(vendor);
          let statusResults: any[] = [];

          // Use batch status API if supported (Arivu Foods supports POST /api/mitoreboot/orders/status)
          if (typeof adapter.getMultipleOrdersStatus === 'function') {
            const orderIds = orders.map((o) => o.vendorOrderId);
            statusResults = await adapter.getMultipleOrdersStatus(vendor, orderIds);
          } else {
            for (const order of orders) {
              const res = await adapter.getOrderStatus(vendor, order.vendorOrderId);
              statusResults.push(res);
            }
          }

          // Map results to orders
          const resultMap = new Map<string, any>();
          for (const sr of statusResults) {
            if (sr && sr.vendorOrderId) {
              resultMap.set(sr.vendorOrderId, sr);
            }
          }

          for (const order of orders) {
            const statusResult = resultMap.get(order.vendorOrderId);
            if (!statusResult || !statusResult.success) continue;

            const previousDeliveryStatus = order.deliveryStatus;
            const previousVendorStatus = order.vendorOrderStatus;
            const newDeliveryStatus = statusResult.deliveryStatus;
            const newVendorStatus = statusResult.status;

            let hasChanges = false;

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

            // Confirmed Arivu shipment fields: trackerId, trackerURL, logisticsProvider
            if (statusResult.trackingNumber && statusResult.trackingNumber !== order.trackingDetails?.trackingId) {
              order.trackingDetails = {
                courierName: statusResult.courierName || order.trackingDetails?.courierName || 'Blue Dart Express',
                trackingId: statusResult.trackingNumber,
                trackingUrl: statusResult.trackingUrl || order.trackingDetails?.trackingUrl || ''
              };
              hasChanges = true;
            }

            if (newDeliveryStatus === 'delivered' && !order.deliveryDate) {
              order.deliveryDate = statusResult.actualDeliveryDate || new Date();
              hasChanges = true;
            }

            if (hasChanges) {
              updatedCount++;
              order.orderTimeline = order.orderTimeline || [];
              order.orderTimeline.push({
                status: newDeliveryStatus || 'processing',
                timestamp: new Date(),
                comment: `Vendor updated status to ${newVendorStatus}${
                  order.trackingDetails?.trackingId ? ` (Logistics Provider: ${order.trackingDetails.courierName}, Tracking ID: ${order.trackingDetails.trackingId})` : ''
                }`
              });

              await order.save();
              const logDisplayId = order.vendorOrderId || order._id.toString().slice(-6);
              console.log(`[VendorOrderStatusCron] Order #${logDisplayId} updated: ${previousDeliveryStatus} -> ${newDeliveryStatus}`);

              // Customer notifications on milestone transitions
              if (newDeliveryStatus === 'shipped' && previousDeliveryStatus !== 'shipped') {
                EmailService.sendOrderEmail('shipped', order._id.toString()).catch(console.error);

                FCMService.sendNotificationToUser(order.userId.toString(), {
                  title: '📦 Your Order Has Been Shipped!',
                  body: `Your order #${order.vendorOrderId || order._id.toString().slice(-6).toUpperCase()} has been dispatched via ${order.trackingDetails?.courierName || 'Logistics Partner'}.${
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
                EmailService.sendOrderEmail('delivered', order._id.toString()).catch(console.error);

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
          }

          // Update vendor polling status in DB
          if (vendor) {
            vendor.pollingConfig = vendor.pollingConfig || {};
            vendor.pollingConfig.lastPolledAt = new Date();
            vendor.pollingConfig.lastPollStatus = 'SUCCESS';
            vendor.pollingConfig.lastPollMessage = `Polled ${orders.length} order(s), updated ${updatedCount} at ${new Date().toLocaleTimeString()}`;
            await Vendor.findByIdAndUpdate(vendor._id, { pollingConfig: vendor.pollingConfig });
          }
        } catch (vErr: any) {
          console.error(`[VendorOrderStatusCron] Error polling vendor ${vendor.name}:`, vErr.message);
          if (vendor) {
            vendor.pollingConfig = vendor.pollingConfig || {};
            vendor.pollingConfig.lastPolledAt = new Date();
            vendor.pollingConfig.lastPollStatus = 'FAILED';
            vendor.pollingConfig.lastPollMessage = vErr.message;
            await Vendor.findByIdAndUpdate(vendor._id, { pollingConfig: vendor.pollingConfig });
          }
        }
      }

      return { polledCount, updatedCount };
    } catch (err: any) {
      console.error('[VendorOrderStatusCron] Error during vendor orders background sync:', err.message);
      return { polledCount, updatedCount };
    } finally {
      this.isRunning = false;
    }
  }
}
