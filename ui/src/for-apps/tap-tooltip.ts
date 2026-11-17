import { Directive, OnDestroy, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

/** How long a tapped tooltip stays up. */
const SHOW_MS = 2500;

/** matTooltip that also works on a phone: a tap shows it (for 2.5 s, or until the next tap), instead of Material's
 *  long-press. Mouse hover and keyboard focus work as before. Copy this file into an app as is.
 *
 *    <button appTapTooltip="Restart the job" appTapTooltipPosition="above">…</button>
 *
 *  The tap still does whatever the element does (a link still navigates), so on a link or a button that acts, keep
 *  the label visible too and use the tooltip only for detail. */
@Directive({
  selector: '[appTapTooltip]',
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: [
        'matTooltip: appTapTooltip',
        'matTooltipPosition: appTapTooltipPosition',
        'matTooltipDisabled: appTapTooltipDisabled',
      ],
    },
  ],
  host: { '(pointerup)': 'onTap($event)' },
})
export class TapTooltip implements OnDestroy {
  private readonly tip = inject(MatTooltip, { self: true });
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Material's touch handling is a long-press that also blocks text selection and the tap's click; turn it off
    this.tip.touchGestures = 'off';
  }

  protected onTap(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return; // hover already handles the mouse
    clearTimeout(this.timer);
    if (this.tip._isTooltipVisible()) {
      this.tip.hide(0);
      return;
    }
    this.tip.show(0);
    // a separate timer: hide(delay) right after show() would cancel the show
    this.timer = setTimeout(() => this.tip.hide(0), SHOW_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
