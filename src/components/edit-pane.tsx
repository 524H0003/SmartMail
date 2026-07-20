import {
  type PlaceholderItem,
  copyMailToClipboard,
  copyShareUrl,
  extractPlaceholders,
  formatHTML,
  getSavedValues,
  minifyHTML,
} from "@/lib/utils";
import { Eye, Share } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

import { MediaUploadButton } from "./media-upload-button";
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
    await copyMailToClipboard(mailHtml);
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

        return (
          <Field className={`col-span-${item.colSpan} min-w-0`} key={i}>
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

                <MediaUploadButton
                  i={i}
                  handleInputChange={handleInputChange}
                />
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
          {fields}
          {editHtml && (
            <Field className="col-span-12 min-w-0">
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
            })
          }
        >
          <Share />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
