import CategoryLayout from '../components/CategoryLayout';
import FeedView from '../components/FeedView';

export default function Packzin() {
  return (
    <CategoryLayout activeCategory="Todos">
      <FeedView initialCategory="Todos" />
    </CategoryLayout>
  );
}
