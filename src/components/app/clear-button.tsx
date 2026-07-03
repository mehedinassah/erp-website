import { DeleteButton } from "@/components/ui/delete-button";

/** Admin-only "clear this section" control (wraps the confirm-dialog button). */
export function ClearButton({
  action,
  entity,
  description,
}: {
  action: () => Promise<void>;
  entity: string;
  description: string;
}) {
  return (
    <DeleteButton
      action={action}
      entity={entity}
      label="Clear page"
      confirmLabel="Clear all"
      description={description}
      confirmPhrase="CLEAR"
    />
  );
}
