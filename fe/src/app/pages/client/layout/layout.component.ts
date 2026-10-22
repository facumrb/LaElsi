import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { TermsGateComponent } from '../components/terms-gate/terms-gate.component';

@Component({
  selector: 'app-layout',
  imports: [NavbarComponent, FooterComponent, RouterOutlet, TermsGateComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {}
