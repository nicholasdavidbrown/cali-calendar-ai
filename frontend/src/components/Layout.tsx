import Navbar from "./Navbar";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      <Navbar />
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">{children}</main>
    </div>
  );
};

export default Layout;
