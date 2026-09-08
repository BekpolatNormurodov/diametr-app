import React, { useRef, useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";

const ACCEPTED_FORMATS = "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/bmp";
const ACCEPTED_EXT = ".jpg,.jpeg,.png,.webp,.gif,.svg,.bmp";

interface ImageFieldResult {
  file?: File;
  url?: string;
  mode: "upload" | "url";
}

interface ImageFieldProps {
  label?: string;
  existingUrl?: string;
  onChange: (result: ImageFieldResult) => void;
}

export default function ImageField({ label = "Rasm", existingUrl, onChange }: ImageFieldProps) {
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [urlValue, setUrlValue] = useState(existingUrl ?? "");
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleModeChange = (m: "upload" | "url") => {
    setMode(m);
    onChange({ mode: m });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    onChange({ file, mode: "upload" });
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setUrlValue(v);
    setPreview(v);
    onChange({ url: v, mode: "url" });
  };

  return (
    <div>
      <Label>{label}</Label>

      {/* Toggle */}
      <div className="flex gap-1 mb-3 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit">
        {(["upload", "url"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              mode === m
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
            }`}
          >
            {m === "upload" ? "📁 Yuklash" : "🔗 URL"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-medium
              file:bg-brand-50 file:text-brand-700
              hover:file:bg-brand-100
              dark:file:bg-white/10 dark:file:text-white"
          />
          <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP, GIF, SVG, BMP ruxsat etilgan</p>
        </div>
      ) : (
        <div>
          <Input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlValue}
            onChange={handleUrlChange}
          />
          <p className="mt-1 text-xs text-gray-400">
            URL kiritilsa, backend rasm yuklab olib PNG da saqlaydi
          </p>
        </div>
      )}

      {/* Preview */}
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
  );
}

export type { ImageFieldResult };
