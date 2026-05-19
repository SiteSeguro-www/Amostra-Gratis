import { Helmet } from 'react-helmet-async';

interface SEOProps {
  type: string;
  data: any;
}

export default function JsonLd({ type, data }: SEOProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
