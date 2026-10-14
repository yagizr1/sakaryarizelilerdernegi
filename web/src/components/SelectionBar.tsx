import { Button } from "@/components/ui";
import { HiOutlineTrash, HiOutlineX } from "react-icons/hi";

type Props = {
  count: number;
  onCancel: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

export default function SelectionBar({ count, onCancel, onDelete, deleting }: Props) {
  if (count <= 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-[env(safe-area-inset-bottom)] lg:bottom-4">
      <div className="mx-auto flex max-w-lg items-center gap-2 rounded-2xl border border-border bg-white p-2 shadow-lg lg:max-w-xl">
        <button
          type="button"
          onClick={onCancel}
          className="grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50"
          aria-label="Seçimi iptal"
        >
          <HiOutlineX className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 text-sm font-semibold">{count} seçili</div>
        <Button
          type="button"
          variant="danger"
          className="!min-h-10 shrink-0"
          disabled={deleting || count === 0}
          onClick={onDelete}
        >
          <HiOutlineTrash className="h-4 w-4" />
          {deleting ? "Siliniyor..." : "Sil"}
        </Button>
      </div>
    </div>
  );
}
