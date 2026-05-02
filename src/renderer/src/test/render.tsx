import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '@/components/ui';
import type { ReactElement, ReactNode } from 'react';

interface RenderWithAppProvidersOptions extends RenderOptions {
  initialEntries?: string[];
}

function AppTestProviders({
  children,
  initialEntries = ['/'],
}: {
  children: ReactNode;
  initialEntries?: string[];
}) {
  return (
    <ToastProvider>
      <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
    </ToastProvider>
  );
}

export const renderWithAppProviders = (
  ui: ReactElement,
  options: RenderWithAppProvidersOptions = {},
) => {
  const { initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper({ children }) {
      return <AppTestProviders initialEntries={initialEntries}>{children}</AppTestProviders>;
    },
    ...renderOptions,
  });
};
