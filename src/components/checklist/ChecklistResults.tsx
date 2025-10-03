import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Check, Download, Trash2, X } from "lucide-react";
import { ChecklistItem, PackingListData } from "./types";

interface ChecklistResultsProps {
  checklistData: PackingListData;
  checklistItems: ChecklistItem[];
  groupedItems: Record<string, ChecklistItem[]>;
  progress: number;
  reminderSet: boolean;
  reminderDays: number | null;
  customTask: string;
  onToggleItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onResetChecklist: () => void;
  onSetReminder: (days: number) => boolean | void;
  onCustomTaskChange: (value: string) => void;
  onCustomTaskSubmit: () => void;
  onDownload: () => void;
  onCopy: () => void;
}

const ChecklistResultsComponent = memo(function ChecklistResults({
  checklistData,
  checklistItems,
  groupedItems,
  progress,
  reminderSet,
  reminderDays,
  customTask,
  onToggleItem,
  onDeleteItem,
  onResetChecklist,
  onSetReminder,
  onCustomTaskChange,
  onCustomTaskSubmit,
  onDownload,
  onCopy,
}: ChecklistResultsProps) {
  return (
    <div className="space-y-4 pb-28">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weather Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">
              {checklistData.weatherContext}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/10 border-secondary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Cultural Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/80">
              {checklistData.culturalTips}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Packing Progress</span>
              <span className="text-muted-foreground">
                {checklistItems.filter((i) => i.checked).length} / {checklistItems.length} items
              </span>
            </div>
            <Progress value={progress} className="h-3 rounded-full" />
            <p className="text-center text-xs uppercase tracking-wide text-muted-foreground">
              {Math.round(progress)}% Complete
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Button onClick={onCopy} variant="outline" className="touch-target text-xs font-semibold">
              Copy
            </Button>
            <Button onClick={onDownload} variant="outline" className="touch-target text-xs font-semibold">
              <Download className="mr-2 h-4 w-4" />Download
            </Button>
            <Button onClick={onResetChecklist} variant="outline" className="touch-target text-xs font-semibold">
              <X className="mr-2 h-4 w-4" />Reset
            </Button>
            <Select onValueChange={(value) => onSetReminder(Number(value))}>
              <SelectTrigger
                className={`touch-target text-xs font-semibold ${reminderSet ? "bg-accent/10 border-accent" : ""}`}
              >
                <SelectValue placeholder="Set Reminder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
                <SelectItem value="14">2 weeks before</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reminderSet && reminderDays && (
            <p className="flex items-center gap-2 text-sm text-accent">
              <Check className="h-4 w-4" /> Reminder set ({reminderDays}d)
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex items-center gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3">
            <Input
              placeholder="Add custom task..."
              value={customTask}
              onChange={(event) => onCustomTaskChange(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && onCustomTaskSubmit()}
              className="touch-target text-sm"
            />
            <Button onClick={onCustomTaskSubmit} size="sm" className="touch-target">
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category} className="overflow-hidden">
          <CardHeader className="bg-muted/60 py-4">
            <CardTitle className="text-base font-semibold">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 py-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-2xl px-2 py-2 hover:bg-muted"
              >
                <button
                  onClick={() => onToggleItem(item.id)}
                  className="flex flex-1 items-center gap-3 text-left touch-target"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                      item.checked ? "bg-accent border-accent" : "border-border"
                    }`}
                  >
                    {item.checked && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      item.checked ? "text-muted-foreground line-through" : "text-foreground"
                    }`}
                  >
                    {item.text}
                  </span>
                </button>
                <Button
                  onClick={() => onDeleteItem(item.id)}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

export default ChecklistResultsComponent;
