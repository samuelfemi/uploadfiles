import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { Header } from "#/components/drive/Header";
import { AppSidebar } from "#/components/drive/AppSidebar";
import { Breadcrumb } from "#/components/drive/Breadcrumb";
import { DriveGrid } from "#/components/drive/DriveGrid";
import { UploadDropzone } from "#/components/drive/UploadDropzone";
import { CreateFolderDialog } from "#/components/drive/CreateFolderDialog";
import { useDriveStore } from "#/stores/driveStore";
import { useContents, useCreateFolder, useMe } from "#/hooks/useDrive";
import { api } from "#/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GoogleSignInButton } from "@/components/ui/google-signin-button";
import { Search, Loader2, FolderPlus, Upload, HardDrive } from "lucide-react";

export const Route = createFileRoute("/")({ component: DrivePage });

function DrivePage() {
  const { currentFolderId, search, setSearch } = useDriveStore();
  const { data: me, isLoading: meLoading } = useMe();
  const isAuthed = !!me;
  const { data, isLoading, isError, error, refetch, isFetching } = useContents(currentFolderId);
  const createFolder = useCreateFolder(currentFolderId);
  const [folderOpen, setFolderOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const q = search.trim().toLowerCase();
  const filteredFolders = q ? folders.filter((f) => f.name.toLowerCase().includes(q)) : folders;
  const filteredFiles = q ? files.filter((f) => f.name.toLowerCase().includes(q)) : files;

  const handleCreate = async (name: string) => {
    try {
      await createFolder.mutateAsync(name);
      setFolderOpen(false);
    } catch (e: any) {
      alert(e.message || "Failed to create folder");
    }
  };
  const triggerUpload = () => fileInputRef.current?.click();

  if (meLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-background">
        {/* minimal top bar */}
        <div className="flex h-[52px] items-center justify-between border-b px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
              <HardDrive className="size-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-widest uppercase">Drive Clone</span>
            <Badge variant="outline" className="hidden rounded-none font-mono text-[10px] uppercase tracking-widest md:inline-flex">
              Base Sera
            </Badge>
          </div>
          <GoogleSignInButton size="sm" onClick={() => (window.location.href = api.loginUrl())} aria-label="Sign in with Google" />
        </div>

        <div className="mx-auto max-w-[1160px] px-4 md:px-8">
          {/* asymmetric editorial hero */}
          <div className="grid gap-8 py-10 md:grid-cols-[1.15fr_0.85fr] md:py-16">
            <div className="pr-2">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                File manager — Go · Supabase · TanStack
              </p>
              <h1 className="mt-4 max-w-[640px] text-4xl font-semibold leading-[0.95] tracking-tight md:text-5xl">
                Your files.
                <br />
                <span className="font-normal text-muted-foreground">Simply ordered.</span>
              </h1>
              <p className="mt-5 max-w-[520px] text-sm leading-relaxed text-muted-foreground">
                A quiet, fast drive. Create nested folders, drop files up to 100MB, and keep everything in one place.
                No banners. No clutter. Just your work.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <GoogleSignInButton onClick={() => (window.location.href = api.loginUrl())}>
                  Continue with Google
                </GoogleSignInButton>
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  30s setup • Private by default
                </span>
              </div>

              <Separator className="mt-10" />
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest">Nested folders</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Unlimited depth with breadcrumb navigation.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest">Verified upload</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Init → upload → complete check.</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest">Per-account isolation</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">HttpOnly session, server-authoritative.</p>
                </div>
              </div>
            </div>

            {/* right preview — offset stacked, not centered */}
            <div className="relative">
              <Card className="rounded-none shadow-none">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2">
                    <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Preview — My Drive</span>
                    <span className="font-mono text-[11px] text-muted-foreground">3 items</span>
                  </div>
                  <div className="grid gap-0 divide-y">
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="size-8 border bg-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Projects</p>
                        <p className="font-mono text-xs text-muted-foreground">12 files · 3 folders</p>
                      </div>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="size-8 border bg-secondary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Invoices 2026</p>
                        <p className="font-mono text-xs text-muted-foreground">48 files</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto rounded-none font-mono text-[10px] uppercase">
                        Folder
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 px-3 py-3">
                      <div className="size-8 border bg-card flex items-center justify-center">
                        <Upload className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm">Vacation.zip</p>
                        <p className="font-mono text-xs text-muted-foreground">1.2 GB · Verified</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="absolute -bottom-6 -left-4 hidden w-[280px] rounded-none shadow-sm md:block">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest">Drop zone</p>
                  <p className="mt-1 text-xs text-muted-foreground">Drag files here — 100MB limit, instant progress.</p>
                  <div className="mt-3 h-1 bg-secondary">
                    <div className="h-full w-[68%] bg-primary" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Separator />
          <p className="py-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Built with shadcn/ui · Base Sera · No AI slop — sharp corners, neutral palette, content-first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar onCreateFolder={() => setFolderOpen(true)} onUpload={triggerUpload} />
      <SidebarInset className="min-w-0">
        <Header />
        <div className="p-3 md:p-4">
          <div className="relative mb-3 md:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in this folder"
              className="h-9 rounded-none pl-9"
            />
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Breadcrumb />
            <div className="flex items-center gap-2">
              <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground md:inline">
                {folders.length} folders · {files.length} files
              </span>
              {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              <Button variant="outline" size="sm" onClick={() => refetch()} className="hidden rounded-none md:inline-flex">
                Refresh
              </Button>
            </div>
          </div>

          <UploadDropzone folderId={currentFolderId} />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={async (e) => {
              const list = e.target.files;
              if (!list?.length) return;
              for (const f of Array.from(list)) {
                try {
                  const { fileId } = await api.initUpload(f.name, f.type, currentFolderId, f.size);
                  await api.uploadBytes(fileId, f);
                  await api.completeUpload(fileId);
                } catch (err: any) {
                  alert(err.message);
                }
              }
              refetch();
              e.target.value = "";
            }}
          />

          <div className="mt-4">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-[140px] animate-pulse border bg-card" />
                ))}
              </div>
            ) : isError ? (
              <Card className="rounded-none border-destructive/30 bg-destructive/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm font-medium text-destructive">Failed to load contents</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
                  <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-none">
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DriveGrid folders={folders} files={files} filteredFolders={filteredFolders} filteredFiles={filteredFiles} />
            )}
          </div>

          <div className="mt-6 flex gap-2 border-t pt-4 md:hidden">
            <Button variant="outline" onClick={() => setFolderOpen(true)} className="flex-1 rounded-none">
              <FolderPlus className="size-4" /> New folder
            </Button>
            <Button onClick={triggerUpload} className="flex-1 rounded-none">
              <Upload className="size-4" /> Upload
            </Button>
          </div>
        </div>
      </SidebarInset>

      <CreateFolderDialog open={folderOpen} onOpenChange={setFolderOpen} onCreate={handleCreate} isPending={createFolder.isPending} />
    </SidebarProvider>
  );
}
