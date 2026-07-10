"use client";

import { Search, X } from "lucide-react";
import { COLORS, RADIUS, FONT } from "@/utils/theme";
import { CallStatusOption } from "@/utils/callStatus";

export const ALL_FILTER = "ALL";
export const CUSTOM_FILTER = "CUSTOM";

interface StatusFilterBarProps {
  statuses: CallStatusOption[];
  active: string;
  onSelect: (value: string) => void;
  customQuery: string;
  onCustomQueryChange: (q: string) => void;
  counts?: Record<string, number>;
}

// Single-line status filter: fixed status tabs + a "type to search" box that
// matches ANY status (including custom, typed-in ones not in the fixed list).
export function StatusFilterBar({
  statuses,
  active,
  onSelect,
  customQuery,
  onCustomQueryChange,
  counts,
}: StatusFilterBarProps) {
  return (
    <>
      <style>{`
        .sfb-wrap {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          padding: 8px 0 10px;
        }
        .sfb-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 12px; border-radius: ${RADIUS.full};
          border: 1px solid ${COLORS.cardBorder}; background: ${COLORS.cardBg};
          color: ${COLORS.textSecondary}; font-size: 11.5px; font-weight: 600;
          cursor: pointer; white-space: nowrap; font-family: ${FONT.family};
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .sfb-pill:hover { background: ${COLORS.gray50}; }
        .sfb-pill.active {
          background: ${COLORS.btnPrimaryBg}; color: ${COLORS.btnPrimaryText};
          border-color: ${COLORS.btnPrimaryBg};
        }
        .sfb-pill-count {
          font-size: 10px; opacity: 0.75;
        }
        .sfb-search-wrap {
          position: relative; margin-left: 4px; flex: 0 0 auto;
        }
        .sfb-search {
          height: 30px; width: 190px; padding: 0 26px 0 28px;
          border-radius: ${RADIUS.full}; border: 1px solid ${COLORS.cardBorder};
          background: ${COLORS.cardBg}; color: ${COLORS.textPrimary};
          font-size: 12px; font-family: ${FONT.family}; outline: none;
        }
        .sfb-search:focus { border-color: ${COLORS.inputBorderFocus}; }
        .sfb-search-icon {
          position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
          color: ${COLORS.textMuted}; pointer-events: none; display: flex;
        }
        .sfb-search-clear {
          position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
          border: none; background: transparent; cursor: pointer;
          color: ${COLORS.textMuted}; display: flex; padding: 2px;
        }
      `}</style>

      <div className="sfb-wrap">
        <button
          type="button"
          className={`sfb-pill ${active === ALL_FILTER ? "active" : ""}`}
          onClick={() => {
            onSelect(ALL_FILTER);
            onCustomQueryChange("");
          }}
        >
          All
          {counts && typeof counts[ALL_FILTER] === "number" && (
            <span className="sfb-pill-count">({counts[ALL_FILTER]})</span>
          )}
        </button>

        {statuses.map((s) => (
          <button
            type="button"
            key={s.value}
            className={`sfb-pill ${active === s.value ? "active" : ""}`}
            onClick={() => {
              onSelect(s.value);
              onCustomQueryChange("");
            }}
          >
            {s.label}
            {counts && typeof counts[s.value] === "number" && (
              <span className="sfb-pill-count">({counts[s.value]})</span>
            )}
          </button>
        ))}

        <div className="sfb-search-wrap">
          <span className="sfb-search-icon">
            <Search size={12} />
          </span>
          <input
            className="sfb-search"
            placeholder="Type to search any status..."
            value={customQuery}
            onChange={(e) => {
              onCustomQueryChange(e.target.value);
              onSelect(CUSTOM_FILTER);
            }}
          />
          {customQuery && (
            <button
              type="button"
              className="sfb-search-clear"
              onClick={() => {
                onCustomQueryChange("");
                onSelect(ALL_FILTER);
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
