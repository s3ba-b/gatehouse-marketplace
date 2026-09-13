import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BrowserLocation } from '../../core/browser-location';
import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

// Account settings (issue #27) on Kratos's settings flow: one section and form
// per method group the flow returns — profile and password today; totp and
// webauthn sections appear on their own once those methods are enabled in
// kratos.yml (issues #28/#29), since no group is named here.
@Component({
  selector: 'app-settings',
  imports: [KratosFlowForm],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly browserLocation = inject(BrowserLocation);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  // "default" only carries the csrf_token every method's form needs, so it's
  // folded into each section rather than being a section of its own.
  readonly methodGroups = computed(() => [
    ...new Set(
      (this.flow()?.ui.nodes ?? [])
        .map((node) => node.group)
        .filter((group) => group !== 'default'),
    ),
  ]);

  ngOnInit(): void {
    // Arrives with ?flow=<id> from recovery's hand-off (issue #26) or back
    // from a refresh login (see onSubmitted) — resuming that flow rather than
    // starting a new one. Visiting this page directly starts a fresh one.
    const flowId = this.route.snapshot.queryParamMap.get('flow');
    const flow$ = flowId
      ? this.kratosFlows.getSettingsFlow(flowId)
      : this.kratosFlows.initSettingsFlow();

    flow$.subscribe({
      next: (flow) => this.flow.set(flow),
      error: (error: HttpErrorResponse) => {
        // No session at all: Kratos answers 401 session_inactive with no
        // redirect_browser_to of its own (verified against a real container),
        // so send the user to log in rather than leaving them at an error.
        if (error.status === 401) {
          void this.router.navigateByUrl('/login');
          return;
        }
        this.error.set('Could not load account settings. Please try again.');
      },
    });
  }

  groupTitle(group: string): string {
    return group.charAt(0).toUpperCase() + group.slice(1);
  }

  onSubmitted(values: Record<string, unknown>): void {
    const flow = this.flow();
    if (!flow) {
      return;
    }

    this.kratosFlows.submitFlow(flow, values).subscribe({
      next: (result) => {
        if (result.kind === 'redirect') {
          // Session older than kratos.yml's privileged_session_max_age: Kratos
          // refuses the change (403 session_refresh_required) and points at a
          // refresh login on its own host, whose return_to brings the browser
          // back to this same flow afterwards to resubmit (verified against a
          // real container). A Kratos URL, so a full navigation, not the Router.
          this.browserLocation.assign(result.url);
        } else if (result.kind === 'needs-input') {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Could not save changes. Please try again.'),
    });
  }
}
