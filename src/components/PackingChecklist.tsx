import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  MapPin, Calendar, User, Backpack, Loader2, Copy, Download, 
  Bell, Plus, X, Trash2, Check 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
  category: string;
}

interface ChecklistCategory {
  name: string;
  items: string[];
}

interface PackingListData {
  weatherContext: string;
  culturalTips: string;
  categories: ChecklistCategory[];
}

export function PackingChecklist() {
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

  // Calculate progress
  const progress = checklistItems.length > 0 
    ? (checklistItems.filter(item => item.checked).length / checklistItems.length) * 100 
    : 0;

  useEffect(() => {
    if (checklistData) {
      // Convert categories to flat checklist items
      const items: ChecklistItem[] = [];
      checklistData.categories.forEach(category => {
        category.items.forEach(item => {
          items.push({
            id: `${category.name}-${item}-${Math.random()}`,
            text: item,
            checked: false,
            category: category.name
          });
        });
      });
      setChecklistItems(items);
    }
  }, [checklistData]);

  const handleGenerate = async () => {
    if (!destination || !startDate || !endDate || !ageGroup || !travelStyle) {
      toast.error("Please fill in all fields");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-packing-list', {
        body: { destination, startDate, endDate, ageGroup, travelStyle }
      });

      if (error) throw error;
      
      setChecklistData(data);
      toast.success("Packing list generated!");
    } catch (error) {
      console.error('Error generating packing list:', error);
      toast.error("Failed to generate packing list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setChecklistItems(items => 
      items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setChecklistItems(items => items.filter(item => item.id !== id));
    toast.success("Item deleted");
  };

  const addCustomTask = () => {
    if (!customTask.trim()) {
      toast.error("Please enter a task");
      return;
    }
    
    const newItem: ChecklistItem = {
      id: `custom-${Date.now()}`,
      text: customTask,
      checked: false,
      category: "Custom"
    };
    
    setChecklistItems([...checklistItems, newItem]);
    setCustomTask("");
    toast.success("Custom task added");
  };

  const resetChecklist = () => {
    setChecklistItems(items => items.map(item => ({ ...item, checked: false })));
    toast.success("Checklist reset");
  };

  const setReminder = (days: number) => {
    if (!startDate) {
      toast.error("Please set travel dates first");
      return;
    }

    const reminderDate = new Date(startDate);
    reminderDate.setDate(reminderDate.getDate() - days);

    if (reminderDate < new Date()) {
      toast.error("Cannot set reminder for a past date");
      return;
    }

    setReminderSet(true);
    setReminderDays(days);
    toast.success(`Reminder set for ${days} day${days > 1 ? 's' : ''} before trip`);
  };

  const copyToClipboard = () => {
    if (!checklistData) return;

    let text = `PACKING LIST FOR ${destination.toUpperCase()}\n`;
    text += `${startDate} to ${endDate}\n\n`;
    text += `WEATHER: ${checklistData.weatherContext}\n\n`;
    text += `CULTURAL TIPS: ${checklistData.culturalTips}\n\n`;
    
    checklistItems.forEach(item => {
      const checkbox = item.checked ? "☑" : "☐";
      text += `${checkbox} ${item.text}\n`;
    });

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const downloadChecklist = () => {
    if (!checklistData) return;

    let text = `PACKING LIST FOR ${destination.toUpperCase()}\n`;
    text += `${startDate} to ${endDate}\n\n`;
    text += `WEATHER: ${checklistData.weatherContext}\n\n`;
    text += `CULTURAL TIPS: ${checklistData.culturalTips}\n\n`;
    
    checklistItems.forEach(item => {
      const checkbox = item.checked ? "☑" : "☐";
      text += `${checkbox} ${item.text}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `packing-list-${destination.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    toast.success("Checklist downloaded!");
  };

  // Group items by category for display
  const groupedItems = checklistItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="min-h-screen gradient-hero py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 flex items-center justify-center gap-3">
            <Backpack className="w-10 h-10" />
            Smart Packing Assistant
          </h1>
          <p className="text-lg sm:text-xl opacity-90">
            AI-powered, destination-specific packing lists tailored to you
          </p>
        </div>

        {/* Input Form */}
        <Card className="gradient-card shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Details</CardTitle>
            <CardDescription>
              Tell us about your journey for personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Destination
              </Label>
              <Input
                id="destination"
                placeholder="e.g., Tokyo, Paris, New York"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="touch-target"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="touch-target"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="touch-target"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ageGroup" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Age Group
              </Label>
              <Select value={ageGroup} onValueChange={setAgeGroup}>
                <SelectTrigger id="ageGroup" className="touch-target">
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

            <div className="space-y-2">
              <Label htmlFor="travelStyle" className="flex items-center gap-2">
                <Backpack className="w-4 h-4" />
                Travel Style
              </Label>
              <Select value={travelStyle} onValueChange={setTravelStyle}>
                <SelectTrigger id="travelStyle" className="touch-target">
                  <SelectValue placeholder="Select travel style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="backpacking">Backpacking</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="family">Family</SelectItem>
                  <SelectItem value="solo">Solo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading}
              className="w-full touch-target text-base font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Your List...
                </>
              ) : (
                <>
                  <Backpack className="w-5 h-5 mr-2" />
                  Generate Smart Checklist
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {checklistData && (
          <div className="space-y-4">
            {/* Context Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-primary/10 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Weather Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base">{checklistData.weatherContext}</p>
                </CardContent>
              </Card>

              <Card className="bg-secondary/10 border-secondary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Cultural Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm sm:text-base">{checklistData.culturalTips}</p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Packing Progress</span>
                    <span className="text-muted-foreground">
                      {checklistItems.filter(i => i.checked).length} / {checklistItems.length} items
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <p className="text-center text-xs text-muted-foreground">
                    {Math.round(progress)}% Complete
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={copyToClipboard} 
                variant="outline" 
                size="sm"
                className="touch-target"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              
              <Button 
                onClick={downloadChecklist} 
                variant="outline" 
                size="sm"
                className="touch-target"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              
              <Button 
                onClick={resetChecklist} 
                variant="outline" 
                size="sm"
                className="touch-target"
              >
                <X className="w-4 h-4 mr-2" />
                Reset
              </Button>

              <Select onValueChange={(value) => setReminder(parseInt(value))}>
                <SelectTrigger 
                  className={`w-auto touch-target ${reminderSet ? 'bg-accent/10 border-accent' : ''}`}
                >
                  <Bell className={`w-4 h-4 mr-2 ${reminderSet ? 'text-accent' : ''}`} />
                  <SelectValue placeholder="Set Reminder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">1 week before</SelectItem>
                  <SelectItem value="14">2 weeks before</SelectItem>
                </SelectContent>
              </Select>

              {reminderSet && reminderDays && (
                <span className="text-sm text-accent flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Reminder set ({reminderDays}d)
                </span>
              )}
            </div>

            {/* Add Custom Task */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom task..."
                    value={customTask}
                    onChange={(e) => setCustomTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCustomTask()}
                    className="touch-target"
                  />
                  <Button onClick={addCustomTask} size="sm" className="touch-target">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Checklist by Category */}
            {Object.entries(groupedItems).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-3 p-2 sm:p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                      >
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="flex items-center gap-3 flex-1 text-left touch-target"
                        >
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 border-2 rounded flex items-center justify-center transition-all ${
                            item.checked 
                              ? 'bg-accent border-accent' 
                              : 'border-border hover:border-accent/50'
                          }`}>
                            {item.checked && (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-check" />
                            )}
                          </div>
                          <span className={`text-sm sm:text-base ${
                            item.checked ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {item.text}
                          </span>
                        </button>
                        <Button
                          onClick={() => deleteItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
