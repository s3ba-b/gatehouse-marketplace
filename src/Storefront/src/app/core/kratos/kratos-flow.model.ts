// Shape of Kratos's self-service flow UI model — deliberately generic
// (matches Kratos's own "ui nodes" schema) so new fields, groups, or methods
// (TOTP, WebAuthn, social login in M1) render without any code change here.
// See https://www.ory.sh/docs/kratos/concepts/ui-user-interface for the model.

export interface KratosUiText {
  id: number;
  text: string;
  type: 'info' | 'error' | 'success';
}

export interface KratosUiNodeAttributes {
  name: string;
  type: string;
  value?: string | number | boolean;
  required?: boolean;
  disabled: boolean;
  node_type: 'input' | 'text' | 'img' | 'a' | 'script';
  src?: string;
  href?: string;
  autocomplete?: string;
}

export interface KratosUiNode {
  type: 'input' | 'text' | 'img' | 'a' | 'script';
  group: string;
  attributes: KratosUiNodeAttributes;
  messages: KratosUiText[];
  meta: { label?: KratosUiText };
}

export interface KratosUiContainer {
  action: string;
  method: string;
  nodes: KratosUiNode[];
  messages?: KratosUiText[];
}

export interface KratosFlow {
  id: string;
  ui: KratosUiContainer;
}

export function isKratosFlow(value: unknown): value is KratosFlow {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'ui' in value &&
    typeof (value as { ui: unknown }).ui === 'object'
  );
}
