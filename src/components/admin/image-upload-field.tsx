"use client";

import Image from "next/image";
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ImagePlus, LoaderCircle, Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const maxImageSize = 5 * 1024 * 1024;
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getError(body: unknown) {
  return typeof body === "object" &&
    body !== null &&
    "error" in body &&
    typeof body.error === "string"
    ? body.error
    : "Görsel yüklenemedi. Lütfen tekrar deneyin.";
}

export function ImageUploadField({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputId = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function uploadFile(file: File) {
    setError("");
    if (!acceptedImageTypes.includes(file.type)) {
      setError("PNG, JPEG, WebP veya GIF biçiminde bir görsel seçin.");
      return;
    }
    if (file.size > maxImageSize) {
      setError("Görsel boyutu en fazla 5 MB olabilir.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/admin/uploads/image", {
        method: "POST",
        body: formData,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(getError(body));
      if (
        typeof body !== "object" ||
        body === null ||
        !("imageUrl" in body) ||
        typeof body.imageUrl !== "string"
      ) {
        throw new Error("Görsel yüklendi ancak adresi alınamadı.");
      }

      onChange(body.imageUrl);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Görsel yüklenemedi. Lütfen tekrar deneyin.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void uploadFile(file);
  }

  return (
    <div className="space-y-2">
      <input name="imageUrl" type="hidden" value={value} />
      <div
        className={`relative overflow-hidden rounded-xl border border-dashed transition ${
          dragging
            ? "border-[#a67a36] bg-[#f7f0e2]"
            : "border-[#d9cdbb] bg-[#fcfaf6]"
        }`}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {value && (
          <div className="absolute inset-0">
            <Image
              alt="Ürün görseli önizlemesi"
              className="object-cover opacity-15"
              fill
              unoptimized
              src={value}
            />
          </div>
        )}
        <div className="relative flex min-h-28 flex-col items-center justify-center gap-2 px-4 py-4 text-center">
          {uploading ? (
            <LoaderCircle className="animate-spin text-[#9a7137]" size={22} />
          ) : value ? (
            <ImagePlus className="text-[#9a7137]" size={22} />
          ) : (
            <Upload className="text-[#9a7137]" size={22} />
          )}
          <p className="text-xs font-medium text-[#514538]">
            {uploading ? "Görsel yükleniyor…" : "Görseli buraya sürükleyip bırakın"}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#807669]">
            <label
              className={`cursor-pointer underline underline-offset-2 hover:text-[#8b642f] ${
                disabled || uploading ? "pointer-events-none opacity-50" : ""
              }`}
              htmlFor={inputId}
            >
              Dosya seçin
              <input
                ref={fileInput}
                accept={acceptedImageTypes.join(",")}
                className="sr-only"
                disabled={disabled || uploading}
                id={inputId}
                onChange={handleFileChange}
                type="file"
              />
            </label>
            <span>· PNG, JPEG, WebP veya GIF · En fazla 5 MB</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          aria-label="Görsel bağlantısı"
          className="h-10 rounded-xl border-[#e8e1d6] bg-white px-3 text-xs"
          disabled={disabled || uploading}
          maxLength={2048}
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
          placeholder="İsterseniz mevcut bir görsel bağlantısı girin"
          value={value}
        />
        {value && (
          <button
            aria-label="Görseli kaldır"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e8e1d6] text-[#806233] hover:bg-[#f7f2e8]"
            disabled={disabled || uploading}
            onClick={() => {
              setError("");
              onChange("");
            }}
            type="button"
          >
            <X size={15} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-[#a63e35]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
