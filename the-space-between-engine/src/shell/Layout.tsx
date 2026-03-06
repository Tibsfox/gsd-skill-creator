// Layout — Main layout with navigation sidebar, content area, and responsive breakpoints.
// Desktop: sidebar (240px) + main content
// Tablet: collapsible sidebar + full-width
// Mobile: bottom navigation + full-width

import React, { useState, useEffect, useCallback } from 'react';
import type { FoundationId, LearnerState, ObservatoryView } from '@/types/index';
import { Navigation, MobileNavigation } from './Navigation';
import { ProgressBar } from './ProgressBar';
import { SURFACE, LAYOUT } from './theme';

interface LayoutProps {
  learnerState: LearnerState;
  activeView: ObservatoryView;
  activeFoundation?: FoundationId;
  percentage: number;
  onNavigateWing: (foundation: FoundationId) => void;
  onOpenTelescope: () => void;
  onOpenGarden: () => void;
  children: React.ReactNode;
}

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function getBreakpoint(width: number): Breakpoint {
  if (width < LAYOUT.breakpoints.mobile) return 'mobile';
  if (width < LAYOUT.breakpoints.tablet) return 'tablet';
  return 'desktop';
}

export function Layout({
  learnerState,
  activeView,
  activeFoundation,
  percentage,
  onNavigateWing,
  onOpenTelescope,
  onOpenGarden,
  children,
}: LayoutProps): React.JSX.Element {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => getBreakpoint(window.innerWidth));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    function handleResize() {
      const bp = getBreakpoint(window.innerWidth);
      setBreakpoint(bp);
      // Auto-collapse on tablet
      if (bp === 'tablet') {
        setSidebarCollapsed(true);
      } else if (bp === 'desktop') {
        setSidebarCollapsed(false);
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const isMobile = breakpoint === 'mobile';

  return (
    <div
      className="observatory-layout"
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        backgroundColor: SURFACE.background,
        overflow: 'hidden',
      }}
    >
      {/* Sidebar (desktop/tablet only) */}
      {!isMobile && (
        <Navigation
          learnerState={learnerState}
          activeView={activeView}
          activeFoundation={activeFoundation}
          collapsed={sidebarCollapsed}
          onNavigateWing={onNavigateWing}
          onOpenTelescope={onOpenTelescope}
          onOpenGarden={onOpenGarden}
          onToggleCollapse={toggleCollapse}
        />
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: isMobile ? LAYOUT.bottomNavHeight : 0,
        }}
      >
        <ProgressBar learnerState={learnerState} percentage={percentage} />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <MobileNavigation
          activeView={activeView}
          activeFoundation={activeFoundation}
          onNavigateWing={onNavigateWing}
          onOpenTelescope={onOpenTelescope}
          onOpenGarden={onOpenGarden}
          learnerState={learnerState}
        />
      )}
    </div>
  );
}
