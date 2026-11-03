const uploadedImagePath = /^\/uploads\/[a-f0-9-]+\.(?:png|jpe?g|webp|gif)$/i;

export function isValidImageUrl(value: string) {
  return (
    value === "" ||
    uploadedImagePath.test(value) ||
    /^https?:\/\/\S+$/i.test(value)
  );
}
