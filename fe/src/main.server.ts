import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

// Punto de entrada del PRE-RENDERIZADO (se ejecuta solo durante el build, en Node).
// El navegador sigue arrancando por main.ts.
const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppComponent, config, context);

export default bootstrap;
