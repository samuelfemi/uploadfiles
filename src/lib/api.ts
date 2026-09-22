// native fetch api client - no axios
// SAFETY: Vite injects VITE_API_URL as string at build time if defined; undefined fallback is intentional for local dev.
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8080";

function url(path: string) {
  // if path starts with / and API_BASE has no trailing slash
  return `${API_BASE.replace(/\/$/, "")}${path}`;
}

async function handleJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = text || res.statusText;
    try {
      const j = JSON.parse(text);
      msg = j.error || j.message || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) {
    // SAFETY: 204 No Content has no body; undefined is the only valid T for callers that expect void.
    return undefined as T;
  }
  // SAFETY: JSON is decoded at the I/O boundary; caller provides T as the expected contract for this endpoint.
  return res.json() as Promise<T>;
}

// Types match Go models
export type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
};

export type FileItem = {
  id: string;
  folderId: string | null;
  name: string;
  size: number;
  mimeType: string;
  status: string;
  createdAt: string;
};

export type Contents = {
  folders: Folder[];
  files: FileItem[];
};

export type Me = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
};

export const api = {
  async me(): Promise<Me | null> {
    const res = await fetch(url("/auth/me"), {
      credentials: "include",
    });
    if (res.status === 401) return null;
    return handleJson<Me>(res);
  },

  async logout(): Promise<void> {
    const res = await fetch(url("/auth/logout"), {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) {
      const t = await res.text();
      throw new Error(t || "logout failed");
    }
  },

  loginUrl(): string {
    return url("/auth/google/login");
  },

  async listContents(folderId: string | null): Promise<Contents> {
    const path = folderId ? `/folders/${folderId}/contents` : "/folders/contents";
    const res = await fetch(url(path), { credentials: "include" });
    const data = await handleJson<Contents>(res);
    // ensure arrays
    return {
      folders: data.folders ?? [],
      files: data.files ?? [],
    };
  },

  async createFolder(name: string, parentId: string | null): Promise<Folder> {
    const res = await fetch(url("/folders"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId: parentId || null }),
    });
    return handleJson<Folder>(res);
  },

  async deleteFolder(id: string): Promise<void> {
    const res = await fetch(url(`/folders/${id}`), {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) {
      const t = await res.text();
      throw new Error(t || "delete folder failed");
    }
  },

  async initUpload(name: string, mimeType: string, folderId: string | null, size?: number) {
    const res = await fetch(url("/files/init"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: mimeType || "application/octet-stream", folderId: folderId || null, size }),
    });
    return handleJson<{ fileId: string; storageKey: string }>(res);
  },

  async uploadBytes(fileId: string, file: File): Promise<void> {
    const res = await fetch(url(`/files/${fileId}/upload`), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || "upload failed");
    }
  },

  async completeUpload(fileId: string): Promise<FileItem> {
    const res = await fetch(url(`/files/${fileId}/complete`), {
      method: "POST",
      credentials: "include",
    });
    return handleJson<FileItem>(res);
  },

  /** high-level upload helper: init -> upload bytes -> complete */
  async uploadFile(file: File, folderId: string | null, onProgress?: (pct: number) => void): Promise<FileItem> {
    const { fileId } = await this.initUpload(file.name, file.type, folderId, file.size);
    onProgress?.(30);
    await this.uploadBytes(fileId, file);
    onProgress?.(70);
    const confirmed = await this.completeUpload(fileId);
    onProgress?.(100);
    return confirmed;
  },

  async deleteFile(id: string): Promise<void> {
    const res = await fetch(url(`/files/${id}`), {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok && res.status !== 204) {
      const t = await res.text();
      throw new Error(t || "delete file failed");
    }
  },

  async fetchFileBlob(id: string): Promise<Blob> {
    const res = await fetch(url(`/files/${id}/download`), {
      credentials: "include",
    });
    if (!res.ok) {
      const t = await res.text().catch(() => res.statusText);
      throw new Error(t || "fetch failed");
    }
    return res.blob();
  },

  // download triggers browser save; returns blob URL
  async downloadFile(id: string, filename: string): Promise<void> {
    const blob = await this.fetchFileBlob(id);
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  },
};
