import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ApiCategoryService } from '@services/api-category.service';
import { IApiCategory } from '@models/category.model';
import { FormUtils } from '@shared/form-utils';
import { ApiProductService } from '@services/api-product.service';
import { AlertService } from '@shared/alert.service';
import { ICreateProduct } from '@models/product.model';
import { IApiPhoto } from '@models/photo.model';
import { environment } from 'src/environments/environment';

// Interfaz para el carrousel de la foto
interface IUiPhoto {
  uiId: string; // ID único temporal para el track del @for
  src: string; // URL para mostrar (blob o http)
  file?: File; // Si es nueva, tiene el archivo
  originalId?: number; // Si es vieja, tiene el ID de la BD
  isNew: boolean;
}

@Component({
  selector: 'app-products-form',
  imports: [ReactiveFormsModule],
  templateUrl: './products-form.component.html',
})
export class ProductsFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private routeActive = inject(ActivatedRoute);
  private location = inject(Location);
  private categoryService = inject(ApiCategoryService);
  private productService = inject(ApiProductService);
  private alertService = inject(AlertService);

  formUtils = FormUtils;

  // Estados
  categories = signal<IApiCategory[]>([]);
  isEditMode = signal(false);
  productId = signal<number | null>(null);

  // UI States
  showCategoryMenu = signal(false);
  showStateMenu = signal(false);

  // --- GALERÍA DE FOTOS ---
  gallery = signal<IUiPhoto[]>([]);

  // Cola de eliminación (IDs del backend que el usuario decidió borrar)
  photosToDeleteIds: number[] = [];

  // Formulario
  formProduct = this.fb.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50),
        Validators.pattern(FormUtils.namePattern),
      ],
    ],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
    price: [0, [Validators.required, Validators.min(0)]],
    brand: ['', [Validators.required]],
    total_sold: [0],
    stock: [0, [Validators.required, Validators.min(0)]],
    state: ['Activo' as 'Activo' | 'Inactivo', [Validators.required]],
    category: [null as IApiCategory | null, [Validators.required]],
    photos: [[]], // array vacío por defecto por si no se cargan fotos
  });

  ngOnInit() {
    this.loadCategories();
    this.checkEditMode();
  }

  // 1. Cargar categorías para el desplegable
  loadCategories() {
    this.categoryService.getAllCategories().subscribe((data) => {
      this.categories.set(data);
    });
  }

  // 2. Verificar si venimos a Editar (por URL)
  checkEditMode() {
    const id = this.routeActive.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.isEditMode.set(true);

      this.productService.getProductById(+id).subscribe({
        next: (product) => {
          this.formProduct.patchValue({
            name: product.name,
            description: product.description,
            price: product.price,
            brand: product.brand,
            stock: product.stock,
            state: product.state,
            total_sold: product.total_sold,
            category: product.category,
          });

          // CARGAR FOTOS EXISTENTES A LA GALERÍA
          if (product.photos) {
            const existingMapped: IUiPhoto[] = product.photos.map((p) => ({
              uiId: `old-${p.id}`,
              src: `${environment.imageBaseUrl}${p.fileName}`,
              originalId: p.id,
              isNew: false,
            }));
            this.gallery.set(existingMapped);
          }
        },
        error: (err) => {
          this.alertService.toast('Error al cargar', 'error');
          this.goBack();
        },
      });
    }
  }

  getExistingPhotoUrl(fileName: string): string {
    return `${environment.imageBaseUrl}${fileName}`;
  }

  // --- LÓGICA DE CATEGORÍA (Acordeon) ---
  toggleCategoryMenu() {
    this.showCategoryMenu.update((v) => !v);
    this.showStateMenu.set(false); // Cierra el otro menú si estaba abierto
  }

  selectCategory(category: IApiCategory) {
    this.formProduct.patchValue({ category: category });
    this.showCategoryMenu.set(false);
  }

  // --- LÓGICA DE ESTADO (Acordeon) ---
  toggleStateMenu() {
    this.showStateMenu.update((v) => !v);
    this.showCategoryMenu.set(false); // Cierra el otro menú
  }

  selectState(state: 'Activo' | 'Inactivo') {
    this.formProduct.patchValue({ state: state });
    this.showStateMenu.set(false);
  }

  // --- MANEJO DE FOTOS ---
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      Array.from(input.files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          // Agregamos la nueva foto a la galería visual
          const newPhoto: IUiPhoto = {
            uiId: `new-${Date.now()}-${Math.random()}`, // ID único temporal
            src: e.target.result,
            file: file,
            isNew: true,
          };
          this.gallery.update((prev) => [...prev, newPhoto]);
        };
        reader.readAsDataURL(file);
      });
    }
    // Limpiamos el input para poder seleccionar el mismo archivo si se borra y se vuelve a agregar
    input.value = '';
  }

  // Reordenamiento con flechas
  movePhoto(index: number, direction: 'left' | 'right') {
    this.gallery.update((currentGallery) => {
      const newGallery = [...currentGallery];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;

      // Límites
      if (targetIndex < 0 || targetIndex >= newGallery.length)
        return currentGallery;

      // Swap (Intercambio)
      [newGallery[index], newGallery[targetIndex]] = [
        newGallery[targetIndex],
        newGallery[index],
      ];
      return newGallery;
    });
  }

  // Lógica para borrar una foto seleccionada antes de subirla
  removePhoto(index: number) {
    this.gallery.update((currentGallery) => {
      const photo = currentGallery[index];

      // Si es una foto vieja, la agendamos para borrar en el backend al guardar
      if (!photo.isNew && photo.originalId) {
        this.photosToDeleteIds.push(photo.originalId);
      }

      // La sacamos de la vista
      return currentGallery.filter((_, i) => i !== index);
    });
  }

  // 4. Guardar
  onSubmit() {
    if (this.formProduct.valid) {
      // 1. Preparamos el objeto JSON limpio (sin archivos)
      const formValue = this.formProduct.getRawValue();

      const productJson: ICreateProduct = {
        name: formValue.name ?? '',
        description: formValue.description ?? '',
        brand: formValue.brand ?? '',
        total_sold: Number(formValue.total_sold),
        price: Number(formValue.price),
        stock: Number(formValue.stock),
        state: formValue.state ?? 'Activo',
        categoryName: formValue.category?.name ?? '',
      };

      // 2. Lógica condicional: ¿Es Crear o Editar?
      if (this.isEditMode() && this.productId()) {
        // --- MODO EDICIÓN ---
        const id = this.productId()!;
        // 1. PRIMERO: Eliminamos las fotos que el usuario borró (Si hay)
        if (this.photosToDeleteIds.length > 0) {
          // Aquí deberías llamar a un servicio que elimine por array o uno por uno
          // Por simplicidad, asumamos que las borramos una por una o creas un endpoint bulk
          this.photosToDeleteIds.forEach((photoId) => {
            this.productService.deletePhoto(photoId).subscribe();
          });
        }
        this.productService.updateProduct(id, productJson).subscribe({
          next: () => {
            const newFiles = this.gallery()
              .filter((p) => p.isNew && p.file)
              .map((p) => p.file!);

            // B. Calcular el orden de las fotos VIEJAS
            // Recorremos la galería visual actual. Si es una foto vieja (tiene originalId),
            // guardamos su nueva posición (índice i).
            const orderPayload = this.gallery()
              .map((photo, index) => {
                if (!photo.isNew && photo.originalId) {
                  return { id: photo.originalId, order: index };
                }
                return null;
              })
              .filter((item) => item !== null) as {
              id: number;
              order: number;
            }[];

            // C. Ejecutar acciones en paralelo (Subir nuevas y Reordenar viejas)
            const tasks = [];

            if (newFiles.length > 0) {
              tasks.push(
                this.productService.uploadPhotos(
                  id,
                  this.createFormData(newFiles),
                ),
              );
            }

            if (orderPayload.length > 0) {
              tasks.push(this.productService.reorderPhotos(orderPayload));
            }

            // Esperar a que todo termine (o navegar directamente si no hay tareas)
            if (tasks.length > 0) {
              // Unimos subscripciones (manera simple: una dentro de otra o forkJoin)
              // Para no complicarte con RxJS avanzado, lo haremos secuencial o simple:

              // Primero reordenamos
              if (orderPayload.length > 0) {
                this.productService.reorderPhotos(orderPayload).subscribe();
              }

              // Luego subimos (o al revés), y al final navegamos
              if (newFiles.length > 0) {
                this.productService
                  .uploadPhotos(id, this.createFormData(newFiles))
                  .subscribe({
                    next: () => this.finishUpdate(),
                    error: () => this.finishUpdate(), // Navegar aunque falle algo no crítico
                  });
              } else {
                // Si solo había reordenamiento, damos un pequeño delay y salimos
                setTimeout(() => this.finishUpdate(), 500);
              }
            } else {
              this.finishUpdate();
            }
          },
          error: (err) =>
            this.alertService.toast('Error al actualizar', 'error'),
        });
      } else {
        // --- MODO CREACIÓN ---
        // --- PASO 1: CREAR PRODUCTO ---
        this.productService.addProduct(productJson).subscribe({
          next: (newProduct) => {
            const filesToUpload = this.gallery()
              .map((p) => p.file)
              .filter((f) => !!f) as File[];
            if (filesToUpload.length > 0) {
              this.uploadImages(newProduct.id, filesToUpload);
            } else {
              this.alertService.toast('Creado con éxito', 'success');
              this.router.navigate(['/admin/products']);
            }
          },
          error: (e) => this.alertService.toast('Error al crear', 'error'),
        });
      }
    } else {
      this.formProduct.markAllAsTouched();
    }
  }

  // Función auxiliar para subir imágenes
  uploadImages(productId: number, files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    this.productService.uploadPhotos(productId, formData).subscribe({
      next: () => {
        this.alertService.toast('Guardado correctamente', 'success');
        this.router.navigate(['/admin/products']);
      },
      error: () => {
        this.alertService.toast('Producto guardado, error en fotos', 'warning');
        this.router.navigate(['/admin/products']);
      },
    });
  }

  createFormData(files: File[]): FormData {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return fd;
  }

  finishUpdate() {
    this.alertService.toast('Producto actualizado', 'success');
    this.router.navigate(['/admin/products']);
  }

  goBack() {
    this.location.back();
  }
}
