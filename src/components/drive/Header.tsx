import * as React from "react";
import { Search, LogOut, Cloud, Grid3X3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { GoogleSignInButton } from "@/components/ui/google-signin-button";
import { useMe } from "#/hooks/useDrive";
import { api } from "#/lib/api";
import { useDriveStore } from "#/stores/driveStore";

export function Header() {
  const { data: me, isLoading: meLoading } = useMe();
  const { search, setSearch, view, setView } = useDriveStore();

  return (
    <header className="sticky top-0 z-10 flex h-[52px] items-center gap-3 border-b bg-background/80 px-3 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-4">
      <SidebarTrigger className="shrink-0" />
      <div className="hidden items-center gap-2 md:flex">
        <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
          <Cloud className="size-3.5" />
        </div>
        <span className="text-xs font-semibold tracking-widest uppercase">Drive</span>
        <span className="hidden border px-1.5 py-0.5 font-mono text-[10px] tracking-widest uppercase text-muted-foreground sm:inline-flex">
          Sera
        </span>
      </div>

      <div className="mx-2 hidden flex-1 justify-center md:flex">
        <div className="relative w-full max-w-[560px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in this folder — name, type"
            className="h-8 rounded-none pl-9 text-sm"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <div className="hidden items-center border p-0.5 md:flex">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="Grid view"
            onClick={() => setView("grid")}
            className="rounded-none"
          >
            <Grid3X3 className="size-3.5" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon-xs"
            aria-label="List view"
            onClick={() => setView("list")}
            className="rounded-none"
          >
            <List className="size-3.5" />
          </Button>
        </div>

        {meLoading ? (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ) : !me ? (
          <GoogleSignInButton size="sm" onClick={() => (window.location.href = api.loginUrl())} aria-label="Sign in with Google" />
        ) : (
          <div className="flex items-center gap-2">
            {/* shadcn avatar replaced with plain img to ensure Google image shows */}
            <div className="size-7 overflow-hidden border bg-muted flex items-center justify-center">
              {me.avatarUrl ? (
                // plain img ensures referrer and cross-origin handled; base-ui Avatar fallback was hiding image
                <img
                  src={me.avatarUrl}
                  alt={me.name}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
              {!me.avatarUrl && <span className="text-xs font-medium">{me.name.charAt(0).toUpperCase()}</span>}
            </div>
            <span className="hidden text-left md:block">
              <span className="block text-xs font-medium leading-none">{me.name}</span>
              <span className="block text-[11px] leading-none text-muted-foreground">{me.email}</span>
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              className="rounded-none"
              aria-label="Log out"
              title="Log out"
              onClick={async () => {
                await api.logout().catch(() => {});
                window.location.href = "/";
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
