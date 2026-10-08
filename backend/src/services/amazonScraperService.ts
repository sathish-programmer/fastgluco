import https from 'https';
import http from 'http';
import zlib from 'zlib';

export interface AmazonProductMetadata {
  asin: string;
  title: string;
  image: string;
  brand: string;
  affiliateUrl: string;
}

export function extractAsin(input: string): string | null {
  if (!input) return null;
  const str = input.trim();
  if (/^[A-Z0-9]{10}$/i.test(str)) {
    return str.toUpperCase();
  }
  const m = str.match(/\/(?:dp|product|gp\/product)\/([A-Z0-9]{10})/i);
  if (m) return m[1].toUpperCase();

  const m2 = str.match(/(?:asin=|\/)([A-Z0-9]{10})(?:[/?&#]|$)/i);
  if (m2) return m2[1].toUpperCase();

  return null;
}

async function followRedirect(url: string, maxRedirects = 3): Promise<string> {
  if (maxRedirects <= 0) return url;
  return new Promise((resolve) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const nextUrl = res.headers.location.startsWith('http')
              ? res.headers.location
              : new URL(res.headers.location, url).toString();
            resolve(followRedirect(nextUrl, maxRedirects - 1));
          } else {
            resolve(url);
          }
        }
      );
      req.on('error', () => resolve(url));
    } catch {
      resolve(url);
    }
  });
}

export async function resolveAmazonProductMetadata(urlOrAsin: string): Promise<AmazonProductMetadata> {
  let asin = extractAsin(urlOrAsin);

  // If input was a redirect shortlink without direct ASIN in string
  if (!asin && (urlOrAsin.includes('http://') || urlOrAsin.includes('https://'))) {
    const finalUrl = await followRedirect(urlOrAsin);
    asin = extractAsin(finalUrl);
  }

  if (!asin) {
    throw new Error('Could not identify valid 10-character Amazon ASIN from the provided link.');
  }

  const amazonUrl = `https://www.amazon.in/dp/${asin}`;
  const canonicalAffiliateUrl = `https://www.amazon.in/dp/${asin}?tag=mitoreboot-21&linkCode=ll2`;
  const canonicalCdnImage = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SCLZZZZZZZ_SX500_.jpg`;

  return new Promise((resolve) => {
    https
      .get(
        amazonUrl,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Encoding': 'gzip, deflate',
            'Accept-Language': 'en-US,en;q=0.9',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
          }
        },
        (res) => {
          const stream = res.headers['content-encoding'] === 'gzip' ? res.pipe(zlib.createGunzip()) : res;
          let data = '';
          stream.on('data', (chunk) => (data += chunk));
          stream.on('end', () => {
            // Title
            let rawTitle =
              data.match(/<span id="productTitle"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.trim() ||
              data.match(/<title>([^<]+)<\/title>/i)?.[1]?.replace(/: Amazon\.in.*$/i, '').trim();

            let cleanTitle = rawTitle
              ? rawTitle
                  .replace(/&amp;/g, '&')
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/\s+/g, ' ')
                  .trim()
              : `Amazon Product (${asin})`;

            // Image
            let img =
              data.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i)?.[1] ||
              data.match(/"hiRes":"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i)?.[1] ||
              data.match(/id="landingImage"[^>]*src="([^"]+)"/i)?.[1] ||
              data.match(/id="imgBlkFront"[^>]*src="([^"]+)"/i)?.[1];

            if (!img || img.includes('11Sa2OpQXzL')) {
              img = canonicalCdnImage;
            }

            // Brand
            let brand =
              data.match(/id="bylineInfo"[^>]*>([\s\S]*?)<\/a>/i)?.[1]?.replace(/Brand:|Visit the | Store/gi, '').trim() ||
              data.match(/class="po-brand"[^>]*[\s\S]*?class="a-span9"[^>]*>([\s\S]*?)<\/span>/i)?.[1]?.trim() ||
              'Amazon';

            brand = brand.replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();

            resolve({
              asin,
              title: cleanTitle,
              image: img,
              brand: brand || 'Amazon',
              affiliateUrl: canonicalAffiliateUrl
            });
          });
        }
      )
      .on('error', () => {
        resolve({
          asin,
          title: `Amazon Product (${asin})`,
          image: canonicalCdnImage,
          brand: 'Amazon',
          affiliateUrl: canonicalAffiliateUrl
        });
      });
  });
}
