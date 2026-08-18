import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { OnboardingWizard } from "@/features/onboarding/OnboardingWizard";
import { useAppStore } from "@/store/appStore";

export default function App() {
  const hydrated = useAppStore((state) => state.hydrated);
  const onboarded = useAppStore((state) => state.onboarded);
  const hydrate = useAppStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <span className="mono-label text-text-faint">загрузка</span>
      </div>
    );
  }

  return onboarded ? <AppShell /> : <OnboardingWizard />;
}
