import type { TouchEvent } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Suspense,
  lazy,
} from "react";
import { toast } from "sonner";
import {
  Backpack,
  Bell,
  Calendar,
  Copy,
  Download,
  Loader2,
  MapPin,
  Plus,
  User,
  WifiOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { FloatingActionButton } from "@/components/mobile/FloatingActionButton";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { supabase } from "@/integrations/supabase/client";

import { ChecklistItem, PackingListData } from "./checklist/types";

const ChecklistResults = lazy(() => import("@/components/checklist/ChecklistResults"));

const tabs = [
  { key: "plan", label: "Plan", icon: <MapPin className="h-5 w-5" /> },
  { key: "pack", label: "Pack", icon: <Backpack className="h-5 w-5" /> },
  { key: "reminders", label: "Remind", icon: <Bell className="h-5 w-5" /> },
  { key: "settings", label: "Settings", icon: <User className="h-5 w-5" /> },
];

const travelStyles = [
  { value: "backpacking", label: "Backpacking" },
  { value: "business", label: "Business" },
  { value: "luxury", label: "Luxury" },
  { value: "adventure", label: "Adventure" },
  { value: "family", label: "Family" },
  { value: "solo", label: "Solo" },
];

function triggerHaptic(pattern: number | number[] = 16) {
  if ("vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.error("Haptic feedback not supported", error);
    }
  }
}

