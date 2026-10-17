
import { LogOut, X } from 'lucide-react';
import Logo from './Logo.jsx';
import Avatar from './Avatar.jsx';

export default function Sidebar({
  items,
  activeId,
  account,
  isOpen,
  onClose,
  onLogout,
  connectionStatus = 'loading',
}) {
  return (
    <aside
      id="sidebar"
      className={`sidebar${isOpen ? ' is-open' : ''}`}
    >
      <div className="sidebar__top">
        <div>
          <Logo />
          <span className="sidebar__product">Dashboard</span>
        </div>

        <button
          type="button"
          className="icon-button sidebar__close"
          aria-label="Fechar menu"
          onClick={onClose}
        >
          <X aria-hidden="true" size={22} />
        </button>
      </div>

      <nav className="nav" aria-label="Principal">
        {items.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#${id}`}
            className={`nav__link${id === activeId ? ' is-active' : ''}`}
            aria-current={id === activeId ? 'page' : undefined}
            onClick={onClose}
          >
            <Icon
              aria-hidden="true"
              size={20}
              strokeWidth={1.8}
            />
            {label}
          </a>
        ))}
      </nav>

      <div className="sidebar__user">
        <div className="user">
          <Avatar account={account} />

          <div>
            <span className="user__name">
              {connectionStatus === 'loading' ? 'Carregando' : account.name}
            </span>
            <span className="user__note">
              {connectionStatus === 'loading' ? 'Buscando conta…' : account.handle}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="nav__link nav__link--button"
          onClick={onLogout}
        >
          <LogOut
            aria-hidden="true"
            size={20}
            strokeWidth={1.8}
          />
          Sair
        </button>
      </div>
    </aside>
  );
}
