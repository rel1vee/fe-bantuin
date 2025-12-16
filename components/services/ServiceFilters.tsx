"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SERVICE_CATEGORIES_LIST } from "@/lib/constants";

interface ServiceFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onSearch: (query: string) => void;
}

export interface FilterState {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  ratingMin?: number;
  sortBy: string;
}

const ServiceFilters = ({ onFilterChange, onSearch }: ServiceFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    sortBy: "newest",
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const handleFilterChange = (
    key: keyof FilterState,
    value: string | number | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceRangeChange = (value: number[]) => {
    const newRange: [number, number] = [value[0], value[1]];
    setPriceRange(newRange);

    const newFilters = {
      ...filters,
      priceMin: value[0] > 0 ? value[0] : undefined,
      priceMax: value[1] < 5000000 ? value[1] : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleManualPriceChange = (type: "min" | "max", value: string) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(5000000, numValue));

    let newRange: [number, number];
    if (type === "min") {
      newRange = [clampedValue, Math.max(clampedValue, priceRange[1])];
    } else {
      newRange = [Math.min(priceRange[0], clampedValue), clampedValue];
    }

    setPriceRange(newRange);

    const newFilters = {
      ...filters,
      priceMin: newRange[0] > 0 ? newRange[0] : undefined,
      priceMax: newRange[1] < 5000000 ? newRange[1] : undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterState = { sortBy: "newest" };
    setFilters(resetFilters);
    setPriceRange([0, 5000000]);
    setVerifiedOnly(false);
    onFilterChange(resetFilters);
    onSearch("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-6 md:p-0 p-4">
      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Kategori</Label>
        <Select
          value={filters.category || "all"}
          onValueChange={(value) =>
            handleFilterChange("category", value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {SERVICE_CATEGORIES_LIST.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Harga</Label>

        {/* Manual Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="priceMin" className="text-xs text-gray-600">
              Min
            </Label>
            <Input
              id="priceMin"
              type="number"
              value={priceRange[0]}
              onChange={(e) => handleManualPriceChange("min", e.target.value)}
              placeholder="0"
              min={0}
              max={5000000}
              step={10000}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="priceMax" className="text-xs text-gray-600">
              Max
            </Label>
            <Input
              id="priceMax"
              type="number"
              value={priceRange[1]}
              onChange={(e) => handleManualPriceChange("max", e.target.value)}
              placeholder="5000000"
              min={0}
              max={5000000}
              step={10000}
              className="h-9"
            />
          </div>
        </div>

        {/* Slider */}
        <div className="pt-2">
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={1000000}
            step={10000}
            className="mb-2"
          />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Rating Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rating Minimum</Label>
        <Select
          value={filters.ratingMin?.toString() || "all"}
          onValueChange={(value) =>
            handleFilterChange(
              "ratingMin",
              value === "all" ? undefined : Number(value)
            )
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Rating</SelectItem>
            <SelectItem value="4.5">4.5+ ⭐</SelectItem>
            <SelectItem value="4.0">4.0+ ⭐</SelectItem>
            <SelectItem value="3.5">3.5+ ⭐</SelectItem>
            <SelectItem value="3.0">3.0+ ⭐</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verified Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="verified"
          checked={verifiedOnly}
          onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
        />
        <label
          htmlFor="verified"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Hanya penyedia terverifikasi
        </label>
      </div>

      {/* Reset Filters */}
      <Button
        variant="outline"
        className="w-full border-gray-300 hover:bg-gray-50"
        onClick={handleReset}
      >
        Reset Filter
      </Button>
    </div>
  );
};

export default ServiceFilters;
