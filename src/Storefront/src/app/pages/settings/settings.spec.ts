import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { BrowserLocation } from '../../core/browser-location';
import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow, KratosUiNode } from '../../core/kratos/kratos-flow.model';
import { Settings } from './settings';

function node(group: string, name: string, type: string, value?: string): KratosUiNode {
  return {
    type: 'input',
    group,
    attributes: { name, type, value, disabled: false, node_type: 'input' },
    messages: [],
    meta: { label: { id: 1, text: `${group}:${name}`, type: 'info' } },
  };
}

const flow: KratosFlow = {
  id: 'flow-2',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/settings?flow=flow-2`,
    method: 'POST',
    messages: [{ id: 1050001, text: 'Your changes have been saved!', type: 'success' }],
    // Shape returned by the real container for the customer schema, plus a
    // totp group standing in for a method no page code knows about yet.
    nodes: [
      node('default', 'csrf_token', 'hidden', 'csrf-value'),
      node('profile', 'traits.email', 'email', 'jane@example.test'),
      node('profile', 'traits.name.first', 'text'),
      node('profile', 'method', 'submit', 'profile'),
      node('password', 'password', 'password'),
      node('password', 'method', 'submit', 'password'),
      node('totp', 'totp_code', 'text'),
      node('totp', 'method', 'submit', 'totp'),
    ],
  },
};

describe('Settings', () => {
  let harness: RouterTestingHarness;
  let httpMock: HttpTestingController;
  let browserLocation: jasmine.SpyObj<BrowserLocation>;

  beforeEach(async () => {
    browserLocation = jasmine.createSpyObj<BrowserLocation>('BrowserLocation', ['assign']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'settings', component: Settings }]),
        { provide: BrowserLocation, useValue: browserLocation },
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => httpMock.verify());

  it('resumes the flow recovery hands off via ?flow=', async () => {
    const settings = await harness.navigateByUrl('/settings?flow=flow-2', Settings);

    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/flows?id=flow-2`).flush(flow);

    expect(settings.flow()).toEqual(flow);
  });

  it('starts a fresh flow when visited without ?flow=', async () => {
    const settings = await harness.navigateByUrl('/settings', Settings);

    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`).flush(flow);

    expect(settings.flow()).toEqual(flow);
  });

  it('renders one section and form per method group, including ones it has never heard of', async () => {
    await harness.navigateByUrl('/settings', Settings);
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`).flush(flow);
    harness.detectChanges();

    const root = harness.routeNativeElement as HTMLElement;
    const sections = Array.from(root.querySelectorAll('section[data-kratos-group]'));
    expect(sections.map((section) => section.getAttribute('data-kratos-group'))).toEqual([
      'profile',
      'password',
      'totp',
    ]);

    // Each form posts only its own method's fields, plus the shared csrf_token.
    const totp = sections[2];
    expect(totp.querySelectorAll('form').length).toBe(1);
    expect(totp.querySelector('[data-kratos-node="totp_code"]')).not.toBeNull();
    expect(totp.querySelector('[data-kratos-node="method:totp"]')).not.toBeNull();
    expect(totp.querySelector('[data-kratos-node="password"]')).toBeNull();
    expect(totp.querySelector('input[type="hidden"]')).not.toBeNull();

    // Flow-level messages show once, not once per section.
    expect(root.textContent?.match(/Your changes have been saved!/g)?.length).toBe(1);
  });

  it('follows the refresh-login redirect when the session is too old to change a credential', async () => {
    const settings = await harness.navigateByUrl('/settings', Settings);
    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`).flush(flow);

    settings.onSubmitted({ password: 'new-password', method: 'password' });

    const refreshUrl = `${KRATOS_PUBLIC_URL}/self-service/login/browser?refresh=true&return_to=x`;
    httpMock
      .expectOne(flow.ui.action)
      .flush(
        { error: { id: 'session_refresh_required' }, redirect_browser_to: refreshUrl },
        { status: 403, statusText: 'Forbidden' },
      );

    expect(browserLocation.assign).toHaveBeenCalledWith(refreshUrl);
    expect(settings.error()).toBeNull();
  });

  it('sends a visitor without a session to log in', async () => {
    const navigateSpy = spyOn(TestBed.inject(Router), 'navigateByUrl').and.callThrough();
    await harness.navigateByUrl('/settings', Settings);

    httpMock
      .expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`)
      .flush({ error: { id: 'session_inactive' } }, { status: 401, statusText: 'Unauthorized' });

    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('surfaces an error when the flow cannot be loaded', async () => {
    const settings = await harness.navigateByUrl('/settings?flow=flow-2', Settings);

    httpMock
      .expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/flows?id=flow-2`)
      .flush(null, { status: 410, statusText: 'Gone' });

    expect(settings.error()).toContain('Could not load');
  });
});
