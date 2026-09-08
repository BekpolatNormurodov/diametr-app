import React, { useRef, useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";

const ACCEPTED_FORMATS = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp";

interface ImageFieldResult {
  file?: File;
  url?: string;
  mode: "upload" | "url";
  /** A displayable URL (object URL, entered URL, or existing image) for live preview. */
  previewUrl?: string;
}

interface ImageFieldProps {
  label?: string;
  existingUrl?: string;
  onChange: (result: ImageFieldResult) => void;
  // When false, only the upload tab is shown. Ads/News store the filename in the
  // image column and serve it from /static/<folder>/; an absolute URL there
  // yields a permanently broken banner, so those callers disable URL mode.
  allowUrl?: boolean;
}

export default function ImageField({ label = "Rasm", existingUrl, onChange, allowUrl = true }: ImageFieldProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlValue, setUrlValue] = useState(existingUrl ?? "");
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (m: "upload" | "url") => {
    setMode(m);
    onChange({ mode: m });
  };

  const acceptFile = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setFileName(file.name);
    onChange({ file, mode: "upload", previewUrl: objectUrl });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) acceptFile(file);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUrlValue(v);
    setPreview(v);
    onChange({ url: v, mode: "url", previewUrl: v });
  };

  const clearImage = () => {
    setPreview(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
    onChange({ mode, previewUrl: undefined });
  };

  return (
    <div>
      <Label>{label}</Label>

      {/* Toggle (hidden when URL mode is disabled) */}
      {allowUrl && (
      <div className="inline-flex gap-1 mb-3 p-1 bg-gray-100 dark:bg-white/[0.06] rounded-xl">
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              mode === m
                ? "bg-white dark:bg-gray-800 text-brand-600 dark:text-brand-400 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {m === "upload" ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                </svg>
                Yuklash
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
                </svg>
                URL
              </>
            )}
          </button>
        ))}
      </div>
      )}

      {mode === "upload" ? (
        preview ? (
          /* Selected image card */
          <div className="flex items-center gap-4 p-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
            <img
              src={preview}
              alt="Preview"
              className="h-20 w-20 shrink-0 object-cover rounded-xl border border-gray-200 dark:border-white/10"
              onError={() => setPreview(null)}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                {fileName ?? "Tanlangan rasm"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Rasm tayyor</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
                >
                  O'zgartirish
                </button>
                <span className="text-gray-300 dark:text-white/20">•</span>
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  O'chirish
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Dropzone */
          <div
            role="button"
            tabIndex={0}
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center gap-2 px-4 py-7 rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${
              dragOver
                ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10"
                : "border-gray-300 dark:border-white/15 hover:border-brand-400 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-brand-600 dark:text-brand-400">Rasm tanlang</span> yoki bu yerga tashlang
            </p>
            <p className="text-xs text-gray-400">JPG, PNG, WebP, GIF, SVG, BMP</p>
          </div>
        )
      ) : (
        <div>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlValue}
            onChange={handleUrlChange}
          />
          <p className="mt-1.5 text-xs text-gray-400">
            URL kiritilsa, backend rasmni yuklab olib saqlaydi
          </p>
          {preview && (
            <div className="mt-3">
              <img
                src={preview}
                alt="Preview"
                className="h-24 w-24 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                onError={() => setPreview(null)}
              />
            </div>
          )}
        </div>
      )}

      {/* Hidden native input, driven by the dropzone / buttons above */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_FORMATS}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

export type { ImageFieldResult };
