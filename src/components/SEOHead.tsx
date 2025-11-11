import { useEffect } from 'react';
import { Service } from '../lib/types';

interface SEOHeadProps {
  service?: Service;
  title?: string;
  description?: string;
  keywords?: string[];
}

export default function SEOHead({ service, title, description, keywords }: SEOHeadProps) {
  useEffect(() => {
    if (service) {
      const pageTitle = service.seo_title || service.meta_title || `${service.name} | 생활정보 허브`;
      const pageDesc = service.seo_description || service.meta_description || service.description || '';
      const pageKeywords = service.seo_keywords || keywords || [];
      const pageUrl = `${window.location.origin}/${service.slug}`;
      const pageImage = service.thumbnail_url || service.featured_image || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=630&fit=crop';

      document.title = pageTitle;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', pageDesc);
      }

      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords && pageKeywords.length > 0) {
        metaKeywords.setAttribute('content', pageKeywords.join(', '));
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', pageTitle);
      }

      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) {
        ogDescription.setAttribute('content', pageDesc);
      }

      const ogUrl = document.querySelector('meta[property="og:url"]');
      if (ogUrl) {
        ogUrl.setAttribute('content', pageUrl);
      }

      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) {
        ogImage.setAttribute('content', pageImage);
      }

      let jsonLd = document.querySelector('script[type="application/ld+json"]');
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.setAttribute('type', 'application/ld+json');
        document.head.appendChild(jsonLd);
      }

      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': service.name,
        'description': pageDesc,
        'url': pageUrl,
        'image': pageImage,
        'provider': {
          '@type': 'Organization',
          'name': '생활정보 허브',
          'url': window.location.origin
        },
        'areaServed': {
          '@type': 'Country',
          'name': '대한민국'
        }
      };

      if (service.operating_hours) {
        structuredData['hoursAvailable'] = service.operating_hours;
      }

      if (service.address) {
        structuredData['serviceArea'] = {
          '@type': 'Place',
          'address': service.address
        };
      }

      jsonLd.textContent = JSON.stringify(structuredData);

      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', pageUrl);
      } else {
        const newCanonical = document.createElement('link');
        newCanonical.rel = 'canonical';
        newCanonical.href = pageUrl;
        document.head.appendChild(newCanonical);
      }
    } else if (title) {
      document.title = title;

      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription && description) {
        metaDescription.setAttribute('content', description);
      }

      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords && keywords) {
        metaKeywords.setAttribute('content', keywords.join(', '));
      }
    }

    return () => {
      document.title = '생활정보 허브 | 필요한 정보를 빠르게';
    };
  }, [service, title, description, keywords]);

  return null;
}
