import { Edit } from "lucide-react";

import { Button } from "./button";
import { useSidebar } from "./sidebar";

export default function SidebarHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="fixed top-0 m-2 flex h-10 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <Button className="md:hidden" onClick={toggleSidebar}>
        <Edit className="mr-2 size-4" />
        Chỉnh sửa
      </Button>
    </header>
  );
}
