
import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { PERIODS } from '../data/demo.js';

export default function PeriodSelect({ value, onChange, id = 'period' }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, PERIODS.findIndex((p) => p.id === value)),
  );
  const rootRef = useRef(null);
  const selectedIndex = Math.max(
    0,
    PERIODS.findIndex((p) => p.id === value),
  );
  const selected = PERIODS[selectedIndex];
  const listId = `${id}-options`;

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function choose(period) {
    onChange(period.id);
    setActiveIndex(PERIODS.findIndex((p) => p.id === period.id));
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      if (!open) {
        setOpen(true);
        setActiveIndex(selectedIndex);
        return;
      }

      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) =>
        (current + direction + PERIODS.length) % PERIODS.length,
      );
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (open) {
        event.preventDefault();
        choose(PERIODS[activeIndex]);
      } else {
        setOpen(true);
        setActiveIndex(selectedIndex);
      }
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
      setOpen(true);
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(PERIODS.length - 1);
      setOpen(true);
    }
  }

  return (
    <div className={`period-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        id={id}
        type="button"
        className="period-select__trigger"
        aria-label="Período de análise"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{selected.label}</span>
        <ChevronDown size={17} aria-hidden="true" />
      </button>

      {open && (
        <div
          className="period-select__menu"
          id={listId}
          role="listbox"
          aria-labelledby={id}
          aria-activedescendant={`${id}-option-${PERIODS[activeIndex].id}`}
        >
          {PERIODS.map((period, index) => {
            const isSelected = period.id === value;
            const isActive = index === activeIndex;

            return (
              <button
                key={period.id}
                id={`${id}-option-${period.id}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={[
                  'period-select__option',
                  isSelected ? 'is-selected' : '',
                  isActive ? 'is-active' : '',
                ].filter(Boolean).join(' ')}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(period)}
              >
                <span>{period.label}</span>
                {isSelected && <Check size={16} aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
