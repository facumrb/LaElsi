import { Component, inject, OnInit } from '@angular/core';
import { IApiProduct } from '@models/product.model';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiProductService } from '@services/api-product.service';
import { IApiCategory } from '@models/category.model';
import { ApiCategoryService } from '@services/api-category.service';

@Component({
  selector: 'app-products-page',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products-page.component.html',
})
export class ProductsPageComponent implements OnInit {
  formProduct!: FormGroup;
  loading: boolean = true;
  errorMessage: string = '';
  private _apiService = inject(ApiProductService);

  isModalOpen = false;
  selectedProduct?: IApiProduct;
  modalMode: 'add' | 'edit' = 'add';
  searchQuery: string = '';

  products: IApiProduct[] = []; // Lista filtrada de productos
  allProducts: IApiProduct[] = []; // Lista completa de productos
  categories: IApiCategory[] = [];
  selectedCategory: number = 0; // Almacena la categoría seleccionada

  private _apiCategoryService = inject(ApiCategoryService);

  constructor(private formBuilder: FormBuilder) {
    this.formProduct = this.formBuilder.group({
      nombre: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      descripcion: [
        '',
        [
          Validators.required,
          Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9.,;:?!()_\'"-\\s]*$'),
        ],
      ],
      precio: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      marca: ['', [Validators.required]],
      cant_vendidos: [
        '',
        [Validators.required, Validators.pattern('^[0-9]*$')],
      ],
      estado: ['', [Validators.required]],
      stock: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      category: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this._apiCategoryService.getAllCategories().subscribe({
      next: (data: IApiCategory[]) => (this.categories = data),
    });
  }

  loadProducts(): void {
    this._apiService.getAllProducts().subscribe({
      next: (data: IApiProduct[]) => {
        this.products = data;
        this.allProducts = data; // Mantener una copia completa de los productos
      },
    });
  }

  // filterByCategorie(event: Event): void {
  //   const selectElement = event.target as HTMLSelectElement; // Aseguramos el tipo como HTMLSelectElement
  //   const categoryName = selectElement.value; // Obtenemos el valor seleccionado
  //   const id = categoryName ? +categoryName : 0; // Convertimos a número o usamos 0 si está vacío

  //   this.selectedCategory = name;

  //   if (id > 0) {
  //     this.products = this.allProducts.filter((product) => product.category.name === name);
  //   } else {
  //     this.products = [...this.allProducts];
  //   }
  // }

  /* cargarCategorie(id: number): void {
    this._apiCategorieService.getCategorieById(id).subscribe({
      next: (data: IApiCategorie) => (this.catNombre = data.nombre),
    });
  } */

  openModal(mode: 'add' | 'edit', product?: IApiProduct): void {
    this.modalMode = mode;
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
    if (mode === 'edit' && product) {
      this.selectedProduct = product;
      this.formProduct.patchValue({
        ...product,
        category: product.category.name,
      });
    } else {
      this.formProduct.reset();
      this.formProduct.patchValue({
        estado: '',
        category: '',
        cant_vendidos: 0,
      });
    }
  }

  closeModal(): void {
    this.isModalOpen = false;
    document.body.style.overflow = '';
  }

  onSubmit(): void {
    if (this.formProduct.valid) {
      console.log(this.formProduct.value);
      const productData = {
        ...this.selectedProduct,
        ...this.formProduct.value,
      };
      const request =
        this.modalMode === 'add'
          ? this._apiService.addProduct(productData)
          : this._apiService.updateProduct(productData.id, productData);

      request.subscribe(() => {
        this.loadProducts();
        this.closeModal();
      });
    }
  }

  deleteProduct(id: number): void {
    if (confirm('¿Seguro que deseas eliminar esta categoría?')) {
      this._apiService.deleteProduct(id).subscribe(() => {
        this.products = this.products.filter((product) => product.id !== id);
      });
    }
  }

  hasErrors(field: string, typeError: string) {
    return (
      this.formProduct.get(field)?.hasError(typeError) &&
      this.formProduct.get(field)?.touched
    );
  }

  onSearch(): void {
    const trimmedQuery = this.searchQuery.trim().toLowerCase();
    if (trimmedQuery) {
      this.products = this.allProducts.filter(
        (product) =>
          product.name.toLowerCase().includes(trimmedQuery) ||
          product.description.toLowerCase().includes(trimmedQuery) ||
          product.brand.toLowerCase().includes(trimmedQuery),
      );
    } else {
      this.products = [...this.allProducts]; // Restablecer la lista completa si la consulta está vacía
    }
  }
}
