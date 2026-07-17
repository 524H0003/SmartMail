import {
  type PlaceholderItem,
  copyMailToClipboard,
  copyShareUrl,
  extractPlaceholders,
  formatHTML,
  getSavedValues,
  minifyHTML,
  uploadMedia,
} from "@/lib/utils";
import { Eye, Share, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

import { TiptapEditor } from "./tiptap-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import { CardContent } from "./ui/card";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
import {
  Sidebar,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  useSidebar,
} from "./ui/sidebar";
import { Textarea } from "./ui/textarea";

export interface EditPaneProps {
  onMailHtmlChange: (mailHtml: string) => void;
  mailTemplate: string;
  editHtml: boolean;
}

export default function EditPane({
  onMailHtmlChange,
  editHtml,
  mailTemplate,
}: EditPaneProps) {
  const [mailHtml, setMailHtml] = useState(""),
    [placeholders, setPlaceholders] = useState<PlaceholderItem[]>([]),
    [htmlCode, setHtmlCode] = useState(""),
    [apiToken, setApiToken] = useState(""),
    { pathname } = useLocation(),
    [isOpenAlert, setOpenAlert] = useState(false),
    { toggleSidebar } = useSidebar();

  const parsePlaceholders = useCallback((text: string) => {
    const savedValues = getSavedValues();

    setPlaceholders((prevPlaceholders) => {
      const currentValuesMap = new Map(
        prevPlaceholders.map((p) => [p.fieldName, p.currentValue]),
      );
      return extractPlaceholders(text, currentValuesMap, savedValues);
    });
  }, []);

  const copyToClipboard = async () => {
    await copyMailToClipboard(mailHtml, apiToken);
    setOpenAlert(true);
  };

  const handleInputChange = useCallback(
    (i: number, newValue: string) => {
      const output = [...placeholders];
      output[i].currentValue = newValue;
      setPlaceholders(output);
    },
    [placeholders],
  );

  const handleMediaUpload = useCallback(
    async (i: number, file: File) => {
      try {
        const publicUrl = await uploadMedia(file);
        handleInputChange(i, publicUrl);
      } catch (error) {
        console.error("Media upload failed:", error);
        alert("Failed to upload media file");
      }
    },
    [handleInputChange],
  );

  const fields = useMemo(
    () =>
      placeholders.map((item, i) => {
        type AcceptElements = HTMLInputElement | HTMLTextAreaElement;

        const commonProps = {
          id: `input-${i}`,
          placeholder: item.defaultValue.replace(/\s+/g, " "),
          value: item.currentValue,
          onChange: (e: React.ChangeEvent<AcceptElements>) =>
            handleInputChange(i, e.target.value),
        };

        const id = `media-file-input-${i}`;

        return (
          <Field
            className={`col-span-${item.colSpan} min-w-0 justify-between`}
            key={i}
          >
            <FieldLabel htmlFor={"input-" + i}>{item.fieldName}</FieldLabel>
            {item.type === "single" && <Input {...commonProps} />}
            {item.type === "multi" && (
              <Textarea className="resize-y" {...commonProps} />
            )}
            {item.type === "text" && (
              <TiptapEditor
                value={item.currentValue}
                onChange={(value) => handleInputChange(i, value)}
              />
            )}
            {item.type === "media" && (
              <ButtonGroup>
                <Input {...commonProps} />
                <Button asChild variant="outline">
                  <label htmlFor={id}>
                    <input
                      id={id}
                      type="file"
                      accept="image/*,video/*,audio/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleMediaUpload(i, e.target.files[0])
                      }
                    />
                    <Upload className="size-4" />
                  </label>
                </Button>
              </ButtonGroup>
            )}
          </Field>
        );
      }),
    [handleInputChange, placeholders],
  );

  useEffect(() => {
    let updatedHtml = minifyHTML(htmlCode);
    Object.values(placeholders).forEach((item) => {
      updatedHtml = updatedHtml.replaceAll(item.original, item.currentValue);
    });

    setMailHtml(updatedHtml);

    onMailHtmlChange(updatedHtml);
  }, [placeholders, onMailHtmlChange, htmlCode]);

  useEffect(() => {
    const template = formatHTML(mailTemplate);
    setHtmlCode(template);

    parsePlaceholders(mailTemplate);
  }, [mailTemplate, parsePlaceholders]);

  useEffect(() => {
    parsePlaceholders(minifyHTML(htmlCode));
  }, [htmlCode, parsePlaceholders]);

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center justify-between">
        <h1 className="text-lg font-semibold">Chỉnh sửa nội dung</h1>
        <SidebarMenuButton asChild>
          <Button className="w-fit md:hidden" onClick={toggleSidebar}>
            <Eye className="mr-2 size-4" />
            Xem trước
          </Button>
        </SidebarMenuButton>
      </SidebarHeader>
      <CardContent className="overflow-y-auto">
        <FieldGroup className="grid gap-4">
          <Field className="col-span-12 justify-between">
            <FieldLabel htmlFor="apiToken">Shlink API Token</FieldLabel>
            <Input
              id="apiToken"
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Nhập API Token của Shlink"
            />
          </Field>
          {fields}
          {editHtml && (
            <Field className="col-span-12 min-w-0 justify-between">
              <FieldLabel htmlFor="editHtml">Mã html</FieldLabel>
              <Textarea
                wrap="off"
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="max-h-64"
              />
            </Field>
          )}
        </FieldGroup>
      </CardContent>
      <SidebarFooter className="flex flex-row">
        <AlertDialog open={isOpenAlert} onOpenChange={setOpenAlert}>
          <Button
            onClick={copyToClipboard}
            className="flex-1"
            variant="outline"
          >
            Sao chép nội dung email
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Đã sao chép nội dung vào clipboard
              </AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng mở email và dán nội dung
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction variant="default" size="default">
                Tiếp tục
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          size="icon"
          aria-label="Submit"
          onClick={() =>
            copyShareUrl({
              placeholders,
              html: pathname.split("/")[2] === "" ? htmlCode : undefined,
              apiToken,
            })
          }
        >
          <Share />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
