import { useState } from "react";
import { DownloadCloud, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    if (installing) return;

    setInstalling(true);
    const accepted = await promptInstall();
    setInstalling(false);

    if (accepted) {
      toast.success("Trip Wise is installing on your device");
    } else {
      toast("Install prompt dismissed");
    }
  };

  return (
    <Card className="rounded-3xl border-none bg-muted/40 p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <MonitorSmartphone className="h-4 w-4" /> Install Trip Wise
        </CardTitle>
        <CardDescription>
          Save the mobile experience to your home screen for instant offline access.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0 pb-0">
        <div className="rounded-2xl bg-background/70 p-4 text-sm text-muted-foreground">
          {isInstalled
            ? "Trip Wise is already installed as a Progressive Web App."
            : canInstall
            ? "Your browser is ready to install Trip Wise. Tap install to continue."
            : "Add Trip Wise from your browser menu to enable app-like navigation."}
        </div>
        <Button
          onClick={() => void handleInstall()}
          disabled={!canInstall || installing}
          className="rounded-2xl"
        >
          <DownloadCloud className="mr-2 h-4 w-4" />
          {installing ? "Requesting install..." : "Install as PWA"}
        </Button>
      </CardContent>
    </Card>
  );
}
