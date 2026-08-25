import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { queryClient } from "../../api/queryClient";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import {
  useGeneratorAction,
  useGeneratorStatus,
} from "../../hooks/useGenerator";

interface PaletteCommand {
  id: string;
  label: string;
  group: "Navigation" | "Actions" | "Generator";
  perform: () => void;
}

/** Global Ctrl+K / Cmd+K command palette for navigation and common actions. */
export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const generatorStatus = useGeneratorStatus();
  const generatorAction = useGeneratorAction();

  useFocusTrap(dialogRef, open);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isPaletteShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";

      if (isPaletteShortcut) {
        event.preventDefault();
        setOpen((current) => {
          if (!current) {
            triggerRef.current = document.activeElement as HTMLElement;
          }
          return !current;
        });
        return;
      }

      if (event.key === "Escape") {
        setOpen((current) => {
          if (current) {
            closePalette();
          }
          return false;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closePalette]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const generatorState = generatorStatus.data?.state;

  const commands = useMemo<PaletteCommand[]>(() => {
    const navigationCommands: PaletteCommand[] = [
      {
        id: "nav-overview",
        label: "Navigate to Overview",
        group: "Navigation",
        perform: () => navigate("/"),
      },
      {
        id: "nav-events",
        label: "Navigate to Events",
        group: "Navigation",
        perform: () => navigate("/events"),
      },
      {
        id: "nav-alerts",
        label: "Navigate to Alerts",
        group: "Navigation",
        perform: () => navigate("/alerts"),
      },
      {
        id: "nav-incidents",
        label: "Navigate to Incidents",
        group: "Navigation",
        perform: () => navigate("/incidents"),
      },
      {
        id: "nav-analytics",
        label: "Navigate to Analytics",
        group: "Navigation",
        perform: () => navigate("/analytics"),
      },
      {
        id: "nav-system",
        label: "Navigate to System",
        group: "Navigation",
        perform: () => navigate("/system"),
      },
    ];

    const actionCommands: PaletteCommand[] = [
      {
        id: "refresh-page",
        label: "Refresh current page",
        group: "Actions",
        perform: () => {
          void queryClient.invalidateQueries();
        },
      },
    ];

    const generatorCommands: PaletteCommand[] = [];

    if (!generatorState || generatorState === "STOPPED") {
      generatorCommands.push({
        id: "generator-start",
        label: "Start generator",
        group: "Generator",
        perform: () => generatorAction.mutate("start"),
      });
    }

    if (generatorState === "RUNNING") {
      generatorCommands.push({
        id: "generator-pause",
        label: "Pause generator",
        group: "Generator",
        perform: () => generatorAction.mutate("pause"),
      });
    }

    if (generatorState === "PAUSED") {
      generatorCommands.push({
        id: "generator-resume",
        label: "Resume generator",
        group: "Generator",
        perform: () => generatorAction.mutate("resume"),
      });
    }

    if (generatorState === "RUNNING" || generatorState === "PAUSED") {
      generatorCommands.push({
        id: "generator-stop",
        label: "Stop generator",
        group: "Generator",
        perform: () => generatorAction.mutate("stop"),
      });
    }

    return [...navigationCommands, ...actionCommands, ...generatorCommands];
  }, [generatorState, navigate, generatorAction]);

  const filteredCommands = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return commands;
    }

    return commands.filter((command) =>
      command.label.toLowerCase().includes(normalized),
    );
  }, [commands, query]);

  const selectedIndex = Math.min(activeIndex, filteredCommands.length - 1);

  if (!open) {
    return null;
  }

  const runCommand = (command: PaletteCommand) => {
    command.perform();
    closePalette();
  };

  return (
    <div className="command-palette-backdrop" onClick={closePalette}>
      <div
        ref={dialogRef}
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) =>
              Math.min(current + 1, filteredCommands.length - 1),
            );
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            const command = filteredCommands[selectedIndex];

            if (command) {
              runCommand(command);
            }
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          placeholder="Type a command..."
          aria-label="Command palette search"
          role="combobox"
          aria-expanded="true"
          aria-controls="command-palette-list"
          aria-activedescendant={filteredCommands[selectedIndex]?.id}
        />

        <ul
          id="command-palette-list"
          role="listbox"
          aria-label="Available commands"
          className="command-palette__list"
        >
          {filteredCommands.length === 0 ? (
            <li className="command-palette__empty">No matching commands.</li>
          ) : (
            filteredCommands.map((command, index) => (
              <li key={command.id}>
                <button
                  type="button"
                  role="option"
                  id={command.id}
                  aria-selected={index === selectedIndex}
                  aria-label={command.label}
                  className={[
                    "command-palette__option",
                    index === selectedIndex
                      ? "command-palette__option--active"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(command)}
                >
                  <span className="command-palette__group">
                    {command.group}
                  </span>
                  <span>{command.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
