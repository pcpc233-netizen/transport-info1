import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = 'https://long-tail-action-inf-32e8.bolt.host';

    // 발행된 롱테일 조합 가져오기
    const { data: combinations, error } = await supabase
      .from('longtail_combinations')
      .select('generated_slug, published_at, view_count')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (error) throw error;

    // 서비스 가져오기
    const { data: services } = await supabase
      .from('services')
      .select('slug, updated_at')
      .eq('is_active', true);

    // 카테고리 가져오기
    const { data: categories } = await supabase
      .from('service_categories')
      .select('slug, updated_at');

    const now = new Date().toISOString();

    // XML 생성
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // 홈페이지
    sitemap += `  <url>\n`;
    sitemap += `    <loc>${baseUrl}</loc>\n`;
    sitemap += `    <lastmod>${now}</lastmod>\n`;
    sitemap += `    <changefreq>daily</changefreq>\n`;
    sitemap += `    <priority>1.0</priority>\n`;
    sitemap += `  </url>\n`;

    // 카테고리 페이지
    for (const category of (categories || [])) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}#category/${category.slug}</loc>\n`;
      sitemap += `    <lastmod>${category.updated_at || now}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `  </url>\n`;
    }

    // 서비스 페이지
    for (const service of (services || [])) {
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}#service/${service.slug}</loc>\n`;
      sitemap += `    <lastmod>${service.updated_at || now}</lastmod>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.7</priority>\n`;
      sitemap += `  </url>\n`;
    }

    // 롱테일 페이지
    for (const combo of (combinations || [])) {
      const priority = combo.view_count > 100 ? 0.9 : combo.view_count > 50 ? 0.8 : 0.6;
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}#longtail/${combo.generated_slug}</loc>\n`;
      sitemap += `    <lastmod>${combo.published_at || now}</lastmod>\n`;
      sitemap += `    <changefreq>monthly</changefreq>\n`;
      sitemap += `    <priority>${priority}</priority>\n`;
      sitemap += `  </url>\n`;
    }

    sitemap += '</urlset>';

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
