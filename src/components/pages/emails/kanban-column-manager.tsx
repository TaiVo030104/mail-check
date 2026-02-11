import { Check, Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface KanbanColumn {
  id: string;
  title: string;
  label: string;
  description?: string;
}

interface KanbanColumnManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
  onAddColumn: (column: Omit<KanbanColumn, "id">) => void;
  onUpdateColumn: (id: string, column: Partial<KanbanColumn>) => void;
  onDeleteColumn: (id: string) => void;
}

export function KanbanColumnManager({
  open,
  onOpenChange,
  columns,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
}: KanbanColumnManagerProps) {
  const [newColumn, setNewColumn] = useState({ title: "", label: "", description: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ title: "", label: "", description: "" });

  const defaultColumns = ["inbox", "todo", "in-progress", "done", "snoozed"];

  const handleAddColumn = () => {
    if (!newColumn.title || !newColumn.label) return;
    onAddColumn(newColumn);
    setNewColumn({ title: "", label: "", description: "" });
  };

  const handleStartEdit = (column: KanbanColumn) => {
    setEditingId(column.id);
    setEditValues({
      title: column.title,
      label: column.label,
      description: column.description || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    onUpdateColumn(editingId, editValues);
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const isDefault = (id: string) => defaultColumns.includes(id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Manage Kanban Columns</DialogTitle>
          <DialogDescription>
            Add, edit, or remove custom columns for your Kanban board. Default columns cannot be
            deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {}
          <div className="space-y-2">
            <Label>Existing Columns</Label>
            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-3">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="flex items-center gap-2 rounded border bg-muted/30 p-2"
                >
                  {editingId === column.id ? (
                    <>
                      <div className="grid flex-1 grid-cols-2 gap-2">
                        <Input
                          value={editValues.title}
                          onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                          placeholder="Title"
                          size={1}
                        />
                        <Input
                          value={editValues.label}
                          onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                          placeholder="Label"
                          size={1}
                        />
                        <Input
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues({ ...editValues, description: e.target.value })
                          }
                          placeholder="Description"
                          className="col-span-2"
                          size={1}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSaveEdit}
                        className="size-8"
                      >
                        <Check className="size-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancelEdit}
                        className="size-8"
                      >
                        <X className="size-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{column.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {column.label}
                          </Badge>
                          {isDefault(column.id) && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        {column.description && (
                          <p className="text-xs text-muted-foreground">{column.description}</p>
                        )}
                      </div>
                      {!isDefault(column.id) && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(column)}
                            className="size-8"
                          >
                            <Edit2 className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteColumn(column.id)}
                            className="size-8 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {}
          <div className="space-y-2">
            <Label>Add New Column</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={newColumn.title}
                onChange={(e) => setNewColumn({ ...newColumn, title: e.target.value })}
                placeholder="Column Title (e.g., Review)"
              />
              <Input
                value={newColumn.label}
                onChange={(e) => setNewColumn({ ...newColumn, label: e.target.value })}
                placeholder="Label (e.g., review)"
              />
              <Input
                value={newColumn.description}
                onChange={(e) => setNewColumn({ ...newColumn, description: e.target.value })}
                placeholder="Description (optional)"
                className="col-span-2"
              />
            </div>
            <Button onClick={handleAddColumn} className="w-full">
              <Plus className="mr-2 size-4" />
              Add Column
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
