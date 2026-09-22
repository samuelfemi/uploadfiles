import {
  Folder as FolderIcon,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  MoreHorizontal,
  File as FileIcon,
  Eye,
} from "lucide-react";
import { useDriveStore } from "#/stores/driveStore";
import type { Folder, FileItem } from "#/lib/api";
import { api } from "#/lib/api";
import { useDeleteFile, useDeleteFolder } from "#/hooks/useDrive";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { FilePreviewDialog } from "@/components/drive/FilePreviewDialog";
import * as React from "react";

function formatBytes(b: number) {
  if (b === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function mimeIcon(mime: string, name: string) {
  if (mime.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mime.startsWith("video/")) return <Video className="size-5" />;
  if (mime.startsWith("audio/")) return <Music className="size-5" />;
  if (mime.includes("zip") || name.endsWith(".zip")) return <Archive className="size-5" />;
  if (mime.includes("pdf")) return <FileText className="size-5" />;
  return <FileIcon className="size-5" />;
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function DriveGrid({
  filteredFolders,
  filteredFiles,
}: {
  folders: Folder[];
  files: FileItem[];
  filteredFolders: Folder[];
  filteredFiles: FileItem[];
}) {
  const { view, currentFolderId, setCurrentFolder } = useDriveStore();
  const delFolder = useDeleteFolder(currentFolderId);
  const delFile = useDeleteFile(currentFolderId);
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<null | { type: "folder" | "file"; id: string; name: string }>(null);
  const [previewFile, setPreviewFile] = React.useState<FileItem | null>(null);

  const handleDownload = async (f: FileItem) => {
    try {
      setDownloading(f.id);
      await api.downloadFile(f.id, f.name);
    } catch (e: any) {
      alert(e.message || "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  if (view === "list") {
    return (
      <>
        <div className="overflow-hidden border bg-card">
        <div className="hidden grid-cols-[1fr_110px_110px_80px] gap-4 border-b bg-muted/50 px-3 py-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Name</span>
          <span>Size</span>
          <span>Modified</span>
          <span className="text-right">Action</span>
        </div>

        {filteredFolders.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-muted/50"
          >
            <button
              onClick={() => setCurrentFolder(f.id, f.name)}
              className="flex flex-1 items-center gap-3 text-left"
            >
              <span className="flex size-8 items-center justify-center border bg-secondary">
                <FolderIcon className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">{f.name}</span>
              <Badge variant="secondary" className="hidden rounded-none font-mono text-[10px] uppercase tracking-widest md:inline-flex">
                Folder
              </Badge>
            </button>
            <span className="hidden w-[110px] text-xs text-muted-foreground md:block">—</span>
            <span className="hidden w-[110px] text-xs text-muted-foreground md:block">{timeAgo(f.createdAt)}</span>
            <div className="ml-auto flex w-[80px] justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" className="rounded-none">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem onClick={() => setCurrentFolder(f.id, f.name)}>Open</DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPending({ type: "folder", id: f.id, name: f.name })}
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredFiles.map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-3 border-b px-3 py-2.5 last:border-0 hover:bg-muted/50"
          >
            <button
              type="button"
              onClick={() => f.status === "confirmed" && setPreviewFile(f)}
              disabled={f.status !== "confirmed"}
              className="flex flex-1 items-center gap-3 overflow-hidden text-left hover:opacity-80 disabled:opacity-50"
              aria-label={`Preview ${f.name}`}
            >
              <span className="flex size-8 shrink-0 items-center justify-center border bg-card">{mimeIcon(f.mimeType, f.name)}</span>
              <span className="truncate text-sm underline-offset-4 hover:underline">{f.name}</span>
              {f.status !== "confirmed" && (
                <Badge variant="outline" className="rounded-none font-mono text-[10px] uppercase">
                  {f.status}
                </Badge>
              )}
            </button>
            <span className="hidden w-[110px] shrink-0 text-xs text-muted-foreground md:block">{formatBytes(f.size)}</span>
            <span className="hidden w-[110px] shrink-0 text-xs text-muted-foreground md:block">{timeAgo(f.createdAt)}</span>
            <div className="flex w-[80px] shrink-0 items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setPreviewFile(f)}
                disabled={f.status !== "confirmed"}
                className="rounded-none"
                aria-label="Preview"
              >
                <Eye className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDownload(f)}
                disabled={downloading === f.id || f.status !== "confirmed"}
                className="rounded-none"
              >
                {downloading === f.id ? <span className="size-3 animate-spin border border-current border-t-transparent" /> : <Download className="size-4" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-xs" className="rounded-none">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="rounded-none">
                  <DropdownMenuItem onClick={() => setPreviewFile(f)} disabled={f.status !== "confirmed"}>
                    <Eye className="size-4" /> Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload(f)} disabled={f.status !== "confirmed"}>
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setPending({ type: "file", id: f.id, name: f.name })}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        {filteredFolders.length === 0 && filteredFiles.length === 0 && (
          <div className="px-3 py-10 text-center text-sm text-muted-foreground">No matches in this folder.</div>
        )}
      </div>
      <DeleteConfirmDialog pending={pending} setPending={setPending} delFolder={delFolder} delFile={delFile} />
      <FilePreviewDialog file={previewFile} open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)} />
    </>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {filteredFolders.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Folders — {filteredFolders.length}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredFolders.map((f) => (
              <Card key={f.id} className="group gap-0 rounded-none py-0 shadow-none hover:bg-muted/30">
                <CardContent className="p-0">
                  <button onClick={() => setCurrentFolder(f.id, f.name)} className="flex w-full flex-col p-3 text-left">
                    <span className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
                      <FolderIcon className="size-4" />
                    </span>
                    <span className="mt-3 truncate text-sm font-medium">{f.name}</span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {timeAgo(f.createdAt)} • Folder
                    </span>
                  </button>
                  <div className="flex justify-end border-t px-2 py-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="h-7 rounded-none text-xs"
                      onClick={() => setPending({ type: "folder", id: f.id, name: f.name })}
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Files — {filteredFiles.length}
        </h3>
        {filteredFiles.length === 0 ? (
          <Card className="rounded-none border-dashed py-10 shadow-none">
            <CardContent className="text-center">
              <div className="mx-auto flex size-10 items-center justify-center border bg-muted">
                <FileIcon className="size-5 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium">No files here</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Drag files onto the drop zone or use Upload. They’ll appear instantly after verification.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredFiles.map((f) => (
              <Card key={f.id} className="group gap-0 overflow-hidden rounded-none py-0 shadow-none">
                <CardContent className="p-0">
                  <button
                    type="button"
                    onClick={() => f.status === "confirmed" && setPreviewFile(f)}
                    className="relative flex h-[108px] w-full items-center justify-center border-b bg-muted/30 text-left hover:bg-muted/50 disabled:opacity-50"
                    disabled={f.status !== "confirmed"}
                    aria-label={`Preview ${f.name}`}
                  >
                    <span className="flex size-12 items-center justify-center border bg-card shadow-sm">{mimeIcon(f.mimeType, f.name)}</span>
                    {f.status !== "confirmed" ? (
                      <Badge variant="secondary" className="absolute left-2 top-2 rounded-none font-mono text-[10px] uppercase">
                        {f.status}
                      </Badge>
                    ) : (
                      <span className="absolute right-2 top-2 flex items-center gap-1 rounded-none border bg-card px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                        <Eye className="size-3" /> Preview
                      </span>
                    )}
                  </button>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium" title={f.name}>
                      {f.name}
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                      {formatBytes(f.size)} • {timeAgo(f.createdAt)}
                    </p>
                    <div className="mt-3 flex gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        className="flex-1 gap-1 rounded-none"
                        onClick={() => setPreviewFile(f)}
                        disabled={f.status !== "confirmed"}
                      >
                        <Eye className="size-3.5" /> Preview
                      </Button>
                      <Button
                        onClick={() => handleDownload(f)}
                        disabled={f.status !== "confirmed" || downloading === f.id}
                        size="xs"
                        className="rounded-none"
                        aria-label="Download"
                      >
                        {downloading === f.id ? <span className="size-3 animate-spin border border-current border-t-transparent" /> : <Download className="size-3.5" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-xs"
                        className="rounded-none"
                        onClick={() => setPending({ type: "file", id: f.id, name: f.name })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
      </div>
      <DeleteConfirmDialog pending={pending} setPending={setPending} delFolder={delFolder} delFile={delFile} />
      <FilePreviewDialog file={previewFile} open={!!previewFile} onOpenChange={(o) => !o && setPreviewFile(null)} />
    </>
  );
}

function DeleteConfirmDialog({
  pending,
  setPending,
  delFolder,
  delFile,
}: {
  pending: { type: "folder" | "file"; id: string; name: string } | null;
  setPending: (v: null | { type: "folder" | "file"; id: string; name: string }) => void;
  delFolder: ReturnType<typeof useDeleteFolder>;
  delFile: ReturnType<typeof useDeleteFile>;
}) {
  const open = !!pending;
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && setPending(null)}>
      <AlertDialogContent className="gap-0">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {pending?.type === "folder" ? "folder" : "file"}?</AlertDialogTitle>
          <AlertDialogDescription>
            {pending?.type === "folder"
              ? '"' + pending?.name + '" and everything inside it will be permanently deleted. This cannot be undone.'
              : '"' + pending?.name + '" will be permanently deleted. This cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6">
          <AlertDialogCancel onClick={() => setPending(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (!pending) return;
              if (pending.type === "folder") delFolder.mutate(pending.id);
              else delFile.mutate(pending.id);
              setPending(null);
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
