import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;       // 🛠️ Added image prop
  schema?: string;      // Optional JSON-LD string
}

export default function SEO({ title, description, path = '', image, schema }: SEOProps) {
  const siteUrl = 'https://www.zquab.com';
  const fullUrl = `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
  
  // Use custom image (e.g. blog cover) or fallback to default og-image
  const ogImageUrl = image 
    ? (image.startsWith('http') ? image : `${siteUrl}${image.startsWith('/') ? image : `/${image}`}`)
    : `${siteUrl}/og-image.jpg?v=2`;

  return (
    <Helmet>
      {/* Basic Standard Meta */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook / Discord / WhatsApp */}
      <meta property="og:type" content={path.startsWith('/blog/') ? 'article' : 'website'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter / X */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImageUrl} />

      {/* Optional Injected JSON-LD Schema */}
      {schema && (
        <script type="application/ld+json">
          {schema}
        </script>
      )}
    </Helmet>
  );
}