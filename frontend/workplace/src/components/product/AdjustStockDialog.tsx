import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { productVariantApi } from "@/api/productVariantApi";
import type {
  AdjustStockInput,
  ProductVariant,
  StockAction,
} from "@/types/productVariant";
import type { Location } from "@/types/location";

interface AdjustStockDialogProps {
  variant: ProductVariant | null;
  locations: Location[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdjustStockDialog = ({
  variant,
  locations,
  open,
  onOpenChange,
}: AdjustStockDialogProps) => {
  const queryClient = useQueryClient();
  const [locationId, setLocationId] = useState("");
  const [action, setAction] = useState<StockAction>("add");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: adjustStock, isPending } = useMutation({
    mutationFn: (input: AdjustStockInput) =>
      productVariantApi.adjustStock(variant!._id, input),
    onSuccess: () => {
      // Broad prefix invalidation — catches both the variant list query
      // and any single-variant detail query in one go.
      queryClient.invalidateQueries({ queryKey: ["variant"] });
      toast.success("Stock updated.");
      handleClose();
    },
    onError: (err: { message: string }) => {
      setError(err.message ?? "Failed to update stock.");
    },
  });

  const handleClose = () => {
    setLocationId("");
    setAction("add");
    setQuantity("");
    setError(null);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!locationId) {
      setError("Select a location.");
      return;
    }
    const parsedQuantity = Number(quantity);
    if (!quantity || Number.isNaN(parsedQuantity) || parsedQuantity < 0) {
      setError("Enter a valid, non-negative quantity.");
      return;
    }
    adjustStock({ location: locationId, action, quantity: parsedQuantity });
  };

  // Shown for context so "remove 5" or "set to 20" isn't a guess.
  const currentQuantity =
    variant?.stock.find((line) => line.location === locationId)?.quantity ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {variant ? `SKU: ${variant.sku}` : ""}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <select
              id="location"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              disabled={isPending}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.name} ({l.type})
                </option>
              ))}
            </select>
            {locationId && (
              <p className="text-xs text-muted-foreground">
                Current quantity here: {currentQuantity}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="action">Action</Label>
            <select
              id="action"
              value={action}
              onChange={(e) => setAction(e.target.value as StockAction)}
              disabled={isPending}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              <option value="add">Add to existing</option>
              <option value="remove">Remove from existing</option>
              <option value="set">Set exact quantity</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustStockDialog;
