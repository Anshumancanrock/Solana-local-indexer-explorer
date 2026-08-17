"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  Moon,
  Sun,
  Search,
  Menu,
  Sparkles,
  ArrowRightLeft,
  Wallet,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { spring } from "@/components/motion";

export function Navbar() {
  const pathname = usePathname();
  const { setTheme } = useTheme();
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const headerShadow = useTransform(
    scrollY,
    [0, 48],
    prefersReduced ? ["0px", "0px"] : ["0px 0px 0px transparent", "0px 8px 32px -8px rgba(0,0,0,0.35)"]
  );

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<{ type: string; value: string }[]>([]);
  const [searching, setSearching] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (query.length >= 4) {
      setSearching(true);
      const fetchSearch = async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setResults(data.results || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setSearching(false);
        }
      };
      const timer = setTimeout(fetchSearch, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setSearching(false);
    }
  }, [query]);

  const handleSelect = (type: string, value: string) => {
    setOpen(false);
    setQuery("");
    if (type === "transaction") router.push(`/transactions/${value}`);
    else if (type === "account") router.push(`/accounts/${value}`);
  };

  const navLinks = [
    { name: "Dashboard", href: "/", icon: Monitor },
    { name: "Transactions", href: "/transactions", icon: ArrowRightLeft },
  ];

  return (
    <>
      <motion.header
        style={prefersReduced ? undefined : { boxShadow: headerShadow }}
        className="sticky top-0 z-50 w-full border-b border-border/30 glass-strong"
        initial={prefersReduced ? false : { y: -20, opacity: 0 }}
        animate={prefersReduced ? undefined : { y: 0, opacity: 1 }}
        transition={prefersReduced ? undefined : spring.gentle}
      >
        <div className="max-w-7xl mx-auto flex h-[3.25rem] items-center px-4 sm:px-6 gap-4">
          <Link href="/" className="flex items-center gap-2.5 group mr-2">
            <motion.div
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border-gradient bg-primary/10"
              whileHover={prefersReduced ? undefined : { scale: 1.05, rotate: 3 }}
              whileTap={prefersReduced ? undefined : { scale: 0.95 }}
              transition={spring.snappy}
            >
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </motion.div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-heading text-sm font-bold tracking-tight">
                Solana<span className="text-gradient-accent">Local</span>
              </span>
              <span className="text-[9px] font-semibold text-muted-foreground tracking-[0.2em] uppercase">
                Explorer
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 rounded-xl bg-muted/30 p-0.5 border border-border/30">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-200",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && !prefersReduced && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border/50"
                      transition={spring.snappy}
                    />
                  )}
                  {isActive && prefersReduced && (
                    <span className="absolute inset-0 rounded-lg bg-background shadow-sm ring-1 ring-border/50" />
                  )}
                  <Icon className="relative h-3.5 w-3.5" />
                  <span className="relative">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1.5">
            <motion.div whileHover={prefersReduced ? undefined : { scale: 1.01 }} whileTap={prefersReduced ? undefined : { scale: 0.98 }}>
              <Button
                variant="outline"
                className="relative hidden md:flex h-8 w-full max-w-[240px] justify-start gap-2 rounded-xl border-border/40 bg-background/40 text-muted-foreground font-normal shadow-none hover:bg-background/70 hover:text-foreground hover:border-primary/30"
                onClick={() => setOpen(true)}
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span className="truncate text-sm">Search…</span>
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center rounded-md border border-border/50 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                  ⌘K
                </kbd>
              </Button>
            </motion.div>

            <Button variant="ghost" size="icon-sm" className="md:hidden rounded-xl" onClick={() => setOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="relative rounded-xl">
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36 rounded-xl">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-3.5 w-3.5" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-3.5 w-3.5" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-3.5 w-3.5" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon-sm" className="rounded-xl">
                  <Menu className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                {navLinks.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={link.href}>{link.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.header>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search Explorer"
        description="Search for transactions and accounts"
      >
        <Command shouldFilter={false} className="rounded-2xl">
          <CommandInput
            placeholder="Signature or account address (min 4 chars)…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {query.length > 0 && query.length < 4 && (
              <CommandEmpty className="text-muted-foreground py-8">
                Keep typing — 4+ characters required
              </CommandEmpty>
            )}
            {query.length >= 4 && searching && (
              <CommandEmpty className="py-8">
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-muted-foreground"
                >
                  Searching…
                </motion.span>
              </CommandEmpty>
            )}
            {query.length >= 4 && !searching && results.length === 0 && (
              <CommandEmpty className="py-8">No results found.</CommandEmpty>
            )}
            <AnimatePresence mode="popLayout">
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={spring.gentle}
                >
                  <CommandGroup heading="Results">
                    {results.map((res, i) => (
                      <motion.div
                        key={`${res.type}-${res.value}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...spring.soft, delay: i * 0.04 }}
                      >
                        <CommandItem
                          value={res.value}
                          onSelect={() => handleSelect(res.type, res.value)}
                          className="gap-3 py-3 mx-1 rounded-xl"
                        >
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                              res.type === "transaction"
                                ? "bg-primary/15 text-primary"
                                : "bg-accent text-primary"
                            )}
                          >
                            {res.type === "transaction" ? (
                              <ArrowRightLeft className="h-3.5 w-3.5" />
                            ) : (
                              <Wallet className="h-3.5 w-3.5" />
                            )}
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="truncate font-mono text-xs">{res.value}</span>
                            <Badge variant="outline" className="w-fit h-4 px-1.5 text-[10px] capitalize">
                              {res.type}
                            </Badge>
                          </div>
                        </CommandItem>
                      </motion.div>
                    ))}
                  </CommandGroup>
                </motion.div>
              )}
            </AnimatePresence>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
