import { uploadMedia } from "@/lib/utils";
import { Loader2, Upload, XCircle } from "lucide-react";
import { useCallback, useId, useState } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface MediaUploadButtonProps {
  i: number;
  handleInputChange: (i: number, newValue: string) => void;
}

export function MediaUploadButton({
  i,
  handleInputChange,
}: MediaUploadButtonProps) {
  const id = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleMediaUpload = useCallback(
    async (i: number, file: File) => {
      setIsUploading(true);
      setError("");

      try {
        const publicUrl = await uploadMedia(file);
        handleInputChange(i, publicUrl);
      } catch (error) {
        console.error("Media upload failed:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to upload media file";
        setError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [handleInputChange],
  );

  return (
    <>
      <Button asChild variant="outline" disabled={isUploading}>
        <label htmlFor={id}>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleMediaUpload(i, e.target.files[0])
            }
          />
          {isUploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
        </label>
      </Button>
      {error && (
        <Badge variant="destructive">
          <XCircle className="mr-1 size-4" />
          Lỗi upload
        </Badge>
      )}
    </>
  );
}
