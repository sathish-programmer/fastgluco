import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { IShopOrder } from '../models/ShopOrder';

export class InvoiceService {
  /**
   * Generates a PDF invoice for a shop order and returns the relative path to it
   */
  public static async generateInvoicePDF(order: IShopOrder): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const invoicesDir = path.join(__dirname, '../../uploads/invoices');
        if (!fs.existsSync(invoicesDir)) {
          fs.mkdirSync(invoicesDir, { recursive: true });
        }

        const fileName = `Invoice-${order._id}.pdf`;
        const filePath = path.join(invoicesDir, fileName);

        const doc = new PDFDocument({ margin: 50 });
        const writeStream = fs.createWriteStream(filePath);
        doc.pipe(writeStream);

        // Header Branding
        doc.fillColor('#2563EB').fontSize(24).font('Helvetica-Bold').text('Mito_Reboot Store', 50, 50);
        doc.fillColor('#64748B').fontSize(10).font('Helvetica-Bold').text('PREMIUM HEALTH & WELLNESS SOLUTIONS', 50, 78);

        doc.fillColor('#1E293B').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
        doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Invoice/Order ID: ${order._id}`, 400, 75, { align: 'right' });
        doc.text(`Date: ${new Date(order.deliveryDate || order.updatedAt).toLocaleDateString()}`, 400, 90, { align: 'right' });

        // Divider
        doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#E2E8F0').lineWidth(1).stroke();

        // Customer Details
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('Billed & Shipped To:', 50, 130);
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        doc.text(`Name: ${order.patientName || (order.userId as any)?.name || 'Patient'}`, 50, 148);
        doc.text(`Email: ${order.patientEmail || (order.userId as any)?.email || ''}`, 50, 160);
        doc.text(`Phone: ${order.patientPhone || (order.userId as any)?.mobileNumber || ''}`, 50, 172);
        
        if (order.shippingAddress) {
          doc.text(`Address: ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.postalCode}`, 50, 184);
        }

        // Vendor Details
        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('Fulfilled By:', 320, 130);
        doc.fillColor('#334155').fontSize(9).font('Helvetica');
        if (order.vendorId) {
          const vendor = order.vendorId as any;
          doc.text(vendor.businessName || vendor.name || 'Assigned Partner', 320, 148);
          doc.text(vendor.email || '', 320, 160);
          if (vendor.licenseNumber) doc.text(`License No: ${vendor.licenseNumber}`, 320, 172);
          if (vendor.taxId) doc.text(`GSTIN/Tax ID: ${vendor.taxId}`, 320, 184);
        } else {
          doc.text('Mito_Reboot Health Store', 320, 148);
          doc.text('shop@mitoreboot.com', 320, 160);
        }

        // Table Header
        const tableTop = 220;
        doc.rect(50, tableTop, 500, 20).fill('#F8FAFC');
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold').text('Item Description', 60, tableTop + 5);
        doc.text('Qty', 320, tableTop + 5, { align: 'center' });
        doc.text('Unit Price', 380, tableTop + 5, { align: 'right' });
        doc.text('Total', 480, tableTop + 5, { align: 'right' });

        let currentTop = tableTop + 20;

        // Render products
        order.products.forEach((p) => {
          doc.fillColor('#1E293B').fontSize(9).font('Helvetica').text(`${p.name}${p.variantName ? ` (${p.variantName})` : ''}`, 60, currentTop + 6);
          doc.text(String(p.qty), 320, currentTop + 6, { align: 'center' });
          doc.text(`${order.currency === 'USD' ? '$' : 'Rs.'}${p.price.toFixed(2)}`, 380, currentTop + 6, { align: 'right' });
          doc.text(`${order.currency === 'USD' ? '$' : 'Rs.'}${(p.price * p.qty).toFixed(2)}`, 480, currentTop + 6, { align: 'right' });

          currentTop += 20;
          doc.moveTo(50, currentTop).lineTo(550, currentTop).strokeColor('#F1F5F9').lineWidth(1).stroke();
        });

        // Totals Breakdown
        const calcTop = currentTop + 15;
        doc.fillColor('#64748B').fontSize(9).text('Subtotal:', 320, calcTop);
        doc.fillColor('#1E293B').text(`${order.currency === 'USD' ? '$' : 'Rs.'}${(order.totalAmount - (order.shippingCharge || 0) - (order.gstAmount || order.taxAmount || 0) + (order.discountAmount || 0)).toFixed(2)}`, 480, calcTop, { align: 'right' });

        doc.text('Discount:', 320, calcTop + 15);
        doc.fillColor('#EF4444').text(`-${order.currency === 'USD' ? '$' : 'Rs.'}${(order.discountAmount || 0).toFixed(2)}`, 480, calcTop + 15, { align: 'right' });

        doc.fillColor('#64748B').text(`GST/Tax:`, 320, calcTop + 30);
        doc.fillColor('#1E293B').text(`${order.currency === 'USD' ? '$' : 'Rs.'}${(order.gstAmount || order.taxAmount || 0).toFixed(2)}`, 480, calcTop + 30, { align: 'right' });

        doc.text('Shipping Charge:', 320, calcTop + 45);
        doc.text(`${order.currency === 'USD' ? '$' : 'Rs.'}${(order.shippingCharge || 0).toFixed(2)}`, 480, calcTop + 45, { align: 'right' });

        doc.moveTo(320, calcTop + 62).lineTo(500, calcTop + 62).strokeColor('#E2E8F0').stroke();

        doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('Total Paid:', 320, calcTop + 70);
        doc.fillColor('#2563EB').fontSize(13).text(`${order.currency === 'USD' ? '$' : 'Rs.'}${order.totalAmount.toFixed(2)}`, 480, calcTop + 69, { align: 'right' });

        // Footer Notice
        doc.fillColor('#94A3B8').fontSize(8).font('Helvetica-Oblique').text('This is a computer generated document and does not require a physical signature.', 50, 720, { align: 'center' });

        doc.end();

        writeStream.on('finish', () => {
          resolve(`/uploads/invoices/${fileName}`);
        });

        writeStream.on('error', (err) => {
          reject(err);
        });

      } catch (err) {
        reject(err);
      }
    });
  }
}
