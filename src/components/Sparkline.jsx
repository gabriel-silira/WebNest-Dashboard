// Mini gráfico decorativo: o valor e a variação já estão no texto do cartão.
export default function Sparkline({ values }) {
  const width = 96;
  const height = 32;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <polyline points={points} fill="none" stroke="#22D3EE" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
