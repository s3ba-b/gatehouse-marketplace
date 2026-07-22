import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { KratosFlow, KratosUiNode, KratosUiText } from '../../core/kratos/kratos-flow.model';

// Renders whatever fields the Kratos flow's ui.nodes describe, generically —
// no field is named in this component — so M1's added methods (TOTP,
// WebAuthn, social login) render without changing this component (issue #10).
@Component({
  selector: 'app-kratos-flow-form',
  imports: [ReactiveFormsModule],
  templateUrl: './kratos-flow-form.html',
})
export class KratosFlowForm implements OnChanges {
  @Input({ required: true }) flow!: KratosFlow;
  @Output() readonly submitted = new EventEmitter<Record<string, unknown>>();

  form = new FormGroup({});

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['flow']) {
      this.rebuildForm();
    }
  }

  get flowMessages(): KratosUiText[] {
    return this.flow.ui.messages ?? [];
  }

  get hiddenFieldNodes(): KratosUiNode[] {
    return this.inputNodes.filter((node) => node.attributes.type === 'hidden');
  }

  get textFieldNodes(): KratosUiNode[] {
    return this.inputNodes.filter(
      (node) =>
        node.attributes.type !== 'hidden' &&
        node.attributes.type !== 'checkbox' &&
        !this.isActionNode(node),
    );
  }

  get checkboxFieldNodes(): KratosUiNode[] {
    return this.inputNodes.filter((node) => node.attributes.type === 'checkbox');
  }

  get actionNodes(): KratosUiNode[] {
    return this.inputNodes.filter((node) => this.isActionNode(node));
  }

  labelFor(node: KratosUiNode): string {
    return node.meta.label?.text ?? node.attributes.name;
  }

  // Kratos node names are dot-paths (e.g. "traits.email"); Angular's
  // FormGroup warns about "." in a control key because it looks like a
  // nested-path typo, so this is the (bijective, reversed via inputNodes
  // below) form-control key derived from it.
  controlKey(name: string): string {
    return name.replace(/\./g, '__');
  }

  // A single code path for both "Enter" and a button click: the browser
  // reports which button triggered the submit as event.submitter in both
  // cases (per the HTML submission algorithm), so multiple action nodes
  // (e.g. a future social-login button alongside "sign in") resolve
  // correctly without per-button click handlers double-firing this.
  onFormSubmit(event: Event): void {
    const submitter = (event as SubmitEvent).submitter as HTMLButtonElement | null;
    const node = submitter
      ? this.actionNodes.find(
          (candidate) =>
            candidate.attributes.name === submitter.name &&
            String(candidate.attributes.value) === submitter.value,
        )
      : this.actionNodes[0];

    if (!node) {
      return;
    }

    const values: Record<string, unknown> = {};
    for (const inputNode of this.inputNodes) {
      if (this.isActionNode(inputNode)) {
        continue;
      }
      values[inputNode.attributes.name] = this.form.get(
        this.controlKey(inputNode.attributes.name),
      )?.value;
    }
    values[node.attributes.name] = node.attributes.value ?? '';
    this.submitted.emit(values);
  }

  private get inputNodes(): KratosUiNode[] {
    return this.flow.ui.nodes.filter((node) => node.type === 'input');
  }

  private isActionNode(node: KratosUiNode): boolean {
    return node.attributes.type === 'submit' || node.attributes.type === 'button';
  }

  private rebuildForm(): void {
    const controls: Record<string, FormControl> = {};

    for (const node of this.inputNodes) {
      if (this.isActionNode(node)) {
        continue;
      }
      controls[this.controlKey(node.attributes.name)] = new FormControl(
        node.attributes.value ?? '',
      );
    }

    this.form = new FormGroup(controls);
  }
}
