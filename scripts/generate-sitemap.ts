import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const SITE_URL = 'https://your-domain.vercel.app';

async function generateSitemap() {
  console.log('🚀 Generating sitemap...');

  const categories = await supabase
    .from('service_categories')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false });

  const services = await supabase
    .from('services')
    .select('slug, updated_at')
    .order('updated_at', { ascending: false });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  if (categories.data) {
    for (const category of categories.data) {
      xml += `  <url>
    <loc>${SITE_URL}/category/${category.slug}</loc>
    <lastmod>${new Date(category.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }
  }

  if (services.data) {
    for (const service of services.data) {
      xml += `  <url>
    <loc>${SITE_URL}/service/${service.slug}</loc>
    <lastmod>${new Date(service.updated_at).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
    }
  }

  xml += `</urlset>`;

  writeFileSync('public/sitemap.xml', xml);
  console.log('✅ Sitemap generated!');
  console.log(`📊 Total URLs: ${(categories.data?.length || 0) + (services.data?.length || 0) + 1}`);
}

generateSitemap().catch(console.error);
