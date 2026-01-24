import { theme } from '../styles/theme';

interface PageWrapperProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, showNav = true }) => {
  return (
    <div className={`min-h-screen ${theme.gradients.page}`}>
      <div className="max-w-md mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
};
