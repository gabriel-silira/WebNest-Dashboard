import DeltaBadge from './DeltaBadge.jsx';
import Sparkline from './Sparkline.jsx';
import { formatMetric } from '../utils/format.js';

export default function MetricCard({ label, value, format, change, trend }) {
  return (
    <article className="card metric">
      <h3 className="metric__label">{label}</h3>
      <p className="metric__value">{formatMetric(value, format)}</p>
      <div className="metric__foot">
        {change && <DeltaBadge change={change} />}
        <Sparkline values={trend} />
      </div>
      {change && <p className="metric__caption">vs. período anterior</p>}
    </article>
  );
}
