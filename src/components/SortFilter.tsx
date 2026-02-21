"use client"

import { SortOption } from "@/lib/types"

const SORT_OPTIONS = [
  { value: "hot", label: "Hot", icon: "🔥" },
  { value: "new", label: "New", icon: "🆕" },
  { value: "top", label: "Top", icon: "🏆" },
] as const

interface SortFilterProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
}

export default function SortFilter({ currentSort, onSortChange }: SortFilterProps) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 p-1 rounded-lg bg-[#2A2A2A]">
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onSortChange(option.value as SortOption)}
          className={`flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
            currentSort === option.value 
              ? "bg-[#E0301E] text-white" 
              : "text-[#A0A0A0]"
          }`}
        >
          <span className="text-sm">{option.icon}</span>
          <span className="hidden xs:block sm:hidden">{option.label.charAt(0)}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  )
}
