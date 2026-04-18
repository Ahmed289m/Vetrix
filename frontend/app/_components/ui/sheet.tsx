import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

import { cn } from "@/app/_lib/utils";

const SheetContext = React.createContext<{ open: boolean }>({ open: false });

const Sheet = ({
  open,
  onOpenChange,
  children,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Root>) => (
  <SheetPrimitive.Root open={open} onOpenChange={onOpenChange} {...props}>
    <SheetContext.Provider value={{ open: !!open }}>
      {children}
    </SheetContext.Provider>
  </SheetPrimitive.Root>
);

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay asChild {...props} ref={ref} forceMount>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className={cn(
        "fixed inset-0 z-50 bg-black/40 will-change-opacity",
        className,
      )}
    />
  </SheetPrimitive.Overlay>
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-2xl transition-all",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0",
        bottom: "inset-x-0 bottom-0",
        left: "inset-y-0 left-0 h-full w-3/4 rounded-r-2xl sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 rounded-l-2xl sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const variantAnimations = {
  left: { initial: { x: "-100%" }, animate: { x: 0 }, exit: { x: "-100%" } },
  right: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  top: { initial: { y: "-100%" }, animate: { y: 0 }, exit: { y: "-100%" } },
  bottom: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
};

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const { open } = React.useContext(SheetContext); // Need to get open state
  return (
    <SheetPortal forceMount>
      <AnimatePresence>
        {open && (
          <>
            <SheetOverlay />
            <SheetPrimitive.Content asChild ref={ref} {...props} forceMount>
              <motion.div
                variants={
                  variantAnimations[side as keyof typeof variantAnimations]
                }
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.14, ease: [0.25, 0.46, 0.45, 0.94] }}
                className={cn(
                  sheetVariants({ side }),
                  "will-change-transform",
                  className,
                )}
              >
                {children}
                <SheetPrimitive.Close className="absolute right-4 top-4 rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 outline-none hover:bg-white/5 p-2">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </SheetPrimitive.Close>
              </motion.div>
            </SheetPrimitive.Content>
          </>
        )}
      </AnimatePresence>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
