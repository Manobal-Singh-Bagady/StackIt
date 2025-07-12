"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  LinkIcon,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Smile,
} from "lucide-react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🔥", "💯", "🎉"]

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [linkText, setLinkText] = useState("")

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertEmoji = (emoji: string) => {
    execCommand("insertText", emoji)
  }

  const insertLink = () => {
    if (linkUrl && linkText) {
      execCommand("insertHTML", `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a>`)
      setLinkUrl("")
      setLinkText("")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        execCommand("insertHTML", `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className={`border rounded-lg ${className}`}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {/* Basic formatting */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("bold")}>
            <Bold className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("italic")}>
            <Italic className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("strikeThrough")}>
            <Strikethrough className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Lists */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertUnorderedList")}>
            <List className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("insertOrderedList")}>
            <ListOrdered className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        {/* Links and images */}
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <LinkIcon className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="link-text">Link Text</Label>
                  <Input
                    id="link-text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Enter link text"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-url">URL</Label>
                  <Input
                    id="link-url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <Button onClick={insertLink} className="w-full">
                  Insert Link
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button type="button" variant="ghost" size="sm" asChild>
            <label>
              <ImageIcon className="w-4 h-4" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </Button>
        </div>

        {/* Alignment - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          <Separator orientation="vertical" className="h-6" />
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyLeft")}>
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyCenter")}>
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => execCommand("justifyRight")}>
            <AlignRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Emoji */}
        <div className="flex items-center gap-1">
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <Smile className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid grid-cols-5 gap-2">
                {emojis.map((emoji) => (
                  <Button
                    key={emoji}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertEmoji(emoji)}
                    className="text-lg"
                  >
                    {emoji}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[200px] p-3 sm:p-4 focus:outline-none text-sm sm:text-base"
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        data-placeholder={placeholder}
        style={{
          wordBreak: "break-word",
        }}
      />
    </div>
  )
}
