import Navbar from "./Navbar";

export const Layout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
      <Navbar />
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
};

export default Layout;
