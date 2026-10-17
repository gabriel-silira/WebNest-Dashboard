import { Construction } from 'lucide-react';

// Página provisória para itens do menu que ainda não existem.
export default function Placeholder({ title }) {
  return (
    <>
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>Esta área ainda será desenvolvida.</p>
        </div>
      </header>
      <div className="state">
        <Construction aria-hidden="true" size={28} strokeWidth={1.6} />
        <h2>Em construção</h2>
        <p>A tela de {title.toLowerCase()} entra nas próximas etapas do projeto.</p>
      </div>
    </>
  );
}
