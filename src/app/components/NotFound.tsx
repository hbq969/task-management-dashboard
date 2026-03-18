import { Link } from 'react-router';
import { Button } from './ui/button';
import { Home } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl mb-4">404</h1>
      <p className="text-muted-foreground mb-6">页面未找到</p>
      <Button asChild>
        <Link to="/">
          <Home className="w-4 h-4 mr-2" />
          返回首页
        </Link>
      </Button>
    </div>
  );
}