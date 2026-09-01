
export const config = {
  matcher: ['/blog/:slug*'],
};

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  

  const pathParts = url.pathname.split('/');
  const slug = pathParts[2];


  if (!slug) return;

  try {

    const apiRes = await fetch(`https://api.zquab.com/api/v1/blogs/${slug}`);
    
    // If the API fails or the blog doesn't exist, exit and load the normal page
    if (!apiRes.ok) return; 
    
    const blogData = await apiRes.json();


    let imageUrl = blogData.coverImage;
    if (imageUrl && imageUrl.includes('supabase.co')) {
      imageUrl = imageUrl.replace(/https:\/\/[^/]+\.supabase\.co/, 'https://cdn.zquab.com');
    }

    // 4. Fetch your site's generic index.html
    // Fetching '/' grabs the compiled HTML safely without causing a loop
    const basePageRes = await fetch(new URL('/', req.url));
    let html = await basePageRes.text();

    // 5. Swap the generic meta tags with the dynamic blog data!
    if (blogData.title) {
      html = html.replace(
        '<meta property="og:title" content="Meet someone new in seconds.">',
        `<meta property="og:title" content="${blogData.title}">`
      );
      html = html.replace(
        '<meta property="twitter:title" content="Meet someone new in seconds.">',
        `<meta property="twitter:title" content="${blogData.title}">`
      );
    }
    
    if (imageUrl) {
      html = html.replace(
        '<meta property="og:image" content="https://www.zquab.com/og-image.jpg">',
        `<meta property="og:image" content="${imageUrl}">`
      );
      html = html.replace(
        '<meta property="twitter:image" content="https://www.zquab.com/og-image.jpg">',
        `<meta property="twitter:image" content="${imageUrl}">`
      );
    }

    // 6. Return the newly modified HTML to the browser or WhatsApp bot
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
    
  } catch (error) {

    return;
  }
}