import { Component } from '@angular/core';
import { HeaderComponent } from '../components/layout/header/header.component';
import { SideBarComponent } from '../components/layout/side-bar/side-bar.component';
import { CommonModule } from '@angular/common';
import { CategoriasComponent } from '../pages/categorias/categorias.component';
import { ItemsComponent } from '../pages/items/items.component';
import { UsuariosComponent } from '../pages/usuarios/usuarios.component';

@Component({
  selector: 'app-home',
  imports: [CommonModule, HeaderComponent, SideBarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  currentComponent: any = null; // Componente actual que se mostrará

  // Método para cargar el componente seleccionado
  loadComponent(componentName: string): void {
    // Mapear nombres de componentes a clases
    const componentMap: { [key: string]: any } = {
      productos: ItemsComponent,
      categorias: CategoriasComponent,
      usuarios: UsuariosComponent,
    };

    // Si el componente actual es el mismo que el seleccionado, deselecciona
    if (this.currentComponent === componentMap[componentName]) {
      this.currentComponent = null; // Cierra la vista
    } else {
      this.currentComponent = componentMap[componentName]; // Cambia al nuevo componente
    }
  }
}
