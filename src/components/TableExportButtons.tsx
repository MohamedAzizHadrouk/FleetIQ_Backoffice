import { FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from './ui/Button';

type Props = {
  onExportExcel: () => void;
  onExportPdf: () => void;
  disabled?: boolean;
  size?: 'default' | 'compact';
};

/** Exports neutres Industrial Tech (DL § 9.10 – variante neutre). */
export function TableExportButtons({
  onExportExcel,
  onExportPdf,
  disabled = false,
  size = 'default'
}: Props) {
  const btnSize = size === 'compact' ? 'compact' : 'default';
  const iconSize = size === 'compact' ? 14 : 16;

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <Button type="button" variant="neutral" size={btnSize} onClick={onExportExcel} disabled={disabled}>
        <FileSpreadsheet size={iconSize} aria-hidden="true" />
        Exporter Excel
      </Button>
      <Button type="button" variant="neutral" size={btnSize} onClick={onExportPdf} disabled={disabled}>
        <FileText size={iconSize} aria-hidden="true" />
        Exporter PDF
      </Button>
    </div>
  );
}
