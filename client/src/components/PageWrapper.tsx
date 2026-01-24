interface PageWrapperProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, showNav = true }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
};
