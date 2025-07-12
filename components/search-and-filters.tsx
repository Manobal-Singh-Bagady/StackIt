"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, Filter, X } from "lucide-react"

const popularTags = [
  "javascript",
  "react",
  "nextjs",
  "typescript",
  "nodejs",
  "python",
  "css",
  "html",
  "api",
  "database",
  "authentication",
  "deployment",
  "performance",
  "testing",
  "debugging",
]

export function SearchAndFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get("tags")?.split(",").filter(Boolean) || [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery.trim()) params.set("search", searchQuery.trim())
    if (selectedTags.length > 0) params.set("tags", selectedTags.join(","))

    const queryString = params.toString()
    router.push(queryString ? `/?${queryString}` : "/")
  }

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag]
      setSelectedTags(newTags)
    }
  }

  const removeTag = (tag: string) => {
    const newTags = selectedTags.filter((t) => t !== tag)
    setSelectedTags(newTags)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTags([])
    router.push("/")
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="search"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none bg-transparent">
                <Filter className="w-4 h-4 mr-2" />
                Tags
                {selectedTags.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Filter by tags</h4>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => (selectedTags.includes(tag) ? removeTag(tag) : addTag(tag))}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button type="submit" className="flex-1 sm:flex-none">
            Search
          </Button>
        </div>
      </div>

      {(selectedTags.length > 0 || searchQuery) && (
        <div className="flex items-start gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground flex-shrink-0">Active filters:</span>
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="outline" className="text-xs">
                Search: {searchQuery}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => setSearchQuery("")}>
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
                <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}
