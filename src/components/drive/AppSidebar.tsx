import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useMe, useContents } from "#/hooks/useDrive";
import { useDriveStore } from "#/stores/driveStore";
import { Cloud, FolderPlus, Upload, HardDrive } from "lucide-react";

export function AppSidebar({
  onCreateFolder,
  onUpload,
}: {
  onCreateFolder: () => void;
  onUpload: () => void;
}) {
  const { data: me } = useMe();
  const { currentFolderId } = useDriveStore();
  const { data } = useContents(currentFolderId);
  const count = (data?.folders.length ?? 0) + (data?.files.length ?? 0);

  return (
    <Sidebar collapsible="icon" variant="inset" className="border-r">
      <SidebarHeader className="gap-0">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex size-8 items-center justify-center bg-primary text-primary-foreground">
            <Cloud className="size-4" />
          </div>
          <div className="flex flex-col leading-none group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold tracking-widest uppercase">Drive</span>
            <span className="text-[10px] tracking-widest uppercase text-muted-foreground">Clone — Sera</span>
          </div>
        </div>

        <div className="px-2 pb-2 group-data-[collapsible=icon]:px-1">
          <Button onClick={onCreateFolder} className="w-full justify-start gap-2 rounded-none h-9">
            <FolderPlus className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden text-xs font-semibold tracking-widest uppercase">
              New folder
            </span>
          </Button>
          <div className="mt-1.5 grid grid-cols-2 gap-1 group-data-[collapsible=icon]:hidden">
            <Button variant="outline" onClick={onCreateFolder} className="h-8 gap-1 rounded-none text-xs">
              <FolderPlus className="size-3.5" /> Folder
            </Button>
            <Button variant="outline" onClick={onUpload} className="h-8 gap-1 rounded-none text-xs">
              <Upload className="size-3.5" /> Upload
            </Button>
          </div>
        </div>
        <SidebarSeparator className="mx-0" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="tracking-widest">Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="My Drive">
                  <HardDrive className="size-4" />
                  <span>My Drive</span>
                  <span className="ml-auto text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                    {count}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* TODO: enable when API supports recent/starred
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Recent">
                  <Clock className="size-4" />
                  <span>Recent</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Starred">
                  <Star className="size-4" />
                  <span>Starred</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              */}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Storage</SidebarGroupLabel>
          <div className="px-3 py-2">
            <div className="h-1.5 w-full bg-secondary">
              <div className="h-full w-[32%] bg-primary" />
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {data?.files.length ?? 0} files • {data?.folders.length ?? 0} folders here
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
              Supabase • Verified
            </p>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {me ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="size-7 overflow-hidden border bg-muted flex items-center justify-center">
              {me.avatarUrl ? (
                <img src={me.avatarUrl} alt={me.name} referrerPolicy="no-referrer" className="size-full object-cover" />
              ) : (
                <span className="text-xs font-semibold">{me.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-xs font-medium leading-none">{me.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{me.email}</p>
            </div>
          </div>
        ) : (
          <div className="px-2 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Not signed in</div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
