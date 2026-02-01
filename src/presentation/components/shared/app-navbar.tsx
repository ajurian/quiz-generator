"use client";

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/presentation/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/presentation/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/presentation/components/ui/sheet";
import {
  Brain,
  Home,
  LogOut,
  Settings,
  User,
  Sparkles,
  FileText,
  History,
  Compass,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "@/presentation/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";

export interface NavUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface AppNavbarProps {
  /**
   * The current user session. If null, shows sign-in button.
   */
  user?: NavUser | null;
  /**
   * Variant of the navbar:
   * - "default": Shows Explore, Dashboard/Sign In, Create Quiz
   * - "dashboard": Shows full dashboard navigation with Overview, Created, Taken, Explore
   */
  variant?: "default" | "dashboard";
  /**
   * Whether to show the dashboard navigation tabs (only applies to dashboard variant)
   */
  showDashboardTabs?: boolean;
}

const NAV_LINK_BASE =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

const MOBILE_NAV_LINK_BASE =
  "flex items-center gap-3 px-3 py-3 text-sm font-medium transition-colors";

export function AppNavbar({
  user,
  variant = "default",
  showDashboardTabs = true,
}: AppNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthenticated = !!user;
  const isDashboard = variant === "dashboard";

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.slice(0, 2).toUpperCase() ?? "U");

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 w-full items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <span className="font-display font-semibold tracking-tight">
              Quiz Generator
            </span>
          </Link>

          {/* Desktop Navigation */}
          {isDashboard && showDashboardTabs && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/dashboard"
                activeOptions={{ exact: true }}
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className={NAV_LINK_BASE}
              >
                <Home className="h-4 w-4" />
                Overview
              </Link>
              <Link
                to="/dashboard/created"
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className={NAV_LINK_BASE}
              >
                <FileText className="h-4 w-4" />
                Created
              </Link>
              <Link
                to="/dashboard/taken"
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className={NAV_LINK_BASE}
              >
                <History className="h-4 w-4" />
                Taken
              </Link>
              <Link
                to="/explore"
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className={NAV_LINK_BASE}
              >
                <Compass className="h-4 w-4" />
                Explore
              </Link>
            </nav>
          )}

          {/* Default variant desktop nav links */}
          {!isDashboard && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                to="/explore"
                activeProps={{ className: "text-foreground bg-muted" }}
                inactiveProps={{
                  className:
                    "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                }}
                className={NAV_LINK_BASE}
              >
                <Compass className="h-4 w-4" />
                Explore
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  activeProps={{ className: "text-foreground bg-muted" }}
                  inactiveProps={{
                    className:
                      "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  }}
                  className={NAV_LINK_BASE}
                >
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : null}
            </nav>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {!isAuthenticated && !isDashboard && (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth/signin">Sign In</Link>
              </Button>
            )}

            <Button asChild size="sm" className="glow-primary">
              <Link to="/quiz/new">
                <Sparkles className="mr-2 h-4 w-4" />
                Create Quiz
              </Link>
            </Button>

            <ThemeToggle />

            {/* User Menu (authenticated only) */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full ring-2 ring-border hover:ring-primary/50 transition-all"
                  >
                    <Avatar className="h-9 w-9">
                      {user?.image && (
                        <AvatarImage src={user.image} alt={user.name ?? ""} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader className="flex flex-row items-center justify-between pr-10">
                <SheetTitle className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Brain className="h-4 w-4" />
                  </div>
                  <span>Quiz Generator</span>
                </SheetTitle>
                <ThemeToggle />
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-4">
                {/* User info (if authenticated) */}
                {isAuthenticated && (
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      {user?.image && (
                        <AvatarImage src={user.image} alt={user.name ?? ""} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation Section */}
                <div className="flex flex-col gap-1">
                  <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Navigation
                  </p>
                  <nav className="flex flex-col gap-0.5">
                    {isDashboard ? (
                      <>
                        <Link
                          to="/dashboard"
                          activeOptions={{ exact: true }}
                          activeProps={{
                            className: "text-foreground bg-muted",
                          }}
                          inactiveProps={{
                            className:
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          }}
                          onClick={closeMobileMenu}
                          className={MOBILE_NAV_LINK_BASE}
                        >
                          <Home className="h-4 w-4" />
                          Overview
                        </Link>
                        <Link
                          to="/dashboard/created"
                          activeProps={{
                            className: "text-foreground bg-muted",
                          }}
                          inactiveProps={{
                            className:
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          }}
                          onClick={closeMobileMenu}
                          className={MOBILE_NAV_LINK_BASE}
                        >
                          <FileText className="h-4 w-4" />
                          Created
                        </Link>
                        <Link
                          to="/dashboard/taken"
                          activeProps={{
                            className: "text-foreground bg-muted",
                          }}
                          inactiveProps={{
                            className:
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          }}
                          onClick={closeMobileMenu}
                          className={MOBILE_NAV_LINK_BASE}
                        >
                          <History className="h-4 w-4" />
                          Taken
                        </Link>
                        <Link
                          to="/explore"
                          activeProps={{
                            className: "text-foreground bg-muted",
                          }}
                          inactiveProps={{
                            className:
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          }}
                          onClick={closeMobileMenu}
                          className={MOBILE_NAV_LINK_BASE}
                        >
                          <Compass className="h-4 w-4" />
                          Explore
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/explore"
                          activeProps={{
                            className: "text-foreground bg-muted",
                          }}
                          inactiveProps={{
                            className:
                              "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                          }}
                          onClick={closeMobileMenu}
                          className={MOBILE_NAV_LINK_BASE}
                        >
                          <Compass className="h-4 w-4" />
                          Explore
                        </Link>
                        {isAuthenticated && (
                          <Link
                            to="/dashboard"
                            activeProps={{
                              className: "text-foreground bg-muted",
                            }}
                            inactiveProps={{
                              className:
                                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                            }}
                            onClick={closeMobileMenu}
                            className={MOBILE_NAV_LINK_BASE}
                          >
                            <Home className="h-4 w-4" />
                            Dashboard
                          </Link>
                        )}
                      </>
                    )}
                  </nav>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button asChild className="w-full rounded-none glow-primary">
                    <Link to="/quiz/new" onClick={closeMobileMenu}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Quiz
                    </Link>
                  </Button>

                  {!isAuthenticated && (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full rounded-none"
                    >
                      <Link to="/auth/signin" onClick={closeMobileMenu}>
                        Sign In
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Account Section (authenticated) */}
                {isAuthenticated && (
                  <div className="flex flex-col gap-1 pt-4 border-t">
                    <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Account
                    </p>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        handleSignOut();
                      }}
                      className={`${MOBILE_NAV_LINK_BASE} text-destructive hover:bg-destructive/10 w-full text-left`}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
