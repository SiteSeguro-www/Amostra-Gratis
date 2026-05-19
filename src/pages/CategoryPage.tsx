import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';
import { useParams } from 'react-router-dom';
import { SLUG_TO_NAME } from '../constants';
import { Helmet } from 'react-helmet-async';
import JsonLd from '../components/JsonLd';

export default function CategoryPage() {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const categoryName = categorySlug ? SLUG_TO_NAME[categorySlug] || "Todos" : "Todos";
  
  return (
    <CategoryLayout activeCategory={categoryName}>
      <JsonLd 
        type="BreadcrumbList"
        data={{
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Início',
              item: 'https://packzinhu.online'
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: categoryName,
              item: `https://packzinhu.online/category/${categorySlug}`
            }
          ]
        }}
      />
      <Helmet>
        <title>{categoryName} | Venda de Packs e Fotos de Pés no PackZinhu</title>
        <meta name="description" content={`Os melhores packs da categoria ${categoryName}. Confira fotos de pés, sexting e conteúdo exclusivo verificado no PackZinhu.`} />
        <meta name="keywords" content={`${categoryName}, vender packs, fotos de pés, PackZinhu, ganhar dinheiro online, ${categorySlug}`} />
        <link rel="canonical" href={`https://packzinhu.online/category/${categorySlug}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${categoryName} | PackZinhu`} />
        <meta property="og:description" content={`Explore os melhores conteúdos de ${categoryName} no PackZinhu.`} />
        <meta property="og:image" content="https://packzinhu.online/banner-principal.jpeg" />
      </Helmet>
      <FeedView initialCategory={categorySlug || "Todos"} />
    </CategoryLayout>
  );
}
