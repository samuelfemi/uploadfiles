/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import * as React from "react"
import { Eye, Download, FileText, Loader2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api } from "#/lib/api"
import type { FileItem } from "#/lib/api"

type PreviewKind = "image" | "video" | "audio" | "pdf" | "text" | "fallback"

function getPreviewKind(mimeType: string, name: string): PreviewKind {
  const mime = mimeType.toLowerCase()
  const lowerName = name.toLowerCase()

  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  if (mime === "application/pdf" || lowerName.endsWith(".pdf")) return "pdf"
  if (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/javascript" ||
    mime === "application/typescript" ||
    mime.includes("xml") ||
    mime.includes("csv") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".js") ||
    lowerName.endsWith(".ts") ||
    lowerName.endsWith(".tsx") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".log")
  )
    return "text"
  return "fallback"
}

function formatBytes(b: number): string {
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const idx = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, idx)).toFixed(1))} ${sizes[idx]}`
}

type FilePreviewDialogProps = {
  file: FileItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreviewDialog({ file, open, onOpenChange }: FilePreviewDialogProps) {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null)
  const [textContent, setTextContent] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const previewKind: PreviewKind | null = file ? getPreviewKind(file.mimeType, file.name) : null

  React.useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function load() {
      if (!open || !file) return
      if (previewKind === "fallback") return

      setLoading(true)
      setError(null)
      setTextContent(null)

      // revoke previous
      if (blobUrl !== null) {
        URL.revokeObjectURL(blobUrl)
        setBlobUrl(null)
      }

      try {
        const blob = await api.fetchFileBlob(file.id)
        if (cancelled) return

        if (previewKind === "text") {
          const text = await blob.text()
          if (cancelled) return
          // limit text preview to 200kb
          const sliced = text.length > 200_000 ? text.slice(0, 200_000) + "\n\n— truncated, download to see full file —" : text
          setTextContent(sliced)
        } else {
          objectUrl = URL.createObjectURL(blob)
          if (cancelled) {
            URL.revokeObjectURL(objectUrl)
            return
          }
          setBlobUrl(objectUrl)
        }
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : String(e)
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [open, file?.id])

  // cleanup on close/unmount
  React.useEffect(() => {
    if (!open && blobUrl !== null) {
      URL.revokeObjectURL(blobUrl)
      setBlobUrl(null)
    }
  }, [open, blobUrl])

  React.useEffect(() => {
    return () => {
      if (blobUrl !== null) URL.revokeObjectURL(blobUrl)
    }
  }, [blobUrl])

  const handleDownload = async () => {
    if (!file) return
    try {
      await api.downloadFile(file.id, file.name)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-0 p-0 sm:max-w-3xl lg:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="min-w-0">
              <DialogTitle className="truncate text-sm font-semibold normal-case tracking-tight">{file.name}</DialogTitle>
              <DialogDescription className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs">
                <span>{file.mimeType || "unknown"}</span>
                <span className="text-muted-foreground">•</span>
                <span>{formatBytes(file.size)}</span>
                <Badge variant="secondary" className="rounded-none font-mono text-[10px] uppercase">
                  {previewKind}
                </Badge>
              </DialogDescription>
            </div>
            <Button size="sm" onClick={handleDownload} className="shrink-0 gap-1.5 rounded-none">
              <Download className="size-4" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-[320px] flex-1 overflow-auto bg-muted/20 p-4">
          {loading ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Loading preview…</p>
            </div>
          ) : error ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm font-medium">Failed to load preview</p>
              <p className="max-w-md text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={handleDownload} className="rounded-none">
                <Download className="size-4" /> Try download instead
              </Button>
            </div>
          ) : previewKind === "image" && blobUrl ? (
            <div className="flex justify-center">
              <img src={blobUrl} alt={file.name} className="max-h-[65vh] max-w-full object-contain shadow-sm" />
            </div>
          ) : previewKind === "video" && blobUrl ? (
            <video src={blobUrl} controls className="max-h-[65vh] w-full bg-black" />
          ) : previewKind === "audio" && blobUrl ? (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-6">
              <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Eye className="size-8" />
              </div>
              <audio src={blobUrl} controls className="w-full max-w-md" />
              <p className="text-xs text-muted-foreground">{file.name}</p>
            </div>
          ) : previewKind === "pdf" && blobUrl ? (
            <iframe src={blobUrl} title={file.name} className="h-[65vh] w-full border bg-white" />
          ) : previewKind === "text" && textContent !== null ? (
            <pre className="max-h-[65vh] overflow-auto whitespace-pre-wrap break-words rounded-none border bg-card p-4 font-mono text-xs leading-relaxed">
              {textContent || "(empty file)"}
            </pre>
          ) : (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex size-14 items-center justify-center border bg-card">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">No inline preview available</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  This file type ({file.mimeType || "unknown"}) can&apos;t be previewed in the browser. Download to view it locally.
                </p>
              </div>
              <Button onClick={handleDownload} className="gap-1.5 rounded-none">
                <Download className="size-4" /> Download {formatBytes(file.size)}
              </Button>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t bg-card px-4 py-3 text-xs text-muted-foreground">
          <span className="font-mono">Preview • {file.name}</span>
          <span className="hidden sm:inline">Press Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
