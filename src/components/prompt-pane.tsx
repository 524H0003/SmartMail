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

const AI_PROMPT_TEMPLATE = (request: string) => `Role: Senior Email Developer.
Task: Create a Table-based HTML email template (100% Cross device compatible).

Strict Requirements:
1. Inline CSS only. No <style> tags.
2. Use my custom variable syntax: %={'FieldName':Type'DefaultValue'ColSpan}. 
   - Type 1 for short/single-line inputs.
   - No type number for long/multi-line inputs.
   - ColSpan for number of column take out of 12
3. Use 600px max-width, centered container with border-radius: 16px.
4. Images: display:block; width:100%.
5. Design: Modern, clean.

Please provide only the HTML code.\n\n${request}`;

export default function PromptPane() {
  const [prompt, setPrompt] = useState("");

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE(prompt));
      console.log("Prompt copied!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
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
                <AlertDialogFooter>
                  <AlertDialogAction variant="default" size="default">
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
