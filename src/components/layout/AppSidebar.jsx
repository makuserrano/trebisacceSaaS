import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import './appSidebar.scss';

function Icon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6 };
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6.5 10.5V20h4.5v-5h2v5H18v-9.5" />
        </svg>
      );
    case 'users':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 18.5c0-2.2 2.4-4 5-4s5 1.8 5 4" />
          <path d="M15.5 6.5a2.5 2.5 0 1 1 0 5" />
          <path d="M17 13.2c1.7.4 3 1.7 3 3.3" />
        </svg>
      );
    case 'box':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M5 7.5 12 4l7 3.5-7 3.5z" />
          <path d="M5 7.5v8L12 19l7-3.5v-8" />
          <path d="m5 15.5 7-3.5 7 3.5" />
        </svg>
      );
    case 'sales':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M4 12h4l3-6 3 12 2-6h5" />
          <circle cx="6" cy="17.5" r="1.4" />
          <circle cx="16" cy="17.5" r="1.4" />
        </svg>
      );
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M16 10h4v4h-4a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z" />
          <circle cx="17.5" cy="12" r="0.8" fill="currentColor" />
        </svg>
      );
    case 'flag':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="M6 4v16" />
          <path d="M6 4h12l-2.5 4L18 12H6" />
        </svg>
      );
    case 'chevron':
      return (
        <svg viewBox="0 0 24 24" {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AppSidebar({ sections, isOpen, onClose }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [openGroups, setOpenGroups] = useState(() =>
    sections
      .filter((item) => item.children)
      .reduce((acc, item) => ({ ...acc, [item.label]: true }), {}),
  );

  const toggleGroup = (label) =>
    setOpenGroups((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));

  const handleGroupClick = (item) => {
    if (item.to) {
      navigate(item.to);
      if (onClose) onClose();
    }
    toggleGroup(item.label);
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="app-sidebar__brand">
        <span className="app-sidebar__logo">Trebisacce</span>
      </div>

      <nav className="app-sidebar__nav" aria-label="Navegación principal">
        <ul className="app-sidebar__root">
          {sections.map((item) => {
            const isParentActive = item.children
              ? item.children.some((child) => pathname.startsWith(child.to)) ||
                (item.to ? pathname.startsWith(item.to) : false)
              : pathname.startsWith(item.to ?? '');
            const isExpanded = item.children ? openGroups[item.label] : false;
            return (
              <li key={item.label}>
                {item.children ? (
                  <button
                    type="button"
                    className={`app-sidebar__item ${isExpanded ? 'is-open' : ''} ${
                      isParentActive ? 'is-active' : ''
                    }`}
                    onClick={() => handleGroupClick(item)}
                  >
                    <span className="app-sidebar__item-start">
                      <span className="app-sidebar__icon">
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`app-sidebar__chevron ${isExpanded ? 'is-open' : ''}`}
                      aria-hidden="true"
                    >
                      <Icon name="chevron" />
                    </span>
                  </button>
                ) : (
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `app-sidebar__item ${isActive ? 'is-active' : ''}`
                    }
                    end
                    onClick={onClose}
                  >
                    <span className="app-sidebar__item-start">
                      <span className="app-sidebar__icon">
                        <Icon name={item.icon} />
                      </span>
                      <span>{item.label}</span>
                    </span>
                  </NavLink>
                )}

                {item.children && isExpanded && (
                  <ul className="app-sidebar__children">
                    {item.children.map((child) => (
                      <li key={child.to}>
                        <NavLink
                          to={child.to}
                          className={({ isActive: linkActive }) =>
                            `app-sidebar__child ${linkActive ? 'is-active' : ''}`
                          }
                          onClick={onClose}
                          end
                        >
                          <span>{child.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
