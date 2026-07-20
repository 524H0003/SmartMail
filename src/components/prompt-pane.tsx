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

  3. Custom Variable Syntax (Mandatory): Every dynamic, editable, or changeable
     element MUST use this EXACT format:
     %={FieldName|Type|DefaultValue|ColSpan}. No other placeholders are allowed.
     - FieldName: Vietnamese with spaces (e.g., "Tiêu đề chính").
     - Type:
       - "1" for standard text input (single-line text).
       - "2" for URLs/Paths (Crucial for post-processing, button links, and
         paths).
       - "3" for rich text editing with formatting options (will use Tiptap
         editor).
       - "4" for media file URLs (images, videos, audio files).
       - Empty (blank) for textarea/multiline text.
     - DefaultValue: The initial content, hex color, or image URL.
     - ColSpan: A number from 1 to 12.
     - REQUIREMENT: You MUST use this syntax for every single text string, image
       source, button link, color value, or block of content that a user might
       want to change later.

  Examples:

  - Standard input: <input class="field-single" type="text"
    value="%={Họ tên|1|Nguyễn Văn A|6}" />
  - URL/Link:
    <a href="%={Đường dẫn nút|2|https://example.com|12}" style="...">Nút</a>
  - Rich text: <div class="field-text">%={Nội dung chi tiết|3|<p>Nội
    dung...</p>|12}</div>
  - Media: <img src="%={Ảnh bìa|4|https://real-image-url.com/img.jpg|12}" />
  - Textarea: <textarea class="field-multi">%={Ghi chú|_|Nội dung ghi
    chú|12</textarea>
  - Button fields: <button href="%={Link nút|2|https://example.com|12}"> %={Tên
    nút|1|Gửi ngay|6</button>
  - Image fields:
    <img src="%={Ảnh chính|4|https://real-image.com/banner.jpg|12}" />

  Design Requirements:

  - **Commenting for AI Refinement (Crucial):** Include descriptive HTML
    comments throughout the code to help an AI identify structural sections and
    variable locations. Example: '<!-- Section: Header -->',
    '<!-- Variable: Main Title -->', '<!-- End Section: Footer -->'. Always wrap
    the custom variable syntax with comments to make it easy to locate, e.g.,
    '<!-- Variable: Button Link --> <a href="%={...}">...</a>
    <!-- End Variable -->'.
  - **Color Scheme:** ALWAYS follow the color palette provided in the attached
    reference image.
  - **Fixed Colors / Prevent Dark Mode Override (Crucial):** The template must
    maintain fixed light-themed colors (based on the reference image) and not be
    affected or inverted by device/email client auto-dark modes (e.g., Gmail,
    Apple Mail, Outlook). To prevent dark mode color inversion:
    1. Add the following meta tags inside the '<head>' of the HTML:
       '<meta name="color-scheme" content="light">'
       '<meta name="supported-color-schemes" content="light">'
    2. Add the following style block to the head or container: '<style> :root {
       color-scheme: light; supported-color-schemes: light; } @media
       (prefers-color-scheme: dark) { body, table, td, p, span, a, h1, h2, h3 {
       color: #333333 !important; } } </style>'
    3. Explicitly define solid, non-transparent background colors on every
       table, row, and table cell.
  - No <title /> tag.
  - Modern, clean, professional aesthetic.
  - **Email Brief/Preview Text:** Include a hidden or subtly styled "preheader"
    or "preview text" at the very top of the HTML (before the header). Use the
    custom variable syntax for the content:
    <span style="display:none; max-height:0px;
    overflow:hidden;">%={Email Brief|1|Xem nội dung tại đây|12}</span>.
  - **For every button, provide two separate editable fields:**
    1. Text content (Type 1) - What users see on the button
    2. URL (Type 2) - The link destination (http:// or https://)
  - **For images**, ALWAYS use Type "4" in the variable syntax:
    <img src="%={Ảnh|4|https://real-image-url.com/img.jpg|12}" />
  - All colors, links, text, images must be editable via the syntax above.
  - Support for "Rich Text" sections within multi-line fields using Type 3.
  - URL fields (Type 2) should handle both http:// and https:// URLs.
  - For media upload functionality, Type 4 fields will support file uploads.

  IMPORTANT: Return ONLY raw HTML code. No explanations.
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
