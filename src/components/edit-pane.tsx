import {
  type PlaceholderItem,
  type TypeValue,
  copyShareUrl,
  minifyHTML,
  urlShortener,
} from "@/lib/utils";
import { html as beautifyHtml } from "js-beautify";
import { Eye, Share } from "lucide-react";
import { decompressFromEncodedURIComponent } from "lz-string";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { CardContent } from "./ui/card";
import { FieldGroup } from "./ui/field";
import { Field, FieldLabel } from "./ui/field";
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
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("ph") || params.get("data");
    const savedValues = encodedData
      ? JSON.parse(decompressFromEncodedURIComponent(encodedData))
      : null;

    const regex = /%={([\s\S]+?)\|([\s\S]*?)\|([\s\S]*?)\|(\d+)}/g;

    const resultMap = new Map<string, PlaceholderItem>();
    let match: RegExpExecArray | null;

    setPlaceholders((prevPlaceholders) => {
      const currentValuesMap = new Map(
        prevPlaceholders.map((p) => [p.fieldName, p.currentValue]),
      );

      while ((match = regex.exec(text)) !== null) {
        const fieldName = match[1];
        const tag = match[2];
        const defaultValue = match[3];
        const colSpan = Number(match[4]) || 12;

        if (!resultMap.has(fieldName)) {
          let type: TypeValue = "multi";
          if (tag === "1") type = "single";

          const valueToKeep =
            currentValuesMap.get(fieldName) ??
            savedValues?.[fieldName] ??
            defaultValue;

          resultMap.set(fieldName, {
            fieldName,
            type,
            colSpan,
            original: match[0],
            defaultValue,
            currentValue: valueToKeep,
          });
        }
      }
      return Array.from(resultMap.values());
    });
  }, []);

  const copyToClipboard = async () => {
    let finalHtml = mailHtml;

    try {
      // 1. Tìm tất cả các link (href) và src của ảnh nếu cần rút gọn
      // Regex này tìm các chuỗi nằm trong href="..." hoặc src="..."
      const urlRegex =
        // eslint-disable-next-line max-len
        /(?:href|src|background)="([^"]+)"|url\((?:&quot;|['"]?)([^&'")]+)(?:&quot;|['"]?)\)/g;
      const matches = [...mailHtml.matchAll(urlRegex)];

      // Lọc ra danh sách URL duy nhất để tránh gọi API trùng lặp
      const uniqueUrls = [...new Set(matches.map((m) => m[1]))];

      // 2. Tạo một Map để lưu trữ kết quả rút gọn
      const urlMap = new Map();

      // 3. Gọi API rút gọn cho từng URL (Chạy song song để tối ưu tốc độ)
      await Promise.all(
        uniqueUrls.map(async (url) => {
          try {
            urlMap.set(url, await urlShortener(url));
          } catch (e) {
            console.error(`Không thể rút gọn link: ${url}`, e);
          }
        }),
      );

      // 4. Thay thế các URL cũ bằng URL mới trong HTML
      urlMap.forEach((shortUrl, longUrl) => {
        // Thay thế tất cả các lần xuất hiện của longUrl
        finalHtml = finalHtml.split(longUrl).join(shortUrl);
      });
    } catch (err) {
      console.error("Lỗi khi xử lý link hoặc copy: ", err);
    } finally {
      const blob = new Blob([finalHtml], { type: "text/html" });

      const data = [
        new ClipboardItem({
          "text/html": blob,
          "text/plain": new Blob([finalHtml], { type: "text/plain" }),
        }),
      ];

      await navigator.clipboard.write(data);
    }

    setOpenAlert(true);
  };

  const handleInputChange = useCallback(
    (i: number, newValue: string) => {
      const output = Array.from(placeholders);
      output[i].currentValue = newValue;
      setPlaceholders(output);
    },
    [placeholders],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>,
      index: number,
    ) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const key = e.key.toLowerCase();
      const tagMap: Record<string, string> = {
        b: "strong",
        i: "em",
        u: "u",
      };

      const tag = tagMap[key];
      if (!tag) return; // Nếu không phải b, i, u thì bỏ qua

      e.preventDefault();

      const target = e.currentTarget;
      const { selectionStart: start, selectionEnd: end, value } = target;

      if (!start || !end) return;

      // Lấy đoạn text đang bôi đen
      const selectedText = value.substring(start, end);

      // Tạo nội dung mới
      const openTag = `<${tag}>`;
      const closeTag = `</${tag}>`;

      const newValue =
        value.substring(0, start) +
        openTag +
        selectedText +
        closeTag +
        value.substring(end);

      // Cập nhật state thông qua hàm handleInputChange của bạn
      handleInputChange(index, newValue);

      // Đặt lại vị trí con trỏ sau khi React render xong
      requestAnimationFrame(() => {
        target.focus();
        target.setSelectionRange(start + openTag.length, end + openTag.length);
      });
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
          value: item.currentValue.replace(/\s+/g, " "),
          onChange: (e: React.ChangeEvent<AcceptElements>) =>
            handleInputChange(i, e.target.value),
          onKeyDown: (e: React.KeyboardEvent<AcceptElements>) =>
            handleKeyDown(e, i),
        };

        return (
          <Field className={`col-span-${item.colSpan} justify-between`} key={i}>
            <FieldLabel htmlFor={"input-" + i}>{item.fieldName}</FieldLabel>
            {item.type == "single" && <Input {...commonProps} />}
            {item.type == "multi" && (
              <Textarea className="resize-y" {...commonProps} />
            )}
          </Field>
        );
      }),
    [handleInputChange, handleKeyDown, placeholders],
  );

  useEffect(() => {
    let updatedHtml = minifyHTML(htmlCode);
    Object.values(placeholders).forEach((item) => {
      updatedHtml = updatedHtml.replaceAll(item.original, item.currentValue);
    });

    setMailHtml(updatedHtml);

    onMailHtmlChange(updatedHtml);
  }, [placeholders, onMailHtmlChange, htmlCode]);

  const formatHTML = (html: string): string => {
    return beautifyHtml(html, {
      indent_size: 2,
      indent_char: " ",
      max_preserve_newlines: 1,
      preserve_newlines: true,
      indent_scripts: "normal",
      end_with_newline: false,
      wrap_line_length: 80,
      indent_inner_html: true,
      indent_empty_lines: false,
    });
  };

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
            <Field className={`col-span-12 min-w-0 justify-between`}>
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
              html: pathname.split("/")[2] == "" ? htmlCode : undefined,
            })
          }
        >
          <Share />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
