import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  // Use light theme to match app design
  const theme = "light";

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      duration={1500}
      toastOptions={{
        duration: 1500,
        classNames: {
          toast:
            "group toast rounded-none border-2 border-black bg-white text-[#111111] font-sans shadow-lg group-[.toaster]:bg-white group-[.toaster]:text-[#111111] group-[.toaster]:border-black",
          description: "group-[.toast]:text-[#111111] group-[.toast]:opacity-80 group-[.toast]:font-sans",
          title: "group-[.toast]:font-sans group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-tight group-[.toast]:text-[#111111]",
          actionButton: "group-[.toast]:bg-[#111111] group-[.toast]:text-white group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:rounded-none group-[.toast]:font-sans group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-tight group-[.toast]:hover:bg-[#333333]",
          cancelButton: "group-[.toast]:bg-white group-[.toast]:text-[#111111] group-[.toast]:border-2 group-[.toast]:border-black group-[.toast]:rounded-none group-[.toast]:font-sans group-[.toast]:font-black group-[.toast]:uppercase group-[.toast]:tracking-tight group-[.toast]:hover:bg-[#F2F0E9]",
          error: "group-[.toast]:border-[#FF3B30]",
          success: "group-[.toast]:border-black",
          info: "group-[.toast]:border-black",
          warning: "group-[.toast]:border-[#FF9800]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
