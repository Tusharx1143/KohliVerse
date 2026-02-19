"use client"

import { COLORS, SORT_OPTIONS } from "@/lib/constants"
import { SortOption } from "@/lib/types"

interface SortFilterProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export default function SortFilter({ currentSort, onSortChange }: SortFilterProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-lg" style={{ backgroundColor: COLORS.muted }}>
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onSortChange(option.value as SortOption)}
          className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all"
          style={{
            backgroundColor: currentSort === option.value ? COLORS.primary : "transparent",
            color: currentSort === option.value ? "white" : COLORS.textSecondary,
          }}
        >
          <span className="text-sm">{option.icon}</span>
          <span className="hidden xs:block sm:hidden">{option.label.charAt(0)}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
