"use client"

import { MagnifyingGlassIcon as Search } from "@phosphor-icons/react/dist/ssr"
import { Input } from "@/components/ui/input"
import { PageToolbar, SegmentedControl } from "@/components/layout"

type Option<T extends string> = { value: T; label: string; count?: number }

type RfqListToolbarProps<T extends string> = {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  searchAriaLabel?: string
  filterValue?: T
  filterOptions?: Option<T>[]
  onFilterChange?: (value: T) => void
  filterAriaLabel?: string
  secondaryFilterValue?: string
  secondaryFilterOptions?: Option<string>[]
  onSecondaryFilterChange?: (value: string) => void
  secondaryFilterAriaLabel?: string
  /** Buttons that sit in the search row (category filter, alerts). */
  trailing?: React.ReactNode
}

export const RfqListToolbar = <T extends string>({
  search,
  onSearchChange,
  searchPlaceholder = "Поиск по названию или номеру",
  searchAriaLabel = "Поиск по заявкам",
  filterValue,
  filterOptions,
  onFilterChange,
  filterAriaLabel,
  secondaryFilterValue,
  secondaryFilterOptions,
  onSecondaryFilterChange,
  secondaryFilterAriaLabel,
  trailing,
}: RfqListToolbarProps<T>) => (
  <div className="mb-4 grid gap-3">
    <PageToolbar className="gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 bg-white pl-11"
          aria-label={searchAriaLabel}
        />
      </div>
      {trailing}
    </PageToolbar>

    {filterOptions && filterValue !== undefined && onFilterChange ? (
      <SegmentedControl
        value={filterValue}
        options={filterOptions}
        onChange={onFilterChange}
        ariaLabel={filterAriaLabel}
      />
    ) : null}

    {secondaryFilterOptions &&
    secondaryFilterValue !== undefined &&
    onSecondaryFilterChange ? (
      <SegmentedControl
        value={secondaryFilterValue}
        options={secondaryFilterOptions}
        onChange={onSecondaryFilterChange}
        ariaLabel={secondaryFilterAriaLabel}
      />
    ) : null}
  </div>
)
