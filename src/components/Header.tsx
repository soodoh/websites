import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const [open, setOpen] = useState(false);
  const links = [
    { label: "Work", url: "/#projects" },
    { label: "About", url: "/#about" },
    { label: "Contact", url: "/#contact" },
  ];

  return (
    <header className="fixed top-0 w-full bg-dark-blue z-10 p-4 box-border flex justify-end max-md:py-2 max-md:px-4">
      <nav className="flex gap-8 max-md:hidden">
        {links.map(({ label, url }) => (
          <a
            key={`nav-${label}`}
            className="text-base px-12 text-light-yellow bg-transparent border-none cursor-pointer lowercase"
            href={url}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="hidden max-md:block">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-light-blue hover:text-light-yellow hover:bg-transparent"
              aria-label="Open Navigation"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-dark-blue border-dark-blue"
            showCloseButton={false}
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-light-blue hover:text-light-yellow hover:bg-transparent"
                aria-label="Close Navigation"
              >
                <X className="size-6" />
              </Button>
            </SheetClose>
            <nav className="flex flex-col items-center justify-center h-full gap-8">
              {links.map(({ label, url }) => (
                <a
                  key={`nav-${label}`}
                  className="text-light-yellow text-2xl lowercase"
                  href={url}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
