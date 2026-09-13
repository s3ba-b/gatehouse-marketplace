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
  id?: string;
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
  // Set when the flow was started with ?return_to= — e.g. the refresh login
  // a too-old settings submit hands off to carries Kratos's own settings URL
  // here (verified against a real container). Kratos only accepts return_to
  // values allowed by kratos.yml, so following it is not an open redirect.
  return_to?: string;
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

// Kratos's answer when a flow's outcome has nowhere to go but another flow's
// UI — e.g. a successful recovery code has no flow-body or session outcome of
// its own, only the settings flow it hands off to for the password-set step
// (verified against a real container: 422 browser_location_change_required).
export interface KratosBrowserLocationRedirect {
  redirect_browser_to: string;
}

export function isBrowserLocationRedirect(value: unknown): value is KratosBrowserLocationRedirect {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { redirect_browser_to: unknown }).redirect_browser_to === 'string'
  );
}
