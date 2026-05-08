"use client";

import * as React from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "./app-sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />

        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden">
                <Menu className="size-5" />
              </SidebarTrigger>

              <div>
                <h1 className="text-base font-semibold tracking-tight md:text-lg">
                  Village Welfare Management
                </h1>

                <p className="hidden text-sm text-muted-foreground md:block">
                  Welfare & financial operations dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium">Muhammad Anas</p>

                <p className="text-xs text-muted-foreground">Branch Admin</p>
              </div>

              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                MA
              </div>
            </div>
          </header>

          <main className="min-h-[calc(100vh-4rem)] bg-background">
            <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
