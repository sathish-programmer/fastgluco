import { IVendor } from '../../models/Vendor';
import { IVendorAdapter } from './IVendorAdapter';
import { ArivuFoodsAdapter } from './ArivuFoodsAdapter';
import { DefaultVendorAdapter } from './DefaultVendorAdapter';

export class VendorAdapterFactory {
  private static arivuAdapter = new ArivuFoodsAdapter();
  private static defaultAdapters: Map<string, DefaultVendorAdapter> = new Map();

  /**
   * Resolves the appropriate vendor adapter based on vendor slug or configuration
   */
  public static getAdapter(vendor: IVendor): IVendorAdapter {
    const slug = (vendor.slug || vendor.name || '').toLowerCase().trim();

    if (slug.includes('arivu') || slug === 'arivu-foods') {
      return this.arivuAdapter;
    }

    if (!this.defaultAdapters.has(slug)) {
      this.defaultAdapters.set(slug, new DefaultVendorAdapter(slug));
    }

    return this.defaultAdapters.get(slug)!;
  }
}
