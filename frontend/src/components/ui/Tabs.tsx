import { useState, type ReactNode } from "react";

export interface TabDefinition {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  label: string;
  tabs: TabDefinition[];
}

/** Accessible tablist: arrow-key navigation, single active tabpanel. */
export function Tabs({ label, tabs }: TabsProps) {
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");

  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();

    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (activeIndex + direction + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];

    setActiveId(nextTab.id);
    document.getElementById(`tab-${nextTab.id}`)?.focus();
  };

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={tab.id === activeId}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={tab.id === activeId ? 0 : -1}
            className={
              tab.id === activeId ? "tabs__tab tabs__tab--active" : "tabs__tab"
            }
            onClick={() => setActiveId(tab.id)}
            onKeyDown={handleKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeId}
          className="tabs__panel"
        >
          {tab.id === activeId && tab.content}
        </div>
      ))}
    </div>
  );
}
