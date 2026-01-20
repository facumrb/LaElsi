import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '@admin/components/layout/header/header.component';
import { SideBarComponent } from '@admin/components/layout/side-bar/side-bar.component';
import { ItemsComponent } from '@admin/pages/items/items.component';
import { CategoriasComponent } from '@admin/pages/categorias/categorias.component';
import { UsuariosComponent } from '@admin/pages/usuarios/usuarios.component';

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
