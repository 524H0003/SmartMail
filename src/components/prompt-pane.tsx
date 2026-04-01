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
     - Container: 600px max-width, centered, border-radius: 16px.
     - Images: display:block; border:0; width:100%; height:auto.
     - **Constraint: DO NOT use placeholder services (like Placehold.it or
       Unsplash Source). Use high-quality, contextually relevant REAL images
       from stable CDNs or descriptive stock photo URLs.**

  3. Custom Variable Syntax (Crucial): Every dynamic element must follow this
     EXACT format: %={FieldName|Type|DefaultValue|ColSpan}
     - FieldName: Vietnamese with spaces (e.g., "Tiêu đề chính").
     - Type:
       - "1" for standard input.
       - "2" for URLs/Links/Paths (Crucial for post-processing).
       - Empty (blank) for textarea/multiline.
     - DefaultValue: The initial content, hex color, or image URL.
     - ColSpan: A number from 1 to 12.

  Example:
  <a href="%={Đường dẫn nút|2|https://example.com|12}" style="...">...</a>

  Design Requirements:

  - No <title /> tag.
  - Modern, clean, professional aesthetic.
  - All colors, images, and links must be editable via the syntax above.
  - For image sources, use Type "2" in the variable syntax:
    <img src="%={Ảnh bìa|2|https://real-image-url.com/img.jpg|12}" />.
  - Support for "Rich Text" sections within multi-line fields.
  - For every button, provide separate editable fields for the text (Type 1) and
    the URL (Type 2).

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
