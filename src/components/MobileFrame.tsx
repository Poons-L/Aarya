import { ReactNode } from 'react';

interface MobileFrameProps {
  children: ReactNode;
  showStatusBar?: boolean;
}

export function MobileFrame({ children, showStatusBar = true }: MobileFrameProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="relative w-full max-w-[414px] h-[896px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-slate-800">
        {showStatusBar && (
          <div className="absolute top-0 left-0 right-0 h-11 bg-white z-50 flex items-center justify-between px-8">
            <span className="text-sm font-semibold">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-3 border border-black rounded-sm">
                <div className="w-2 h-1.5 bg-black m-0.5"></div>
              </div>
            </div>
          </div>
        )}
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
