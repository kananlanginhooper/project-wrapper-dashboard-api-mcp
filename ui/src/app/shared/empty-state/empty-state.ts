import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A quiet centered message for "nothing here" states. */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ message() }}</p>`,
  styles: `
    :host {
      display: block;
      padding: var(--app-space-5);
    }
    p {
      margin: 0;
      color: var(--app-muted);
      font: var(--app-text-md);
    }
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
}
