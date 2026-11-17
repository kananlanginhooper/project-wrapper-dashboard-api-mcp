import { Directive, ElementRef, OnDestroy, afterNextRender, inject } from '@angular/core';

/** A table that stacks into cards on a phone (≤600px): each row becomes a card, each cell a "Column: value" line.
 *  Copy this file into an app as is; the layout is the .app-stack-table rule in the shared theme.
 *
 *    <table mat-table appStackTable [dataSource]="rows" matSort>…</table>
 *
 *  It works on mat-table (cells carry a cdk-column-<name> class) and on a plain <table> (by column position). It
 *  labels every body cell with its column's header text as data-label, and relabels when rows or columns change. A
 *  cell that already has a data-label keeps it, so set one by hand where the header text isn't the right label.
 *  The header row is hidden on a phone, so put any sort control a phone needs (a select) above the table. */
@Directive({
  selector: 'table[appStackTable]',
  host: { class: 'app-stack-table' },
})
export class StackTable implements OnDestroy {
  private readonly table = inject<ElementRef<HTMLTableElement>>(ElementRef).nativeElement;
  private observer?: MutationObserver;

  constructor() {
    afterNextRender(() => {
      this.label();
      this.observer = new MutationObserver(() => this.label());
      this.observer.observe(this.table, { childList: true, subtree: true, characterData: true });
    });
  }

  private label(): void {
    const heads = [...this.table.querySelectorAll<HTMLElement>('thead th')];
    const byColumn = new Map(heads.map((th) => [column(th), text(th)]));
    for (const tr of this.table.querySelectorAll('tbody tr')) {
      [...tr.children].forEach((td, i) => {
        if (td.hasAttribute('data-label') && !td.hasAttribute('data-auto-label')) return; // set by hand
        const name = column(td as HTMLElement);
        const label = (name && byColumn.get(name)) ?? (heads[i] ? text(heads[i]) : '');
        // the observer doesn't watch attributes, so these writes don't re-trigger it
        if (td.getAttribute('data-label') !== label) {
          td.setAttribute('data-label', label);
          td.setAttribute('data-auto-label', '');
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}

/** mat-table's column name, from its cdk-column-<name> class ('' on a plain table). */
function column(cell: HTMLElement): string {
  return [...cell.classList].find((c) => c.startsWith('cdk-column-'))?.slice(11) ?? '';
}

/** A header cell's visible text (MatSort adds no text, only the arrow). */
function text(th: HTMLElement): string {
  return (th.textContent ?? '').replace(/\s+/g, ' ').trim();
}
