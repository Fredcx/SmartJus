import { Home, FolderOpen, Upload, Scale, History, MessageSquare, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Processos", url: "/cases", icon: FolderOpen },
  { title: "Upload (Rápido)", url: "/upload", icon: Upload },
  { title: "Jurisprudência", url: "/jurisprudencia", icon: Scale },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Agente IA", url: "/chat", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          {state !== "collapsed" && (
            <h2 className="text-lg font-bold text-foreground">SmartJust</h2>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4">
          <SidebarMenuButton asChild>
            <NavLink
              to="/login"
              className="hover:bg-muted/50"
              activeClassName="bg-muted text-destructive font-medium"
            >
              <LogOut className="h-4 w-4" />
              {state !== "collapsed" && <span>Sair</span>}
            </NavLink>
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
