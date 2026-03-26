import { minifyHTML } from "@/lib/utils";
import { compressToEncodedURIComponent } from "lz-string";
import { useState } from "react";

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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "./ui/sidebar";
import { Textarea } from "./ui/textarea";

const AI_PROMPT_TEMPLATE = (request: string) => /* tx */ `
  Role: Expert Email Developer specializing in Outlook-safe HTML. Task: Generate
  a high-quality, table-based HTML email template based on the following
  request: "${request.trim()}"

  Technical Architecture:

  1. Layout: Use 100% table-based layouts (nested tables). Avoid <div> for
     structural positioning to ensure 100% Cross-Device/Outlook compatibility.
  2. Styling:

  - Use strictly Inline CSS.
  - Container: 600px max-width, centered, border-radius: 16px (include Outlook
    VML fallback if possible, otherwise standard inline-style).
  - Images: display:block; border:0; width:100%; height:auto.

  3. Custom Variable Syntax (Crucial): Every dynamic element must follow this
     EXACT format: %={FieldName|Type|DefaultValue|ColSpan}

  - FieldName: Vietnamese with spaces (e.g., "Tiêu đề chính").
  - Type: "1" for input, empty for textarea.
  - DefaultValue: The initial content, hex color, or image URL.
  - ColSpan: A number from 1 to 12 for grid 12 columns.

  Example: <td bgcolor="%={Màu nền|1|#f0f0f0|4}">...</td>

  Design Requirements:

  - Modern, clean, professional aesthetic.
  - High contrast and readability.
  - All colors and background images must be editable via the syntax above.
  - Support for "Rich Text" sections (bold/italic) within the multi-line fields.
  - For every button or call-to-action, you MUST provide separate editable
    fields.

  No explain, just code
`;

export default function PromptPane() {
  const [prompt, setPrompt] = useState(""),
    [htmlTemplate, setHtmlTemplate] = useState("");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE(prompt));
      console.log("Prompt copied!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const sendPrompt = () => {
    if (!htmlTemplate.trim()) {
      alert("Vui lòng dán mã HTML từ AI vào ô nhập liệu!");
      return;
    }

    const currentPath = window.location.pathname;
    const newUrl = /* tx */ `
      ${currentPath}?html=${compressToEncodedURIComponent(
        minifyHTML(htmlTemplate),
      )}
    `;

    window.location.href = newUrl;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <h1 className="text-lg font-semibold">Tạo mail đẹp</h1>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <div className="m-4 h-full">
          <Textarea
            className="h-full"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></Textarea>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={copyPrompt}
                >
                  Sao chép câu lệnh cho AI
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Đã sao chép nội dung vào clipboard
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Vui lòng mở ChatGPT hoặc Gemini, dán câu lệnh và sao chép
                    kết quả vào ô dưới
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea
                  className="max-h-64"
                  value={htmlTemplate}
                  onChange={(e) => setHtmlTemplate(e.target.value)}
                ></Textarea>
                <AlertDialogFooter>
                  <AlertDialogAction
                    variant="default"
                    size="default"
                    onClick={sendPrompt}
                  >
                    Tiếp tục
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
