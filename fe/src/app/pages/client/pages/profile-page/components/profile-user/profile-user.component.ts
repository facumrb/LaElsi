import {
  Component,
  EventEmitter,
  inject,
  input,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { bootstrapShieldLock } from '@ng-icons/bootstrap-icons';
import { IApiClient } from '@models/user.model';
import { ApiClientService } from '@services/api-client.service';
import Swal from 'sweetalert2';
import { PhotoManagerComponent } from '@shared/components/photo-manager/photo-manager.component';
import { FormUtils } from '@shared/form-utils';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-profile-user',
  imports: [ReactiveFormsModule, NgIconComponent, PhotoManagerComponent],
  viewProviders: [provideIcons({ bootstrapShieldLock })],
  templateUrl: './profile-user.component.html',
})
export class ProfileUserComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiClientService = inject(ApiClientService);

  profile = input<IApiClient | null>(null);

  @Output() profileUpdated = new EventEmitter<void>();
  @ViewChild(PhotoManagerComponent) photoManager!: PhotoManagerComponent;

  saving = signal(false);

  formUsuario = this.fb.nonNullable.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(4),
        Validators.maxLength(30),
        Validators.pattern(FormUtils.usernamePattern),
        FormUtils.notOnlyWhiteSpace,
      ],
    ],
    password: [
      '',
      [
        Validators.maxLength(100),
        Validators.pattern(FormUtils.passwordPattern),
      ],
    ],
  });

  ngOnInit() {
    if (this.profile()) {
      this.patchForm(this.profile()!);
    }
  }

  ngOnChanges() {
    if (this.profile()) {
      this.patchForm(this.profile()!);
    }
  }

  private patchForm(fullUser: IApiClient) {
    this.formUsuario.patchValue({
      username: fullUser.username || '',
    });
  }

  onSubmit() {
    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const userId = this.profile()?.id;
    if (!userId) return;

    this.saving.set(true);
    const rawValue = this.formUsuario.getRawValue();

    const clientData: any = {
      username: rawValue.username,
    };
    if (rawValue.password && rawValue.password.trim() !== '') {
      clientData.password = rawValue.password;
    }

    this.apiClientService
      .updateClient(userId, clientData)
      .pipe(switchMap(() => this.photoManager.saveChanges(userId)))
      .subscribe({
        next: () => {
          this.saving.set(false);
          Swal.fire('¡Éxito!', 'Datos de usuario actualizados', 'success');
          this.formUsuario.get('password')?.setValue('');
          this.profileUpdated.emit();
        },
        error: (err) => {
          this.saving.set(false);
          console.error(err);
          Swal.fire(
            'Error',
            err.error?.message || 'Error al actualizar',
            'error',
          );
        },
      });
  }
}
