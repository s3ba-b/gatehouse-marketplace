import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';

import { KRATOS_PUBLIC_URL } from '../../core/gatehouse-endpoints';
import { KratosFlow } from '../../core/kratos/kratos-flow.model';
import { Settings } from './settings';

const flow: KratosFlow = {
  id: 'flow-2',
  ui: {
    action: `${KRATOS_PUBLIC_URL}/self-service/settings?flow=flow-2`,
    method: 'POST',
    nodes: [],
  },
};

function configure(queryParamMap: Record<string, string>): void {
  TestBed.configureTestingModule({
    imports: [Settings],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(queryParamMap) } },
      },
    ],
  });
}

describe('Settings', () => {
  let httpMock: HttpTestingController;

  afterEach(() => httpMock.verify());

  it('resumes the flow id passed via ?flow= instead of starting a new one', async () => {
    configure({ flow: 'flow-2' });
    await TestBed.compileComponents();

    const fixture: ComponentFixture<Settings> = TestBed.createComponent(Settings);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    const request = httpMock.expectOne(
      (req) => req.url === `${KRATOS_PUBLIC_URL}/self-service/settings/flows`,
    );
    expect(request.request.params.get('id')).toBe('flow-2');
    expect(request.request.withCredentials).toBeTrue();
    request.flush(flow);

    expect(fixture.componentInstance.flow()).toEqual(flow);
  });

  it('starts a fresh flow when no ?flow= id is present', async () => {
    configure({});
    await TestBed.compileComponents();

    const fixture: ComponentFixture<Settings> = TestBed.createComponent(Settings);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${KRATOS_PUBLIC_URL}/self-service/settings/browser`).flush(flow);

    expect(fixture.componentInstance.flow()).toEqual(flow);
  });

  it('re-renders the flow with the "changes saved" message after a successful submit', async () => {
    configure({ flow: 'flow-2' });
    await TestBed.compileComponents();

    const fixture: ComponentFixture<Settings> = TestBed.createComponent(Settings);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock
      .expectOne((req) => req.url === `${KRATOS_PUBLIC_URL}/self-service/settings/flows`)
      .flush(flow);

    fixture.componentInstance.onSubmitted({ password: 'new-password', method: 'password' });

    const savedFlow: KratosFlow = {
      ...flow,
      ui: {
        ...flow.ui,
        messages: [{ id: 1, text: 'Your changes have been saved!', type: 'success' }],
      },
    };
    httpMock.expectOne(flow.ui.action).flush(savedFlow);

    expect(fixture.componentInstance.flow()).toEqual(savedFlow);
  });
});
