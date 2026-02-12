import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ApiPhotoService } from '@services/api-photo.service';
import { AlertService } from '@shared/alert.service';
import { IApiUserPhoto } from '@models/photo.model';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  bootstrapCamera,
  bootstrapTrash,
  bootstrapPerson,
} from '@ng-icons/bootstrap-icons';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-photo-manager',
  imports: [NgIconComponent],
  viewProviders: [
    provideIcons({ bootstrapCamera, bootstrapTrash, bootstrapPerson }),
  ],
  templateUrl: './photo-manager.component.html',
})
export class PhotoManagerComponent {
  private photoService = inject(ApiPhotoService);
  private alertService = inject(AlertService);
  private readonly imageBaseUrl = environment.userImagesUrl;

  currentPhoto = input<IApiUserPhoto | null>(null); // Recibimos la foto actual (o null) desde el padre

  // Signal para mostrar la imagen en pantalla
  previewUrl = signal<string | null>(null);

  // Guardamos el archivo aquí hasta que el padre llame a saveChanges()
  pendingFile = signal<File | null>(null);
  // Bandera para saber si el usuario pidió borrar la foto
  deletePending = signal(false);

  hasChanges = computed(() => !!this.pendingFile() || this.deletePending());

  // Nombre para mostrar iniciales si no hay foto
  userFullName = input<string>('');

  userInitials = computed(() => {
    const fullName = this.userFullName()?.trim();
    if (!fullName) return '';

    const parts = fullName.split(' ').filter((part) => part.length > 0);
    if (parts.length === 0) return '';

    const firstInitial = parts[0].charAt(0);
    // Si hay más de una parte (apellido), tomamos la inicial de la segunda parte
    const secondInitial = parts.length > 1 ? parts[1].charAt(0) : '';
    return (firstInitial + secondInitial).toUpperCase();
  });

  constructor() {
    effect(() => {
      // Usamos paréntesis () porque ahora son signals
      const photo = this.currentPhoto();
      const hasPending = this.pendingFile();
      const isDeleted = this.deletePending();

      if (!hasPending && !isDeleted) {
        if (photo) {
          this.previewUrl.set(`${this.imageBaseUrl}${photo.fileName}`);
        } else {
          this.previewUrl.set(null);
        }
      }
    });
  }

  // SELECCIÓN DE ARCHIVO (Solo visual y memoria)
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      this.alertService.toast('Solo imágenes permitidas', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.alertService.toast('Máximo 2MB', 'warning');
      return;
    }

    // Guardamos en memoria para subir después
    this.pendingFile.set(file);
    this.deletePending.set(false); // Si subo nueva, anulo el borrado

    // Generamos preview local (FileReader) para que el usuario vea la foto
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // BORRADO VISUAL (Marcar para borrar)
  async markForDeletion() {
    const isConfirmed = await this.alertService.confirmDelete(
      'La foto se quitará de la vista previa...',
    );

    if (isConfirmed) {
      this.deletePending.set(true);
      this.pendingFile.set(null);
      this.previewUrl.set(null);
    }
  }

  // MÉTODO PÚBLICO (El Padre llamará a esto al final)
  saveChanges(userId: number): Observable<any> {
    const file = this.pendingFile();
    const isDeleted = this.deletePending();

    // CASO A: Hay un archivo nuevo pendiente
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      return this.photoService.uploadUserPhoto(userId, formData);
    }

    // CASO B: Se marcó para borrar y existe una foto previa
    if (isDeleted) {
      const photo = this.currentPhoto();
      if (photo) {
        return this.photoService.deleteUserPhoto(photo.id);
      }
    }

    // CASO C: No se tocó nada
    return of(null);
  }
}
