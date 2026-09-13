import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { KratosFlowService } from '../../core/kratos/kratos-flow.service';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from '../../shared/kratos-flow-form/kratos-flow-form';

// Minimal settings page — just enough to carry recovery's (issue #26)
// password-set step on the generic flow-node renderer. Issue #27 is where
// this page grows a profile-update story and graceful privileged-session
// re-auth handling.
@Component({
  selector: 'app-settings',
  imports: [KratosFlowForm],
  templateUrl: './settings.html',
})
export class Settings implements OnInit {
  private readonly kratosFlows = inject(KratosFlowService);
  private readonly route = inject(ActivatedRoute);

  readonly flow = signal<KratosFlow | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    // Recovery's completion redirects here with ?flow=<id> — the settings
    // flow it already created for the password-set step (kratos.yml's
    // recovery flow, verified against a real container) — rather than a
    // fresh flow being started. Visiting this page directly with an existing
    // session starts a new one instead.
    const flowId = this.route.snapshot.queryParamMap.get('flow');
    const flow$ = flowId
      ? this.kratosFlows.getSettingsFlow(flowId)
      : this.kratosFlows.initSettingsFlow();

    flow$.subscribe({
      next: (flow) => this.flow.set(flow),
      error: () => this.error.set('Could not load account settings. Please try again.'),
    });
  }

  onSubmitted(values: Record<string, unknown>): void {
    const flow = this.flow();
    if (!flow) {
      return;
    }

    this.kratosFlows.submitFlow(flow, values).subscribe({
      next: (result) => {
        if (result.kind === 'needs-input') {
          this.flow.set(result.flow);
        }
      },
      error: () => this.error.set('Could not save changes. Please try again.'),
    });
  }
}
