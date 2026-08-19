import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';
import { Helmet } from 'react-helmet-async';

export default function Packzinho() {
  return (
    <>
      <Helmet>
        <link rel="canonical" href="https://packzinhu.online/packzinho" />
      </Helmet>
      <CategoryLayout activeCategory="Todos">
        <FeedView initialCategory="Todos" />
      </CategoryLayout>
    </>
  );
}
