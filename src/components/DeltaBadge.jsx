import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatChange } from '../utils/format.js';

export default function DeltaBadge({ change }) {
  const up = change.value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;

  return (
    <span className={`delta ${up ? 'delta--up' : 'delta--down'}`}>
      <Icon aria-hidden="true" size={14} strokeWidth={2.2} />
      <span className="sr-only">{up ? 'Aumento de ' : 'Queda de '}</span>
      {formatChange(change)}
    </span>
  );
}
