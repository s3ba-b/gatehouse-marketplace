import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { KratosFlowForm } from './kratos-flow-form';

function buildFlow(): KratosFlow {
  return {
    id: 'flow-1',
    ui: {
      action: 'http://kratos.gatehouse.test:4433/self-service/login?flow=flow-1',
      method: 'POST',
      nodes: [
        {
          type: 'input',
          group: 'default',
          attributes: {
            name: 'csrf_token',
            type: 'hidden',
            value: 'csrf-value',
            disabled: false,
            node_type: 'input',
          },
          messages: [],
          meta: {},
        },
        {
          type: 'input',
          group: 'default',
          attributes: {
            name: 'identifier',
            type: 'email',
            disabled: false,
            node_type: 'input',
          },
          messages: [],
          meta: { label: { id: 1, text: 'Email', type: 'info' } },
        },
        {
          type: 'input',
          group: 'password',
          attributes: {
            name: 'password',
            type: 'password',
            disabled: false,
            node_type: 'input',
          },
          messages: [],
          meta: { label: { id: 2, text: 'Password', type: 'info' } },
        },
        {
          type: 'input',
          group: 'password',
          attributes: {
            name: 'method',
            type: 'submit',
            value: 'password',
            disabled: false,
            node_type: 'input',
          },
          messages: [],
          meta: { label: { id: 3, text: 'Sign in', type: 'info' } },
        },
      ],
    },
  };
}

describe('KratosFlowForm', () => {
  let fixture: ComponentFixture<KratosFlowForm>;
  let component: KratosFlowForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KratosFlowForm],
    }).compileComponents();

    fixture = TestBed.createComponent(KratosFlowForm);
    component = fixture.componentInstance;
    // setInput (not a direct property assignment) so Angular actually calls
    // ngOnChanges, same as a real parent binding would.
    fixture.componentRef.setInput('flow', buildFlow());
    fixture.detectChanges();
  });

  it('renders a labelled field per non-hidden, non-action node', () => {
    const labels = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.kratos-field span:first-child',
    );
    expect(labels.length).toBe(2);
    expect(labels[0].textContent).toContain('Email');
    expect(labels[1].textContent).toContain('Password');
  });

  it('emits the entered values plus the clicked action node on submit', () => {
    const emitted: Record<string, unknown>[] = [];
    component.submitted.subscribe((value) => emitted.push(value));

    component.form.setValue({
      csrf_token: 'csrf-value',
      identifier: 'jane@example.test',
      password: 'correct-horse-battery-staple',
    });

    const submitButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button',
    ) as HTMLButtonElement;
    submitButton.click();

    expect(emitted).toEqual([
      {
        csrf_token: 'csrf-value',
        identifier: 'jane@example.test',
        password: 'correct-horse-battery-staple',
        method: 'password',
      },
    ]);
  });

  it('rebuilds the form when a new flow (e.g. after a validation error) is set', () => {
    const nextFlow = buildFlow();
    nextFlow.ui.nodes[1].messages = [{ id: 4, text: 'not a valid email', type: 'error' }];

    fixture.componentRef.setInput('flow', nextFlow);
    fixture.detectChanges();

    const errorMessage = (fixture.nativeElement as HTMLElement).querySelector(
      '.kratos-message--error',
    );
    expect(errorMessage?.textContent).toContain('not a valid email');
  });
});
