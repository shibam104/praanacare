import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ isDark, onToggle }: ThemeToggleProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className="glass-card border-primary/40 text-primary hover:bg-primary/15 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-md"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
      <span className="ml-2 hidden sm:inline font-medium">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </Button>
  );
}