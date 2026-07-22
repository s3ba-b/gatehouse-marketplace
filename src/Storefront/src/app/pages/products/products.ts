import { CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { GATEWAY_URL } from '../../core/gatehouse-endpoints';

interface Product {
  id: number;
  name: string;
  price: number;
}

// The walking skeleton's payoff (issue #10): this call only succeeds if the
// browser's Kratos session cookie made it through Oathkeeper (cookie_session
// authenticator -> allow authorizer -> id_token mutator) and the Catalog
// service accepted the minted JWT — the full Angular -> Kratos -> Oathkeeper
// -> Catalog chain, in one request.
@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './products.html',
})
export class Products implements OnInit {
  private readonly http = inject(HttpClient);

  readonly products = signal<Product[] | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.http.get<Product[]>(`${GATEWAY_URL}/products`, { withCredentials: true }).subscribe({
      next: (products) => this.products.set(products),
      error: () => this.error.set('Could not load products — please log in first.'),
    });
  }
}