export function PackingChecklist() {
  const [activeTab, setActiveTab] = useState<string>("plan");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [travelStyle, setTravelStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [checklistData, setChecklistData] = useState<PackingListData | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [reminderSet, setReminderSet] = useState(false);
  const [reminderDays, setReminderDays] = useState<number | null>(null);
  const [customTask, setCustomTask] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    handleOnlineStatus();
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission("unsupported");
    }
  }, []);

  useEffect(() => {
    if (!checklistData) return;
    const items: ChecklistItem[] = [];
    checklistData.categories.forEach((category) => {
      category.items.forEach((item) => {
        const uniqueId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2);

        items.push({
          id: `${category.name}-${item}-${uniqueId}`,
          text: item,
          checked: false,
          category: category.name,
        });
      });
    });
    setChecklistItems(items);
  }, [checklistData]);

  const progress = useMemo(() => {
    if (checklistItems.length === 0) return 0;
    const completed = checklistItems.filter((item) => item.checked).length;
    return (completed / checklistItems.length) * 100;
  }, [checklistItems]);

  const groupedItems = useMemo(() => {
    return checklistItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, ChecklistItem[]>);
  }, [checklistItems]);

  const handleGenerate = useCallback(
    async (isRefresh = false) => {
      if (!destination || !startDate || !endDate || !ageGroup || !travelStyle) {
        if (!isRefresh) {
          toast.error("Please fill in all fields");
        }
        return;
      }

      if (new Date(endDate) < new Date(startDate)) {
        toast.error("End date must be after start date");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("generate-packing-list", {
          body: { destination, startDate, endDate, ageGroup, travelStyle },
        });

        if (error) throw error;

        setChecklistData(data);
        if (!isRefresh) {
          toast.success("Packing list generated!");
          triggerHaptic();
          setActiveTab("pack");
        } else {
          toast.success("Packing insights refreshed");
        }
      } catch (error) {
        console.error("Error generating packing list:", error);
        toast.error("Failed to generate packing list. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [ageGroup, destination, endDate, startDate, travelStyle]
  );

  const pullToRefreshRef = usePullToRefresh<HTMLDivElement>({
    onRefresh: () => {
      triggerHaptic([10, 20, 10]);
      if (checklistData) {
        toast("Refreshing your packing insights...");
        void handleGenerate(true);
      }
    },
  });

  const toggleItem = useCallback(
    (id: string) => {
      setChecklistItems((items) =>
        items.map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        )
      );
      if (hapticsEnabled) triggerHaptic();
    },
    [hapticsEnabled]
  );

  const deleteItem = useCallback((id: string) => {
    setChecklistItems((items) => items.filter((item) => item.id !== id));
    toast.success("Item deleted");
  }, []);

  const addCustomTask = useCallback(() => {
    if (!customTask.trim()) {
      toast.error("Please enter a task");
      return;
    }

    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: customTask,
      checked: false,
      category: "Custom",
    };

    setChecklistItems((items) => [...items, newItem]);
    setCustomTask("");
    toast.success("Custom task added");
    if (hapticsEnabled) triggerHaptic([10, 16]);
  }, [customTask, hapticsEnabled]);

  const resetChecklist = useCallback(() => {
    setChecklistItems((items) => items.map((item) => ({ ...item, checked: false })));
    toast.success("Checklist reset");
  }, []);

  const setReminder = useCallback(
    (days: number) => {
      if (!startDate) {
        toast.error("Please set travel dates first");
        return false;
      }

      const reminderDate = new Date(startDate);
      reminderDate.setDate(reminderDate.getDate() - days);

      if (reminderDate < new Date()) {
        toast.error("Cannot set reminder for a past date");
        return false;
      }

      setReminderSet(true);
      setReminderDays(days);
      toast.success(`Reminder set for ${days} day${days > 1 ? "s" : ""} before trip`);
      if (hapticsEnabled) triggerHaptic([10, 10, 10]);
      return true;
    },
    [hapticsEnabled, startDate]
  );

  const copyToClipboard = useCallback(() => {
    if (!checklistData) return;

    let text = `PACKING LIST FOR ${destination.toUpperCase()}\n`;
    text += `${startDate} to ${endDate}\n\n`;
    text += `WEATHER: ${checklistData.weatherContext}\n\n`;
    text += `CULTURAL TIPS: ${checklistData.culturalTips}\n\n`;

    checklistItems.forEach((item) => {
      const checkbox = item.checked ? "☑" : "☐";
      text += `${checkbox} ${item.text}\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    if (hapticsEnabled) triggerHaptic([16, 6, 16]);
  }, [checklistData, checklistItems, destination, endDate, hapticsEnabled, startDate]);

  const downloadChecklist = useCallback(() => {
    if (!checklistData) return;

    let text = `PACKING LIST FOR ${destination.toUpperCase()}\n`;
    text += `${startDate} to ${endDate}\n\n`;
    text += `WEATHER: ${checklistData.weatherContext}\n\n`;
    text += `CULTURAL TIPS: ${checklistData.culturalTips}\n\n`;

    checklistItems.forEach((item) => {
      const checkbox = item.checked ? "☑" : "☐";
      text += `${checkbox} ${item.text}\n`;
    });

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `packing-list-${destination.toLowerCase().replace(/\s+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Checklist downloaded!");
  }, [checklistData, checklistItems, destination, endDate, startDate]);

  const requestNotifications = useCallback(async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications are not supported on this device");
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === "granted") {
      toast.success("Notifications enabled");
    } else {
      toast("Notifications remain disabled");
    }
  }, []);

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
            {
              headers: { "User-Agent": "TripWise Mobile/1.0" },
            }
          );
          const data = await response.json();
          const locationLabel = data.address?.city || data.address?.town || data.address?.state || "";
          if (locationLabel) {
            setDestination(locationLabel);
            toast.success(`Destination set to ${locationLabel}`);
          } else {
            toast("Location detected");
          }
        } catch (error) {
          console.error("Reverse geocoding failed", error);
          toast.error("Unable to resolve location");
        }
      },
      () => toast.error("Unable to fetch location"),
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  const handleSwipeTabs = useCallback(() => {
    let startX = 0;
    let endX = 0;

    return {
      onTouchStart: (event: TouchEvent<HTMLDivElement>) => {
        startX = event.touches[0].clientX;
      },
      onTouchEnd: () => {
        const delta = endX - startX;
        const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
        if (Math.abs(delta) > 60) {
          const nextIndex = delta < 0 ? currentIndex + 1 : currentIndex - 1;
          const nextTab = tabs[nextIndex];
          if (nextTab) {
            setActiveTab(nextTab.key);
          }
        }
      },
      onTouchMove: (event: TouchEvent<HTMLDivElement>) => {
        endX = event.touches[0].clientX;
      },
    };
  }, [activeTab]);

  const swipeHandlers = handleSwipeTabs();

  const planContent = (
    <div className="space-y-5">
      <Card className="rounded-3xl border-none bg-gradient-to-br from-background via-background to-primary/5 shadow-lg shadow-primary/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-semibold">Trip Details</CardTitle>
          <CardDescription>Personalize your mobile-ready packing assistant</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" /> Destination
            </Label>
            <div className="flex gap-2">
              <Input
                id="destination"
                placeholder="Tokyo, Paris, New York"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                className="flex-1 touch-target rounded-2xl"
                inputMode="text"
                autoComplete="on"
              />
              <Button variant="secondary" size="icon" className="rounded-2xl" onClick={locateMe}>
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" /> Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="touch-target rounded-2xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4" /> End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="touch-target rounded-2xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <User className="h-4 w-4" /> Age Group
            </Label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="touch-target rounded-2xl">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child (0-12)</SelectItem>
                <SelectItem value="teen">Teen (13-17)</SelectItem>
                <SelectItem value="adult">Adult (18-64)</SelectItem>
                <SelectItem value="senior">Senior (65+)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Download className="h-4 w-4" /> Travel Style
            </Label>
            <ToggleGroup
              type="single"
              className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-2"
              value={travelStyle}
              onValueChange={(value) => value && setTravelStyle(value)}
            >
              {travelStyles.map((style) => (
                <ToggleGroupItem
                  key={style.value}
                  value={style.value}
                  className="touch-target rounded-xl text-xs font-semibold"
                >
                  {style.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <Button
            onClick={() => void handleGenerate(false)}
            disabled={loading}
            className="w-full touch-target rounded-2xl text-base font-semibold shadow-lg shadow-primary/25"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating Your List...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" /> Generate Smart Checklist
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-none bg-muted/40 p-4">
        <CardTitle className="text-base font-semibold">Packing Progress</CardTitle>
        <CardContent className="mt-4 space-y-3 p-0">
          <Progress value={progress} className="h-3 rounded-full" />
          <p className="text-sm text-muted-foreground">
            {checklistItems.filter((item) => item.checked).length} of {checklistItems.length} items packed
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const remindersContent = (
    <div className="space-y-4">
      <Card className="rounded-3xl border-none bg-muted/40 p-6">
        <CardTitle className="text-lg font-semibold">Reminder Center</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Sync reminders across devices with push notifications and offline support.
        </p>
        <div className="mt-6 space-y-4">
          <Button variant="outline" className="w-full rounded-2xl" onClick={() => setShowActions(true)}>
            Schedule packing reminder
          </Button>
          <div className="rounded-2xl bg-background p-4 shadow-sm">
            <p className="text-sm font-semibold">Reminder Status</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {reminderSet && reminderDays
                ? `Reminder scheduled ${reminderDays} day(s) before your trip.`
                : "No reminder scheduled yet."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const settingsContent = (
    <div className="space-y-4">
      <Card className="rounded-3xl border-none bg-muted/40 p-6">
        <CardTitle className="text-lg font-semibold">Mobile Preferences</CardTitle>
        <div className="mt-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Haptic feedback</p>
              <p className="text-xs text-muted-foreground">Vibrate on key actions for tactile response.</p>
            </div>
            <Switch checked={hapticsEnabled} onCheckedChange={setHapticsEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Push notifications</p>
              <p className="text-xs text-muted-foreground">
                {notificationPermission === "granted"
                  ? "Enabled"
                  : notificationPermission === "denied"
                  ? "Denied"
                  : notificationPermission === "unsupported"
                  ? "Unsupported"
                  : "Tap to enable"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={requestNotifications}
              className="rounded-full"
              disabled={notificationPermission === "unsupported"}
            >
              Enable
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const packContent = checklistData ? (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ChecklistResults
        checklistData={checklistData}
        checklistItems={checklistItems}
        groupedItems={groupedItems}
        progress={progress}
        reminderSet={reminderSet}
        reminderDays={reminderDays}
        customTask={customTask}
        onToggleItem={toggleItem}
        onDeleteItem={deleteItem}
        onResetChecklist={resetChecklist}
        onSetReminder={setReminder}
        onCustomTaskChange={setCustomTask}
        onCustomTaskSubmit={addCustomTask}
        onDownload={downloadChecklist}
        onCopy={copyToClipboard}
      />
    </Suspense>
  ) : (
    <Card className="rounded-3xl border-none bg-muted/40 p-8 text-center">
      <CardTitle className="text-lg font-semibold">Generate a packing list to get started</CardTitle>
      <p className="mt-2 text-sm text-muted-foreground">
        Complete your trip details and tap Generate to see personalized recommendations.
      </p>
    </Card>
  );

  return (
    <div className="mobile-shell">
      <header className="mobile-safe-area sticky top-0 z-40 bg-background/95 px-4 py-4 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Trip Wise</h1>
            <p className="text-xs text-muted-foreground">Smart Packing Assistant</p>
          </div>
          {isOffline && (
            <span className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <WifiOff className="h-3.5 w-3.5" /> Offline
            </span>
          )}
        </div>
      </header>

      <main
        ref={pullToRefreshRef}
        className="mobile-content px-4"
        {...swipeHandlers}
      >
        <div className="mx-auto w-full max-w-xl space-y-6 py-6">
          {activeTab === "plan" && planContent}
          {activeTab === "pack" && packContent}
          {activeTab === "reminders" && remindersContent}
          {activeTab === "settings" && settingsContent}
        </div>
      </main>

      <FloatingActionButton
        icon={<Plus className="h-5 w-5" />}
        label="Quick actions"
        onClick={() => setShowActions(true)}
      />

      <BottomTabBar activeTab={activeTab} onChange={setActiveTab} items={tabs} />

      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent side="bottom" className="mobile-safe-area rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Quick Actions</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              className="rounded-2xl"
              variant="secondary"
              onClick={() => {
                setActiveTab("plan");
                setShowActions(false);
              }}
            >
              Update trip details
            </Button>
            <Button
              className="rounded-2xl"
              onClick={() => {
                copyToClipboard();
                setShowActions(false);
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy list
            </Button>
            <Button
              className="rounded-2xl"
              onClick={() => {
                downloadChecklist();
                setShowActions(false);
              }}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            <Button
              className="rounded-2xl"
              variant="outline"
              onClick={() => {
                const scheduled = setReminder(1);
                if (scheduled) {
                  setActiveTab("reminders");
                  setShowActions(false);
                }
              }}
            >
              <Bell className="mr-2 h-4 w-4" /> Reminder tomorrow
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
