import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Pencil, Trash2 } from "lucide-react";

export function isMasterActive(isActive?: boolean) {
  return isActive !== false;
}

export function MasterStatusBadge({ isActive }: { isActive?: boolean }) {
  const active = isMasterActive(isActive);
  return (
    <Badge
      variant={active ? "default" : "secondary"}
      className={active ? "bg-success text-success-foreground" : ""}
    >
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

export function MasterRowActions({
  isActive,
  onEdit,
  onToggle,
  onDelete,
  togglePending,
}: {
  isActive?: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  togglePending?: boolean;
}) {
  const active = isMasterActive(isActive);
  return (
    <div className="flex justify-end gap-1 flex-wrap">
      <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={togglePending}
        className="text-xs"
      >
        {active ? "Deactivate" : "Activate"}
      </Button>
      {active && (
        <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

export function MasterToggleDialog({
  item,
  label,
  extra,
  pending,
  onConfirm,
  onClose,
}: {
  item: { name: string; is_active?: boolean } | null;
  label: string;
  extra?: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const deactivating = isMasterActive(item?.is_active);
  return (
    <AlertDialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {deactivating ? `Deactivate ${label}?` : `Activate ${label}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {deactivating
              ? `This will hide "${item?.name}" from new profiles. Existing profiles keep the current value.${extra ? ` ${extra}` : ""}`
              : `This will make "${item?.name}" available again in profile forms.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : deactivating ? "Deactivate" : "Activate"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
